/**
 * commands/mod/mute.js
 */

import { extractDurationAndReason } from "../../helpers/duration.js";

export default {
  name: "mute",
  aliases: ["silenciar", "calar"],
  description: "Silencia um usuario no chat. Requer cargo bouncer ou superior.",
  usage: "!mute <usuario> [duracao] [motivo]  · ex: !mute user h2 spam",
  cooldown: 5_000,
  minRole: "bouncer",

  async execute(ctx) {
    const { api, bot, args, reply } = ctx;
    const target = (args[0] ?? "").replace(/^@/, "").trim();
    if (!target) {
      await reply("Uso: !mute <usuario> [duracao] [motivo]");
      return;
    }

    const user = bot.findRoomUser(target);
    if (!user) {
      await reply(`Usuario "${target}" nao encontrado na sala.`);
      return;
    }

    if (bot.getUserRoleLevel(user.userId) >= bot.getBotRoleLevel()) {
      await reply(
        `Nao posso silenciar ${user.displayName ?? user.username} — o cargo dele e igual ou superior ao meu.`,
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
