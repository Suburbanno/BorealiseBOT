/**
 * commands/mod/move.js
 */

export default {
  name: "move",
  aliases: ["mover", "mv"],
  description:
    "Move um usuario para uma posicao especifica na fila de DJs. Requer cargo bouncer ou superior.",
  usage: "!move <usuario> <posicao>",
  cooldown: 5_000,
  minRole: "bouncer",

  async execute(ctx) {
    const { api, bot, args, reply, t } = ctx;
    const target = (args[0] ?? "").replace(/^@/, "").trim();
    const pos = parseInt(args[1], 10);
    if (!target || isNaN(pos) || pos < 1) {
      await reply(t("cmd.move.usage"));
      return;
    }

    const user = bot.findRoomUser(target);
    if (!user) {
      await reply(t("cmd.move.not_found", { target }));
      return;
    }

    try {
      const apiPos = pos - 1;
      await api.room.moveInWaitlist(bot.cfg.room, Number(user.userId), apiPos);
      await reply(t("cmd.move.success", { name: user.displayName ?? user.username, position: pos }));
    } catch (err) {
      await reply(t("cmd.move.error", { error: err.message }));
    }
  },
};
