/**
 * commands/mod/ban.js
 */

import { extractDurationAndReason } from "../../helpers/duration.js";

export default {
  name: "ban",
  aliases: ["banir"],
  description: "Bane um usuario da sala. Requer cargo manager ou superior.",
  usage: "!ban <usuario> [duracao] [motivo]  · ex: !ban user d7 flood",
  cooldown: 5_000,
  minRole: "manager",

  async execute(ctx) {
    const { api, bot, args, reply } = ctx;
    const target = (args[0] ?? "").replace(/^@/, "").trim();
    if (!target) {
      await reply("Uso: !ban <usuario> [duracao] [motivo]");
      return;
    }

    const user = bot.findRoomUser(target);
    if (!user) {
      await reply(`Usuario "${target}" nao encontrado na sala.`);
      return;
    }

    if (bot.getUserRoleLevel(user.userId) >= bot.getBotRoleLevel()) {
      await reply(
        `Nao posso banir ${user.displayName ?? user.username} — o cargo dele e igual ou superior ao meu.`,
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
