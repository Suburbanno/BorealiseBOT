/**
 * bot.js
 *
 * Core BorealiseBot class.
 *
 * Responsibilities:
 *  - Login via @borealise/api REST client
 *  - Connect to the realtime pipeline via @borealise/pipeline
 *  - Auto-woot tracks (optional)
 *  - Auto-join waitlist (optional)
 *  - Reply to @mentions with an AFK message (optional)
 *  - Delegate all chat commands to the CommandRegistry
 *
 * Adding a command: drop a .js file inside commands/ — no changes needed here.
 */

import WebSocket from "ws";
import { createPipeline, Events } from "@borealise/pipeline";
import { CommandRegistry } from "./commands/index.js";
import { loadConfig } from "./config.js";

// ── Dynamic import helper for @borealise/api (CJS package) ───────────────────

async function loadApiPackage() {
  const mod = await import("@borealise/api");
  // CJS default-export interop: module.exports lands on .default in ESM
  const pkg = mod.default ?? mod;
  return { createApiClient: pkg.createApiClient, ApiError: pkg.ApiError };
}

// ── Delays that mirror the main site bot behaviour ────────────────────────────

const WOOT_DELAY_MS = 800;
const JOIN_DELAY_MS = 1_500;

export class BorealiseBot {
  constructor(cfg = loadConfig()) {
    this.cfg = cfg;

    /** @type {import('@borealise/api').ApiClient|null} */
    this._api = null;
    this._token = null;

    // Bot identity (filled after login)
    this._userId = null;
    this._username = null;
    this._displayName = null;

    // Session state
    this._startedAt = null;
    this._wootCount = 0;
    this._reactions = { woots: 0, mehs: 0, grabs: 0 };
    this._currentReactions = { woots: 0, mehs: 0, grabs: 0 };

    // Current track / DJ
    this._currentTrack = null;
    this._djName = null;

    // Waitlist
    this._inWaitlist = false;
    this._waitlistPosition = null;
    this._waitlistTotal = null;
    this._nextDjName = null;

    // Room info
    this._roomName = null;
    /** @type {Record<string,string>} uid → displayName */
    this._roomUsersMap = {};

    // AFK reply cooldown
    this._afkLastReply = 0;

    // Pipeline client (assigned in start())
    this._pipeline = null;

    // Command registry — loads all files from ./commands/ automatically
    this.commands = new CommandRegistry();
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  async start() {
    await this.commands.loadDir(new URL("./commands/", import.meta.url));
    await this._login();
    this._startPipeline();
  }

  async stop() {
    if (this._pipeline) {
      try {
        if (this.cfg.autoJoin) {
          await this._api?.room
            ?.leaveWaitlist(this.cfg.room)
            .catch(() => {});
        }
        await this._api?.room?.leave(this.cfg.room).catch(() => {});
      } catch {
        // best-effort
      }
      this._pipeline.disconnect();
      this._pipeline = null;
    }
    this._log("info", "Bot stopped.");
  }

  // ── Login (REST) ───────────────────────────────────────────────────────────

  async _login() {
    const { createApiClient, ApiError } = await loadApiPackage();

    this._api = createApiClient({
      baseURL: this.cfg.apiUrl,
      timeout: 20_000,
      logging: false,
    });

    // Patch parseError to handle non-object response bodies (library bug workaround)
    const _api = this._api.api;
    if (_api?.parseError) {
      const _orig = _api.parseError.bind(_api);
      _api.parseError = function (error) {
        if (error?.response) {
          const data = error.response.data;
          if (data == null || typeof data !== "object") {
            const msg =
              typeof data === "string"
                ? data
                : (error.message ?? "Request failed");
            return new ApiError(msg, error.response.status, error.code);
          }
        }
        return _orig(error);
      };
    }

    this._log("info", `Logging in as ${this.cfg.email}…`);

    let loginData;
    try {
      const res = await this._api.auth.login({
        login: this.cfg.email,
        password: this.cfg.password,
      });
      loginData = res.data;
    } catch (err) {
      const status = err.status ?? err.response?.status;
      throw new Error(`Login failed (${status ?? "network"}): ${err.message}`);
    }

    const token = loginData?.data?.accessToken ?? loginData?.accessToken;
    if (!token) throw new Error("Login did not return accessToken");

    this._token = token;
    this._api.api.setAuthToken(token);

    // Extract identity from login response
    const loginUser = loginData?.data?.user ?? loginData?.user ?? null;
    if (loginUser) {
      this._userId = loginUser.id ?? loginUser.userId ?? null;
      this._username = loginUser.username ?? null;
      this._displayName = loginUser.displayName ?? loginUser.display_name ?? null;
      this._log(
        "info",
        `Logged in as @${this._username} (id=${this._userId})`
      );
    }

    // Fallback: call auth.me()
    if (!this._userId) {
      try {
        const meRes = await this._api.auth.me();
        const meData = meRes?.data?.data ?? meRes?.data ?? {};
        const me = meData.user ?? meData;
        this._userId = me.id ?? me.userId ?? null;
        this._username = me.username ?? null;
        this._displayName = me.displayName ?? me.display_name ?? null;
        this._log("info", `Identity (me fallback): @${this._username}`);
      } catch (err) {
        this._log("warn", `auth.me() failed: ${err.message}`);
      }
    }
  }

  // ── Pipeline (WebSocket) ───────────────────────────────────────────────────

  _startPipeline() {
    const token = this._token;

    this._pipeline = createPipeline({
      url: this.cfg.wsUrl,
      tokenProvider: () => token,
      webSocketFactory: (url) => new WebSocket(url),
      loggerName: "chatbot",
    });

    // ── Connection lifecycle ────────────────────────────────────────────────

    this._pipeline.onConnection("onReady", (ready) => {
      this._startedAt = Date.now();
      this._wootCount = 0;
      this._reactions = { woots: 0, mehs: 0, grabs: 0 };
      this._currentReactions = { woots: 0, mehs: 0, grabs: 0 };

      this._log("info", `Pipeline ready (session=${ready?.session_id}). Joining #${this.cfg.room}…`);

      // Subscribe to all relevant events
      this._pipeline.subscribe([
        Events.USER_UPDATE,
        Events.ROOM_CHAT_MESSAGE,
        Events.ROOM_DJ_ADVANCE,
        Events.ROOM_WAITLIST_LEAVE,
        Events.ROOM_WAITLIST_UPDATE,
        Events.ROOM_VOTE,
        Events.ROOM_GRAB,
      ]);

      this._joinRoom().catch((err) =>
        this._log("warn", `Join failed: ${err.message}`)
      );
    });

    this._pipeline.onConnection("onDisconnect", (code, reason) => {
      this._log("info", `Disconnected (${code}${reason ? " – " + reason : ""})`);
    });

    this._pipeline.onConnection("onReconnect", () => {
      this._log("info", "Reconnected to pipeline.");
    });

    this._pipeline.onConnection("onError", (err) => {
      this._log("warn", `Pipeline error: ${JSON.stringify(err)}`);
    });

    // ── Dispatch events ─────────────────────────────────────────────────────

    this._pipeline.on(Events.ROOM_DJ_ADVANCE, (data) =>
      this._onDjAdvance(data)
    );
    this._pipeline.on(Events.ROOM_WAITLIST_LEAVE, (data) =>
      this._onWaitlistLeave(data)
    );
    this._pipeline.on(Events.ROOM_WAITLIST_UPDATE, (data) =>
      this._onWaitlistUpdate(data)
    );
    this._pipeline.on(Events.ROOM_VOTE, (data) => this._onVote(data));
    this._pipeline.on(Events.ROOM_GRAB, (data) => this._onGrab(data));
    this._pipeline.on(Events.ROOM_CHAT_MESSAGE, (data) =>
      this._onChatMessage(data)
    );

    this._pipeline.connect();
  }

  // ── Room join ──────────────────────────────────────────────────────────────

  async _joinRoom() {
    const joinRes = await this._api.room.join(this.cfg.room);
    const inner = joinRes?.data?.data ?? joinRes?.data ?? {};
    const roomObj = inner.room ?? inner;
    this._roomName = roomObj.name ?? roomObj.title ?? roomObj.roomName ?? null;

    const users = inner.users ?? [];
    for (const u of users) {
      const uid = u.userId ?? u.user_id ?? u.id;
      if (uid != null) {
        this._roomUsersMap[String(uid)] =
          u.displayName ?? u.display_name ?? u.username ?? null;
      }
    }

    this._log(
      "info",
      `Joined room${this._roomName ? ` "${this._roomName}"` : ""}`
    );

    if (this.cfg.autoJoin) {
      try {
        await this._api.room.joinWaitlist(this.cfg.room);
        this._inWaitlist = true;
        this._log("info", "Joined waitlist.");
        this._refreshWaitlist().catch(() => {});
      } catch (err) {
        this._log("warn", `Initial joinWaitlist failed: ${err.message}`);
      }
    }
  }

  // ── Event handlers ─────────────────────────────────────────────────────────

  _onDjAdvance(data) {
    const media =
      data?.media ?? data?.currentMedia ?? data?.current_media ?? {};
    const dj = data?.dj ?? data?.currentDj ?? data?.current_dj ?? {};

    this._djName = dj.displayName ?? dj.display_name ?? dj.username ?? null;
    this._currentTrack = {
      title: media.title ?? null,
      artist: media.artist ?? media.artistName ?? media.artist_name ?? null,
      duration: media.duration ?? media.length ?? null,
      youtubeId:
        media.sourceId ??
        media.source_id ??
        media.youtubeId ??
        media.youtube_id ??
        media.cid ??
        media.videoId ??
        media.video_id ??
        null,
    };

    this._log(
      "info",
      `DJ_ADVANCE: "${this._currentTrack.title}" by ${this._currentTrack.artist} — DJ: ${this._djName}`
    );

    // Flush current-track counters to session totals
    this._reactions.woots += this._currentReactions.woots;
    this._reactions.mehs += this._currentReactions.mehs;
    this._reactions.grabs += this._currentReactions.grabs;
    this._currentReactions = { woots: 0, mehs: 0, grabs: 0 };

    this._refreshWaitlist().catch(() => {});

    if (this.cfg.autoWoot) {
      setTimeout(() => this._castVote(), WOOT_DELAY_MS);
    }
    if (this.cfg.autoJoin) {
      setTimeout(() => this._tryJoin(), JOIN_DELAY_MS);
    }
  }

  _onWaitlistLeave(data) {
    const leftId = data?.userId ?? data?.user_id;
    const isMe =
      (this._userId && String(leftId) === String(this._userId)) ||
      (this._username &&
        (data?.username ?? "").toLowerCase() === this._username.toLowerCase());

    if (isMe) {
      this._waitlistPosition = null;
      this._inWaitlist = false;
      if (this.cfg.autoJoin) {
        setTimeout(() => this._tryJoin(), JOIN_DELAY_MS);
      }
    }
  }

  _onWaitlistUpdate(data) {
    const wl = data?.waitlist ?? data?.queue ?? [];
    if (Array.isArray(wl)) {
      this._waitlistTotal = wl.length;
      const myIdx = wl.findIndex((u) => this._matchEntry(u));
      this._waitlistPosition = myIdx >= 0 ? myIdx + 1 : null;
      this._nextDjName = wl.length > 0 ? this._resolveName(wl[0]) : null;
    }

    if (this.cfg.autoJoin) {
      setTimeout(() => this._tryJoin(), JOIN_DELAY_MS);
    }
  }

  _onVote(data) {
    if (data?.woots != null) this._currentReactions.woots = data.woots;
    if (data?.mehs != null) this._currentReactions.mehs = data.mehs;
  }

  _onGrab(data) {
    if (data?.grabs != null) this._currentReactions.grabs = data.grabs;
    else this._currentReactions.grabs++;
  }

  _onChatMessage(data) {
    // Skip own messages
    if (
      (this._userId && String(data?.userId ?? data?.user_id) === String(this._userId)) ||
      (this._username &&
        (data?.username ?? "").toLowerCase() === this._username.toLowerCase())
    ) {
      return;
    }

    const content = data?.message ?? data?.content ?? "";
    const sender = {
      userId: data?.userId ?? data?.user_id ?? null,
      username: data?.username ?? null,
      displayName:
        data?.displayName ?? data?.display_name ?? data?.username ?? null,
    };

    // ── Command dispatch ────────────────────────────────────────────────────
    const prefix = this.cfg.cmdPrefix;
    if (content.startsWith(prefix)) {
      const withoutPrefix = content.slice(prefix.length).trimStart();
      const spaceIdx = withoutPrefix.indexOf(" ");
      const name =
        spaceIdx === -1
          ? withoutPrefix.toLowerCase()
          : withoutPrefix.slice(0, spaceIdx).toLowerCase();
      const rawArgs =
        spaceIdx === -1 ? "" : withoutPrefix.slice(spaceIdx + 1).trim();
      const args = rawArgs ? rawArgs.split(/\s+/) : [];

      if (name) {
        const ctx = this._buildCtx({ sender, args, rawArgs, message: content });
        this.commands.dispatch(ctx, name).catch((err) =>
          this._log("warn", `Command error (${name}): ${err.message}`)
        );
      }
      return;
    }

    // ── AFK mention reply ───────────────────────────────────────────────────
    if (this.cfg.afkMessage) {
      this._checkMention(content, sender);
    }
  }

  // ── REST actions ───────────────────────────────────────────────────────────

  async _castVote() {
    try {
      await this._api.room.vote(this.cfg.room, "woot");
      this._wootCount++;
      this._log("info", `Wooted "${this._currentTrack?.title ?? "track"}"`);
    } catch (err) {
      this._log("warn", `Vote failed: ${err.message}`);
    }
  }

  async _tryJoin() {
    try {
      await this._api.room.joinWaitlist(this.cfg.room);
      this._inWaitlist = true;
      this._refreshWaitlist().catch(() => {});
    } catch (err) {
      if (
        err.message === "WAITLIST_NO_PLAYLIST" ||
        err.message?.includes("NO_PLAYLIST")
      ) {
        this._log("warn", "Can't join waitlist: no playlist set on the bot account.");
      }
      // Other errors (already in list, etc.) — silently ignore
    }
  }

  async _refreshWaitlist() {
    try {
      const res = await this._api.room.getBooth(this.cfg.room);
      const booth = res?.data?.data ?? res?.data ?? {};
      const boothUsers = booth.users ?? [];
      for (const u of boothUsers) {
        const uid = u.userId ?? u.user_id ?? u.id;
        if (uid != null) {
          this._roomUsersMap[String(uid)] =
            u.displayName ?? u.display_name ?? u.username ?? null;
        }
      }
      const wl = booth.waitlist ?? booth.queue ?? [];
      if (Array.isArray(wl)) {
        this._waitlistTotal = wl.length;
        const myIdx = wl.findIndex((u) => this._matchEntry(u));
        this._waitlistPosition = myIdx >= 0 ? myIdx + 1 : null;
        this._inWaitlist = this._waitlistPosition != null;
        this._nextDjName = wl.length > 0 ? this._resolveName(wl[0]) : null;
      }
    } catch {
      // non-critical
    }
  }

  // ── AFK ────────────────────────────────────────────────────────────────────

  _checkMention(content, sender) {
    const lower = content.toLowerCase();
    const username = (this._username ?? "").toLowerCase();
    const displayName = (this._displayName ?? "").toLowerCase();

    const mentioned =
      (username && lower.includes(`@${username}`)) ||
      (displayName && lower.includes(`@${displayName}`));

    if (!mentioned) return;

    const now = Date.now();
    if (now - this._afkLastReply < this.cfg.afkCooldownMs) return;
    this._afkLastReply = now;

    const senderTag = sender.username ?? sender.displayName ?? "";
    const reply = senderTag
      ? `@${senderTag} ${this.cfg.afkMessage}`
      : this.cfg.afkMessage;

    this.sendChat(reply).catch((err) =>
      this._log("warn", `AFK reply failed: ${err.message}`)
    );
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  async sendChat(content) {
    await this._api.chat.sendMessage(this.cfg.room, { content });
  }

  _matchEntry(u) {
    if (u == null) return false;
    if (typeof u === "number" || typeof u === "string") {
      return String(u) === String(this._userId);
    }
    const id = u.userId ?? u.user_id ?? u.id;
    if (id != null && String(id) === String(this._userId)) return true;
    return (
      this._username != null &&
      (u.username ?? "").toLowerCase() === this._username.toLowerCase()
    );
  }

  _resolveName(u) {
    if (u == null) return null;
    if (typeof u === "number" || typeof u === "string") {
      return this._roomUsersMap[String(u)] ?? null;
    }
    return u.displayName ?? u.display_name ?? u.username ?? null;
  }

  _buildCtx({ sender, args, rawArgs, message }) {
    return {
      bot: this,
      api: this._api,
      args,
      rawArgs,
      message,
      sender,
      room: this.cfg.room,
      reply: (text) => this.sendChat(text),
    };
  }

  _log(level, msg) {
    const ts = new Date().toISOString().replace("T", " ").slice(0, 19);
    const prefix = `[${ts}] [${level.toUpperCase().padEnd(4)}]`;
    if (level === "error") console.error(prefix, msg);
    else if (level === "warn") console.warn(prefix, msg);
    else console.log(prefix, msg);
  }

  // ── State snapshot (e.g. used by !stats command) ──────────────────────────

  getSessionState() {
    const now = Date.now();
    const uptimeSec = this._startedAt
      ? Math.floor((now - this._startedAt) / 1000)
      : 0;
    return {
      username: this._username,
      displayName: this._displayName,
      roomSlug: this.cfg.room,
      roomName: this._roomName,
      currentTrack: this._currentTrack,
      djName: this._djName,
      inWaitlist: this._inWaitlist,
      waitlistPosition: this._waitlistPosition,
      waitlistTotal: this._waitlistTotal,
      nextDjName: this._nextDjName,
      wootCount: this._wootCount,
      reactions: {
        woots: this._reactions.woots + this._currentReactions.woots,
        mehs: this._reactions.mehs + this._currentReactions.mehs,
        grabs: this._reactions.grabs + this._currentReactions.grabs,
      },
      uptimeSec,
      startedAt: this._startedAt,
    };
  }
}
