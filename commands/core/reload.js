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
    const { bot, reply, t } = ctx;
    await reply(t("cmd.reload.reloading"));
    // Detach from the current event loop tick so the reply is flushed
    // before the WebSocket is disconnected by bot.reload()
    setTimeout(() => {
      bot.reload().catch((err) =>
        bot._log("error", `Reload failed: ${err.message}`),
      );
    }, 300);
  },
};
