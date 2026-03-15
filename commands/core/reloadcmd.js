/**
 * commands/core/reloadcmd.js
 */

export default {
  name: "reloadcmd",
  aliases: ["reloadcommands", "recarregar"],
  description: "Recarrega comandos sem reiniciar o bot.",
  usage: "!reloadcmd",
  cooldown: 10_000,
  minRole: "manager",

  async execute(ctx) {
    const { bot, reply } = ctx;
    try {
      const summary = await bot.reloadCommands();
      const failed = summary?.failed ?? 0;
      const loaded = summary?.loaded ?? 0;
      const msg = failed
        ? `Comandos recarregados: ${loaded}. Falhas: ${failed}.`
        : `Comandos recarregados: ${loaded}.`;
      await reply(msg);
    } catch (err) {
      await reply(`Erro ao recarregar comandos: ${err.message}`);
    }
  },
};
