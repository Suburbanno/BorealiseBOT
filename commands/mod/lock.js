/**
 * commands/mod/lock.js
 */

export default {
  name: "lock",
  aliases: ["lockwl", "lockqueue", "travar"],
  description: "Trava a fila de DJs. Requer cargo bouncer ou superior.",
  usage: "!lock",
  cooldown: 5_000,
  minRole: "bouncer",

  async execute(ctx) {
    const { api, bot, reply } = ctx;
    try {
      await api.room.lockWaitlist(bot.cfg.room);
      await reply("Fila travada.");
    } catch (err) {
      await reply(`Erro ao travar a fila: ${err.message}`);
    }
  },
};
