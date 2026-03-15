/**
 * commands/mod/remove.js
 */

import { getWaitlist } from "../../helpers/waitlist.js";

export default {
  name: "remove",
  aliases: ["remover", "rm"],
  description:
    "Remove um usuario da fila de DJs. Requer cargo bouncer ou superior.",
  usage: "!remove <usuario>",
  cooldown: 5_000,
  minRole: "bouncer",

  async execute(ctx) {
    const { api, bot, args, reply } = ctx;
    const target = (args[0] ?? "").replace(/^@/, "").trim();
    if (!target) {
      await reply("Uso: !remove <usuario>");
      return;
    }

    const user = bot.findRoomUser(target);
    if (!user) {
      await reply(`Usuario "${target}" nao encontrado na sala.`);
      return;
    }

    try {
      const wl = await getWaitlist(api, bot.cfg.room);
      const inList = wl.some(
        (u) => String(u.id ?? u.userId) === String(user.userId),
      );

      if (!inList) {
        await reply(`Usuario "${target}" nao esta na fila.`);
        return;
      }

      await api.room.removeFromWaitlist(bot.cfg.room, Number(user.userId));
      await reply(`${user.displayName ?? user.username} foi removido da fila.`);
    } catch (err) {
      await reply(`Erro ao remover da fila: ${err.message}`);
    }
  },
};
