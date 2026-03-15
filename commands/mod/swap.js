/**
 * commands/mod/swap.js
 */

import { getWaitlist } from "../../helpers/waitlist.js";

export default {
  name: "swap",
  aliases: ["trocar"],
  description:
    "Troca a posicao de dois usuarios na fila. Requer cargo bouncer ou superior.",
  usage: "!swap <usuario1> <usuario2>",
  cooldown: 5_000,
  minRole: "bouncer",

  async execute(ctx) {
    const { api, bot, args, reply } = ctx;
    const targetA = (args[0] ?? "").replace(/^@/, "").trim();
    const targetB = (args[1] ?? "").replace(/^@/, "").trim();

    if (!targetA || !targetB) {
      await reply("Uso: !swap <usuario1> <usuario2>");
      return;
    }

    const userA = bot.findRoomUser(targetA);
    const userB = bot.findRoomUser(targetB);
    if (!userA || !userB) {
      await reply("Usuario nao encontrado na sala.");
      return;
    }

    try {
      const wl = await getWaitlist(api, bot.cfg.room);
      const idxA = wl.findIndex(
        (u) => String(u.id ?? u.userId) === String(userA.userId),
      );
      const idxB = wl.findIndex(
        (u) => String(u.id ?? u.userId) === String(userB.userId),
      );

      if (idxA < 0 || idxB < 0) {
        await reply("Ambos os usuarios precisam estar na fila.");
        return;
      }

      if (idxA === idxB) {
        await reply("Os usuarios ja estao na mesma posicao.");
        return;
      }

      if (idxA < idxB) {
        await api.room.moveInWaitlist(bot.cfg.room, Number(userB.userId), idxA);
        await api.room.moveInWaitlist(bot.cfg.room, Number(userA.userId), idxB);
      } else {
        await api.room.moveInWaitlist(bot.cfg.room, Number(userA.userId), idxB);
        await api.room.moveInWaitlist(bot.cfg.room, Number(userB.userId), idxA);
      }

      await reply(
        `Swap realizado: ${userA.displayName ?? userA.username} <-> ${userB.displayName ?? userB.username}.`,
      );
    } catch (err) {
      await reply(`Erro ao trocar posicoes: ${err.message}`);
    }
  },
};
