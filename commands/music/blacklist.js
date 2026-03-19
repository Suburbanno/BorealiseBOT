/**
 * commands/music/blacklist.js
 */
import {
  addTrackBlacklist,
  removeTrackBlacklist,
  listTrackBlacklist,
  getTrackBlacklist,
} from "../../lib/storage.js";

function splitTrackId(trackId) {
  const parts = String(trackId).split(":");
  if (parts.length < 2) return { source: null, sourceId: null };
  const source = parts[0];
  const sourceId = parts.slice(1).join(":");
  return { source, sourceId };
}

export default {
  name: "blacklist",
  aliases: ["bl"],
  description: "Gerencia blacklist de musicas.",
  usage: "!blacklist add|remove|list|info",
  cooldown: 3000,
  minRole: "bouncer",

  async execute(ctx) {
    const { args, reply, bot, api, t } = ctx;
    const action = (args[0] ?? "").toLowerCase();

    if (!action) {
      await reply(t("cmd.blacklist.usage"));
      return;
    }

    if (action === "info") {
      const id = bot.getCurrentTrackId();
      const title = bot._currentTrack?.title ?? null;
      const artist = bot._currentTrack?.artist ?? null;
      if (!id) {
        await reply(t("cmd.blacklist.no_track"));
        return;
      }
      const label = artist ? `${artist} - ${title}` : (title ?? "musica");
      await reply(t("cmd.blacklist.info", { label, id }));
      return;
    }

    if (action === "add") {
      let trackId = args[1] ?? "current";
      if (trackId === "current") {
        trackId = bot.getCurrentTrackId();
      }
      if (!trackId) {
        await reply(t("cmd.blacklist.no_track_add"));
        return;
      }

      const currentId = bot.getCurrentTrackId();
      const isCurrent = trackId === currentId;

      const existing = await getTrackBlacklist(trackId);
      if (existing) {
        await reply(t("cmd.blacklist.already_listed"));
        return;
      }

      const { source, sourceId } = splitTrackId(trackId);
      const title = isCurrent ? (bot._currentTrack?.title ?? null) : null;
      const artist = isCurrent ? (bot._currentTrack?.artist ?? null) : null;

      await addTrackBlacklist({
        trackId,
        source,
        sourceId,
        title,
        artist,
        addedAt: Date.now(),
      });

      if (isCurrent) {
        try {
          await bot._safeSkip(t("cmd.blacklist.added_and_skipped"));
        } catch (err) {
          await reply(t("cmd.blacklist.added_skip_failed", { error: err.message }));
        }
        return;
      }

      await reply(t("cmd.blacklist.added"));
      return;
    }

    if (action === "remove") {
      let trackId = args[1] ?? "";
      if (trackId === "current") {
        trackId = bot.getCurrentTrackId() ?? "";
      }
      if (!trackId) {
        await reply(t("cmd.blacklist.remove_usage"));
        return;
      }
      await removeTrackBlacklist(trackId);
      await reply(t("cmd.blacklist.removed"));
      return;
    }

    if (action === "list") {
      const limit = Math.max(1, Math.min(50, Number(args[1]) || 10));
      const list = await listTrackBlacklist(limit);
      if (!list.length) {
        await reply(t("cmd.blacklist.empty"));
        return;
      }
      const items = list.map((k) => k.track_id ?? k.trackId);
      await reply(t("cmd.blacklist.list", { limit, items: items.join(", ") }));
      return;
    }

    await reply(t("cmd.blacklist.invalid_action"));
  },
};
