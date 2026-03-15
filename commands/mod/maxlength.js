/**
 * commands/mod/maxlength.js
 */

import { setSetting } from "../../lib/storage.js";

export default {
  name: "maxlength",
  aliases: ["maxlen", "maxsong"],
  description: "Define a duracao maxima de musica (em minutos).",
  usage: "!maxlength <min>",
  cooldown: 5_000,
  minRole: "manager",

  async execute(ctx) {
    const { bot, args, reply } = ctx;
    const minutes = Number(args[0]);
    if (!Number.isFinite(minutes) || minutes < 1) {
      await reply("Uso: !maxlength <min>");
      return;
    }
    const value = Math.floor(minutes);
    bot.updateConfig("maxSongLengthMin", value);
    await setSetting("maxSongLengthMin", value);
    await reply(`Duracao maxima atualizada para ${value} min.`);
  },
};
