/**
 * commands/core/reload.js
 */

export default {
  name: "reload",
  aliases: ["reconnect", "restart"],
  description: "Reconecta o bot sem reiniciar o processo.",
  usage: "!reload",
  cooldown: 10_000,
  minRole: "manager",

  async execute(ctx) {
    const { bot, reply } = ctx;
    await reply("Recarregando conexao do bot...");
    try {
      await bot.reload();
    } catch (err) {
      await reply(`Erro ao recarregar: ${err.message}`);
    }
  },
};
