/**
 * events/index.js — EventRegistry
 *
 * Auto-loads every .js file from the events/ directory (excluding itself)
 * and runs registered handlers when the matching pipeline event fires.
 *
 * ── Handler definition format ───────────────────────────────────────────────
 *
 *   export default {
 *     name:          string      — identifier (used for enable/disable)
 *     description:   string      — human-readable description
 *     enabled?:      boolean     — default enabled state (default: true)
 *
 *     event?:        number      — single pipeline event code (Events.*)
 *     events?:       number[]    — multiple pipeline event codes
 *
 *     cooldown?:     number | ((ctx, data) => number)
 *                                — 0 or omit to disable registry-managed cooldown.
 *                                  Use a function to read from bot.cfg dynamically.
 *     cooldownScope?: "global" | "user"
 *                                — "user" tracks per-userId; "global" is shared.
 *                                  Default: "global".
 *
 *     handle(ctx, data): Promise<void>
 *   }
 *
 * ── Event context (ctx) passed to handle() ──────────────────────────────────
 *
 *   {
 *     bot:      BorealiseBot   — bot instance (access cfg, sendChat, etc.)
 *     api:      ApiClient      — @borealise/api REST client
 *     room:     string         — room slug
 *     reply(text): Promise<void>  — send a chat message in the room
 *   }
 *
 * ── Example handler ─────────────────────────────────────────────────────────
 *
 *   import { Events } from "@borealise/pipeline";
 *
 *   export default {
 *     name: "myHandler",
 *     description: "Does something on every DJ advance.",
 *     event: Events.ROOM_DJ_ADVANCE,
 *     async handle(ctx, data) {
 *       await ctx.reply(`Now playing: ${data?.media?.title}`);
 *     },
 *   };
 */

import { readdirSync } from "fs";
import { fileURLToPath } from "url";

export class EventRegistry {
  constructor() {
    /** @type {Map<string, object>} name → normalised handler definition */
    this._handlers = new Map();
    /** @type {Map<string, boolean>} name → enabled override */
    this._enabled = new Map();
    /** @type {Map<string, number>} cooldown key → last-fired timestamp */
    this._cooldowns = new Map();
  }

  // ── Registration ───────────────────────────────────────────────────────────

  /**
   * Register a single event handler definition.
   * @param {object} def
   */
  register(def) {
    if (!def?.name || typeof def.handle !== "function") {
      throw new Error(
        `[EventRegistry] Invalid handler: must have "name" and "handle".`,
      );
    }

    const events = Array.isArray(def.events)
      ? def.events
      : def.event != null
        ? [def.event]
        : [];

    if (events.length === 0) {
      throw new Error(
        `[EventRegistry] Handler "${def.name}" must specify "event" or "events".`,
      );
    }

    const key = def.name.toLowerCase();
    if (this._handlers.has(key)) {
      console.warn(`[EventRegistry] Overwriting existing handler: ${key}`);
    }

    // Store a normalised copy with pre-computed _events array
    this._handlers.set(key, { ...def, _events: events });
  }

  /**
   * Dynamically import all .js files from a directory URL.
   * Supports both single-handler exports and array-of-handlers exports.
   * @param {URL} dirUrl  — e.g. new URL("../events/", import.meta.url)
   */
  async loadDir(dirUrl) {
    const dirPath = fileURLToPath(dirUrl);
    const selfName = "index.js";

    let files;
    try {
      files = readdirSync(dirPath).filter(
        (f) => f.endsWith(".js") && f !== selfName,
      );
    } catch (err) {
      console.error(
        `[EventRegistry] Could not read events dir: ${err.message}`,
      );
      return;
    }

    for (const file of files) {
      try {
        const mod = await import(new URL(file, dirUrl).href);
        const exported = mod.default ?? mod;
        const defs = Array.isArray(exported) ? exported : [exported];
        for (const def of defs) {
          this.register(def);
          console.log(`[EventRegistry] Loaded: ${def.name}`);
        }
      } catch (err) {
        console.error(`[EventRegistry] Failed to load ${file}: ${err.message}`);
      }
    }
  }

  // ── Enable / disable ───────────────────────────────────────────────────────

  /** Enable a handler by name (overrides definition's `enabled` field). */
  enable(name) {
    this._enabled.set(name.toLowerCase(), true);
  }

  /** Disable a handler by name (overrides definition's `enabled` field). */
  disable(name) {
    this._enabled.set(name.toLowerCase(), false);
  }

  /** Returns true if the named handler is currently enabled. */
  isEnabled(name) {
    const key = name.toLowerCase();
    if (this._enabled.has(key)) return this._enabled.get(key);
    return this._handlers.get(key)?.enabled !== false;
  }

  // ── Introspection ──────────────────────────────────────────────────────────

  /**
   * Returns the handler definition for a given name, or null if not found.
   * Useful for modifying a handler's `cooldown` value at startup.
   * @param {string} name
   */
  getHandler(name) {
    return this._handlers.get(name.toLowerCase()) ?? null;
  }

  /**
   * Returns the union of pipeline event codes required by all currently
   * enabled handlers. Used by bot.js to build the SUBSCRIBE list.
   * @returns {number[]}
   */
  getRequiredEvents() {
    const events = new Set();
    for (const def of this._handlers.values()) {
      if (this.isEnabled(def.name)) {
        def._events.forEach((e) => events.add(e));
      }
    }
    return [...events];
  }

  /** All registered handler definitions (unique). */
  get all() {
    return [...this._handlers.values()];
  }

  // ── Dispatch ───────────────────────────────────────────────────────────────

  /**
   * Evaluate all handlers subscribed to `pipelineEvent`.
   * Handles enable/disable and cooldown logic before calling handle().
   *
   * @param {number}  pipelineEvent — Events.* code from @borealise/pipeline
   * @param {object}  ctx           — event context from bot._buildEventCtx()
   * @param {object}  data          — raw pipeline event payload
   */
  async dispatch(pipelineEvent, ctx, data) {
    for (const def of this._handlers.values()) {
      if (!def._events.includes(pipelineEvent)) continue;
      if (!this.isEnabled(def.name)) continue;

      // ── Cooldown ──────────────────────────────────────────────────────────
      const cooldownMs =
        typeof def.cooldown === "function"
          ? def.cooldown(ctx, data)
          : (def.cooldown ?? 0);

      if (cooldownMs > 0) {
        const scope = def.cooldownScope ?? "global";
        const subject =
          scope === "user"
            ? String(data?.userId ?? data?.user_id ?? data?.id ?? "global")
            : "global";
        const ck = `${subject}:${def.name}`;
        const last = this._cooldowns.get(ck) ?? 0;
        if (Date.now() - last < cooldownMs) continue;
        this._cooldowns.set(ck, Date.now());
      }

      // ── Execute ───────────────────────────────────────────────────────────
      try {
        await def.handle(ctx, data);
      } catch (err) {
        console.error(
          `[EventRegistry] Error in "${def.name}" handler: ${err.message}`,
        );
      }
    }
  }
}
