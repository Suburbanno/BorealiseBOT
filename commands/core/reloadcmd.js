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
    const { bot, reply, t } = ctx;
    try {
      const summary = await bot.reloadCommands();
      const failed = summary?.failed ?? 0;
      const loaded = summary?.loaded ?? 0;
      const msg = failed
        ? t("cmd.reloadcmd.success_with_failures", { loaded, failed })
        : t("cmd.reloadcmd.success", { loaded });
      await reply(msg);
    } catch (err) {
      await reply(t("cmd.reloadcmd.error", { error: err.message }));
    }
  },
};
