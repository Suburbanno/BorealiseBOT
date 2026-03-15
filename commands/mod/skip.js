/**
 * commands/mod/skip.js
 */

export default {
  name: "skip",
  aliases: ["pular"],
  description: "Pula a musica atual. Requer cargo bouncer ou superior.",
  usage: "!skip [motivo]",
  cooldown: 5_000,
  minRole: "bouncer",

  async execute(ctx) {
    const { api, bot, reply, rawArgs } = ctx;
    const reason = String(rawArgs ?? "").trim();
    try {
      await api.room.skipTrack(bot.cfg.room);
      const msg = reason
        ? `⏭ Musica pulada. Motivo: ${reason}.`
        : "⏭ Musica pulada.";
      await reply(msg);
    } catch (err) {
      await reply(`Erro ao pular: ${err.message}`);
    }
  },
};
