/**
 * commands/core/start.js
 */

export default {
  name: "start",
  aliases: ["resume", "unpause", "continuar", "iniciar"],
  description: "Retoma o bot pausado.",
  usage: "!start",
  cooldown: 5000,
  minRole: "manager",

  async execute(ctx) {
    const { bot, reply, t } = ctx;
    const changed = bot.resume();
    if (changed) {
      await reply(t("cmd.start.resumed"));
      return;
    }
    await reply(t("cmd.start.already_active"));
  },
};
