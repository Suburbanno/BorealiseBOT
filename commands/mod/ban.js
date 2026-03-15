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
    const { api, bot, args, reply, t } = ctx;
    const target = (args[0] ?? "").replace(/^@/, "").trim();
    if (!target) {
      await reply(t("cmd.ban.usage"));
      return;
    }

    const user = bot.findRoomUser(target);
    if (!user) {
      await reply(t("cmd.ban.not_found", { target }));
      return;
    }

    if (String(user.userId) === String(bot._userId)) {
      await reply(t("cmd.ban.self"));
      return;
    }

    const name = user.displayName ?? user.username;
    if (bot.getUserRoleLevel(user.userId) >= bot.getBotRoleLevel()) {
      await reply(t("cmd.ban.higher_role", { name }));
      return;
    }

    const { duration, label, reason } = extractDurationAndReason(args.slice(1));

    const data = {};
    if (duration != null) data.duration = duration;
    if (reason) data.reason = reason;

    try {
      await api.room.ban(bot.cfg.room, user.userId, data);
      const parts = [t("cmd.ban.success", { name })];
      if (label) parts.push(t("cmd.ban.success_for", { duration: label }));
      if (reason) parts.push(t("cmd.ban.success_reason", { reason }));
      await reply(parts.join(" ") + ".");
    } catch (err) {
      await reply(t("cmd.ban.error", { error: err.message }));
    }
  },
};
