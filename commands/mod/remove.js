/**
 * commands/mod/remove.js
 */

export default {
  name: "remove",
  aliases: ["rm", "chutar"],
  description:
    "Remove um usuario da fila de DJs. Requer cargo bouncer ou superior.",
  usage: "!remove <usuario>",
  cooldown: 5_000,
  minRole: "bouncer",

  async execute(ctx) {
    const { api, bot, args, reply, t } = ctx;
    const target = (args[0] ?? "").replace(/^@/, "").trim();
    if (!target) {
      await reply(t("cmd.remove.usage"));
      return;
    }

    const user = bot.findRoomUser(target);
    if (!user) {
      await reply(t("cmd.remove.not_found", { target }));
      return;
    }

    if (String(user.userId) === String(bot._userId)) {
      await reply(t("cmd.remove.self"));
      return;
    }

    try {
      // First, fetch the waitlist to get the user's position
      const res = await api.room.getWaitlist(bot.cfg.room);
      const waitlist = res?.data?.data?.waitlist ?? res?.data?.waitlist ?? [];
      const userInWaitlist = waitlist.find(
        (u) => String(u.id ?? u.userId) === String(user.userId),
      );

      if (!userInWaitlist) {
        await reply(t("cmd.remove.not_in_queue", { target }));
        return;
      }

      await api.room.removeFromWaitlist(bot.cfg.room, Number(user.userId));
      await reply(t("cmd.remove.success", { name: user.displayName ?? user.username }));
    } catch (err) {
      await reply(t("cmd.remove.error", { error: err.message }));
    }
  },
};
