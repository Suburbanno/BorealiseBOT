/**
 * commands/mod/unmute.js
 */

export default {
  name: "unmute",
  aliases: ["dessilenciar"],
  description:
    "Remove o silencio de um usuario. Requer cargo bouncer ou superior.",
  usage: "!unmute <usuario>",
  cooldown: 5_000,
  minRole: "bouncer",

  async execute(ctx) {
    const { api, bot, args, reply, t } = ctx;
    const target = (args[0] ?? "").replace(/^@/, "").trim();
    if (!target) {
      await reply(t("cmd.unmute.usage"));
      return;
    }

    const user = bot.findRoomUser(target);
    if (!user) {
      await reply(t("cmd.unmute.not_found", { target }));
      return;
    }

    try {
      await api.room.unmute(bot.cfg.room, user.userId);
      await reply(t("cmd.unmute.success", { name: user.displayName ?? user.username }));
    } catch (err) {
      await reply(t("cmd.unmute.error", { error: err.message }));
    }
  },
};
