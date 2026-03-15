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
    const { api, bot, args, reply, t } = ctx;
    const target = (args[0] ?? "").replace(/^@/, "").trim();
    if (!target) {
      await reply(t("cmd.mute.usage"));
      return;
    }

    const user = bot.findRoomUser(target);
    if (!user) {
      await reply(t("cmd.mute.not_found", { target }));
      return;
    }

    if (String(user.userId) === String(bot._userId)) {
      await reply(t("cmd.mute.self"));
      return;
    }

    const name = user.displayName ?? user.username;
    if (bot.getUserRoleLevel(user.userId) >= bot.getBotRoleLevel()) {
      await reply(t("cmd.mute.higher_role", { name }));
      return;
    }

    const { duration, label, reason } = extractDurationAndReason(args.slice(1));

    const data = {};
    if (duration != null) data.duration = duration;
    if (reason) data.reason = reason;

    try {
      await api.room.mute(bot.cfg.room, user.userId, data);
      const parts = [t("cmd.mute.success", { name })];
      if (label) parts.push(t("cmd.mute.success_for", { duration: label }));
      if (reason) parts.push(t("cmd.mute.success_reason", { reason }));
      await reply(parts.join(" ") + ".");
    } catch (err) {
      await reply(t("cmd.mute.error", { error: err.message }));
    }
  },
};
