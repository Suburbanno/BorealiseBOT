/**
 * commands/core/stop.js
 */

export default {
  name: "stop",
  aliases: ["pause", "parar", "pausar"],
  description: "Pausa o bot sem desconectar.",
  usage: "!stop",
  cooldown: 5000,
  minRole: "manager",

  async execute(ctx) {
    const { bot, reply, t } = ctx;
    const changed = bot.pause();
    if (changed) {
      await reply(t("cmd.stop.paused"));
      return;
    }
    await reply(t("cmd.stop.already_paused"));
  },
};
