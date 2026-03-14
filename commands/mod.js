/**
 * commands/mod.js — Moderation commands
 *
 * Commands: !skip, !kick, !mute, !unmute, !ban, !unban
 *
 * All commands require BOTH:
 *   1. The bot to hold the required role in the room (otherwise the REST call
 *      would fail anyway — the registry silently skips it to avoid spam).
 *   2. The user who typed the command to hold the required role.
 *
 * Role guards are enforced by CommandRegistry before execute() is ever called
 * (see commands/index.js), so individual handlers can trust that both checks
 * have already passed.
 *
 * Duration format for !mute / !ban:
 *   5      → 5 minutes
 *   h2     → 2 hours  (= 120 minutes)
 *   d7     → 7 days   (= 10 080 minutes)
 *
 * REST API method signatures (from @borealise/api):
 *   api.room.skipTrack(slug)
 *   api.room.kick(slug, userId)
 *   api.room.mute(slug, userId, { duration?, reason? })  — duration in minutes
 *   api.room.unmute(slug, userId)
 *   api.room.ban(slug, userId, { duration?, reason? })   — duration in minutes
 *   api.room.unban(slug, userId)
 *   api.room.getBans(slug)
 */

// ── Duration helpers ──────────────────────────────────────────────────────────

/**
 * Parse a single duration token into minutes + a human-readable label.
 * Returns null if the token is not a recognised duration.
 *
 * Examples: "5" → {minutes:5, label:"5min"} | "h2" → {120,"2h"} | "d1" → {1440,"1d"}
 *
 * @param {string} tok
 * @returns {{minutes:number, label:string}|null}
 */
function parseDuration(tok) {
  const m = tok.match(/^(h|d)?(\d+)$/i);
  if (!m) return null;
  const unit = (m[1] || "").toLowerCase();
  const val = parseInt(m[2], 10);
  if (unit === "h") return { minutes: val * 60, label: `${val}h` };
  if (unit === "d") return { minutes: val * 1440, label: `${val}d` };
  return { minutes: val, label: `${val}min` };
}

/**
 * Walk a token array and extract an optional duration + trailing reason.
 * The first token that looks like a duration wins; everything else is the reason.
 *
 * @param {string[]} tokens
 * @returns {{duration:number|null, label:string|null, reason:string|null}}
 */
function extractDurationAndReason(tokens) {
  let duration = null;
  let label = null;
  const reasonParts = [];

  for (const tok of tokens) {
    if (duration === null) {
      const d = parseDuration(tok);
      if (d) {
        duration = d.minutes;
        label = d.label;
        continue;
      }
    }
    reasonParts.push(tok);
  }

  return { duration, label, reason: reasonParts.join(" ") || null };
}

// ── Commands ──────────────────────────────────────────────────────────────────

const skip = {
  name: "skip",
  aliases: ["pular"],
  description: "Pula a música atual. Requer cargo bouncer ou superior.",
  usage: "!skip",
  cooldown: 5_000,
  minRole: "bouncer",

  async execute(ctx) {
    const { api, bot, reply } = ctx;
    try {
      await api.room.skipTrack(bot.cfg.room);
      await reply("⏭ Música pulada.");
    } catch (err) {
      await reply(`Erro ao pular: ${err.message}`);
    }
  },
};

const kick = {
  name: "kick",
  aliases: ["expulsar"],
  description: "Remove um usuário da sala. Requer cargo bouncer ou superior.",
  usage: "!kick <usuario>",
  cooldown: 5_000,
  minRole: "bouncer",

  async execute(ctx) {
    const { api, bot, args, reply } = ctx;
    const target = (args[0] ?? "").replace(/^@/, "").trim();
    if (!target) {
      await reply("Uso: !kick <usuario>");
      return;
    }

    const user = bot.findRoomUser(target);
    if (!user) {
      await reply(`Usuário "${target}" não encontrado na sala.`);
      return;
    }

    if (bot.getUserRoleLevel(user.userId) >= bot.getBotRoleLevel()) {
      await reply(
        `Não posso expulsar ${user.displayName ?? user.username} — o cargo dele é igual ou superior ao meu.`,
      );
      return;
    }

    try {
      await api.room.kick(bot.cfg.room, user.userId);
      await reply(`👢 ${user.displayName ?? user.username} foi expulso.`);
    } catch (err) {
      await reply(`Erro ao expulsar: ${err.message}`);
    }
  },
};

const mute = {
  name: "mute",
  aliases: ["silenciar", "calar"],
  description: "Silencia um usuário no chat. Requer cargo bouncer ou superior.",
  usage: "!mute <usuario> [duração] [motivo]  · ex: !mute user h2 spam",
  cooldown: 5_000,
  minRole: "bouncer",

  async execute(ctx) {
    const { api, bot, args, reply } = ctx;
    const target = (args[0] ?? "").replace(/^@/, "").trim();
    if (!target) {
      await reply("Uso: !mute <usuario> [duração] [motivo]");
      return;
    }

    const user = bot.findRoomUser(target);
    if (!user) {
      await reply(`Usuário "${target}" não encontrado na sala.`);
      return;
    }

    if (bot.getUserRoleLevel(user.userId) >= bot.getBotRoleLevel()) {
      await reply(
        `Não posso silenciar ${user.displayName ?? user.username} — o cargo dele é igual ou superior ao meu.`,
      );
      return;
    }

    const { duration, label, reason } = extractDurationAndReason(args.slice(1));

    const data = {};
    if (duration != null) data.duration = duration;
    if (reason) data.reason = reason;

    try {
      await api.room.mute(bot.cfg.room, user.userId, data);
      const parts = [`🔇 ${user.displayName ?? user.username} foi silenciado`];
      if (label) parts.push(`por ${label}`);
      if (reason) parts.push(`— ${reason}`);
      await reply(parts.join(" ") + ".");
    } catch (err) {
      await reply(`Erro ao silenciar: ${err.message}`);
    }
  },
};

const unmute = {
  name: "unmute",
  aliases: ["dessilenciar"],
  description:
    "Remove o silêncio de um usuário. Requer cargo bouncer ou superior.",
  usage: "!unmute <usuario>",
  cooldown: 5_000,
  minRole: "bouncer",

  async execute(ctx) {
    const { api, bot, args, reply } = ctx;
    const target = (args[0] ?? "").replace(/^@/, "").trim();
    if (!target) {
      await reply("Uso: !unmute <usuario>");
      return;
    }

    const user = bot.findRoomUser(target);
    if (!user) {
      await reply(`Usuário "${target}" não encontrado na sala.`);
      return;
    }

    try {
      await api.room.unmute(bot.cfg.room, user.userId);
      await reply(`🔊 ${user.displayName ?? user.username} foi dessilenciado.`);
    } catch (err) {
      await reply(`Erro ao dessilenciar: ${err.message}`);
    }
  },
};

const ban = {
  name: "ban",
  aliases: ["banir"],
  description: "Bane um usuário da sala. Requer cargo manager ou superior.",
  usage: "!ban <usuario> [duração] [motivo]  · ex: !ban user d7 flood",
  cooldown: 5_000,
  minRole: "manager",

  async execute(ctx) {
    const { api, bot, args, reply } = ctx;
    const target = (args[0] ?? "").replace(/^@/, "").trim();
    if (!target) {
      await reply("Uso: !ban <usuario> [duração] [motivo]");
      return;
    }

    const user = bot.findRoomUser(target);
    if (!user) {
      await reply(`Usuário "${target}" não encontrado na sala.`);
      return;
    }

    if (bot.getUserRoleLevel(user.userId) >= bot.getBotRoleLevel()) {
      await reply(
        `Não posso banir ${user.displayName ?? user.username} — o cargo dele é igual ou superior ao meu.`,
      );
      return;
    }

    const { duration, label, reason } = extractDurationAndReason(args.slice(1));

    const data = {};
    if (duration != null) data.duration = duration;
    if (reason) data.reason = reason;

    try {
      await api.room.ban(bot.cfg.room, user.userId, data);
      const parts = [`🔨 ${user.displayName ?? user.username} foi banido`];
      if (label) parts.push(`por ${label}`);
      if (reason) parts.push(`— ${reason}`);
      await reply(parts.join(" ") + ".");
    } catch (err) {
      await reply(`Erro ao banir: ${err.message}`);
    }
  },
};

const unban = {
  name: "unban",
  aliases: ["desbanir"],
  description: "Remove o ban de um usuário. Requer cargo manager ou superior.",
  usage: "!unban <usuario>",
  cooldown: 5_000,
  minRole: "manager",

  async execute(ctx) {
    const { api, bot, args, reply } = ctx;
    const target = (args[0] ?? "").replace(/^@/, "").trim();
    if (!target) {
      await reply("Uso: !unban <usuario>");
      return;
    }

    // The banned user won't be in the room; try local cache first, then fetch bans.
    let userId = bot.findRoomUser(target)?.userId ?? null;

    if (!userId) {
      try {
        const bansRes = await api.room.getBans(bot.cfg.room);
        const bans = bansRes?.data?.data ?? bansRes?.data ?? [];
        const lower = target.toLowerCase();
        const found = (Array.isArray(bans) ? bans : []).find(
          (b) =>
            (b.username ?? "").toLowerCase() === lower ||
            (b.displayName ?? b.display_name ?? "").toLowerCase() === lower,
        );
        if (found) {
          userId = String(found.userId ?? found.user_id ?? found.id ?? "");
        }
      } catch {
        // getBans failed — try anyway below; server will return an error if invalid
      }
    }

    if (!userId) {
      await reply(`Usuário "${target}" não encontrado na lista de banidos.`);
      return;
    }

    try {
      await api.room.unban(bot.cfg.room, userId);
      await reply(`✅ Ban de "${target}" removido.`);
    } catch (err) {
      await reply(`Erro ao desbanir: ${err.message}`);
    }
  },
};

// Array export — CommandRegistry.loadDir() handles both single and array exports.
export default [skip, kick, mute, unmute, ban, unban];
