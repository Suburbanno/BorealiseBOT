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
    const { api, bot, args, reply } = ctx;
    const target = (args[0] ?? "").replace(/^@/, "").trim();
    const pos = parseInt(args[1], 10);
    if (!target || isNaN(pos) || pos < 1) {
      await reply("Uso: !move <usuario> <posicao> (1 = primeiro)");
      return;
    }

    const user = bot.findRoomUser(target);
    if (!user) {
      await reply(`Usuario "${target}" nao encontrado na sala.`);
      return;
    }

    try {
      const apiPos = pos - 1;
      await api.room.moveInWaitlist(bot.cfg.room, Number(user.userId), apiPos);
      await reply(
        `${user.displayName ?? user.username} foi movido para a posicao ${pos} na fila.`,
      );
    } catch (err) {
      await reply(`Erro ao mover: ${err.message}`);
    }
  },
};
