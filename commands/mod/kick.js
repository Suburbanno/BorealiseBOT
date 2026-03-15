/**
 * commands/mod/kick.js
 */

export default {
  name: "kick",
  aliases: ["expulsar"],
  description: "Remove um usuario da sala. Requer cargo bouncer ou superior.",
  usage: "!kick <usuario>",
  cooldown: 5_000,
  minRole: "bouncer",

  async execute(ctx) {
    const { api, bot, args, reply, t } = ctx;
    const target = (args[0] ?? "").replace(/^@/, "").trim();
    if (!target) {
      await reply(t("cmd.kick.usage"));
      return;
    }

    const user = bot.findRoomUser(target);
    if (!user) {
      await reply(t("cmd.kick.not_found", { target }));
      return;
    }

    if (String(user.userId) === String(bot._userId)) {
      await reply(t("cmd.kick.self"));
      return;
    }

    const name = user.displayName ?? user.username;
    if (bot.getUserRoleLevel(user.userId) >= bot.getBotRoleLevel()) {
      await reply(t("cmd.kick.higher_role", { name }));
      return;
    }

    try {
      await api.room.kick(bot.cfg.room, user.userId);
      await reply(t("cmd.kick.success", { name }));
    } catch (err) {
      await reply(t("cmd.kick.error", { error: err.message }));
    }
  },
};
