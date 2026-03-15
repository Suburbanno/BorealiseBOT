/**
 * commands/mod/unlock.js
 */

export default {
  name: "unlock",
  aliases: ["unlockwl", "unlockqueue", "destravar"],
  description: "Destrava a fila de DJs. Requer cargo bouncer ou superior.",
  usage: "!unlock",
  cooldown: 5_000,
  minRole: "bouncer",

  async execute(ctx) {
    const { api, bot, reply } = ctx;
    try {
      await api.room.unlockWaitlist(bot.cfg.room);
      await reply("Fila destravada.");
    } catch (err) {
      await reply(`Erro ao destravar a fila: ${err.message}`);
    }
  },
};
