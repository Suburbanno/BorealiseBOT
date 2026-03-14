/**
 * commands/ping.js
 *
 * !ping — check if the bot is alive; replies with latency hint
 */

export default {
  name: "ping",
  aliases: ["pong"],
  description: "Verifica se o bot está online.",
  usage: "!ping",
  cooldown: 5_000,

  async execute(ctx) {
    const start = Date.now();
    await ctx.reply(`@${ctx.sender.username ?? "you"} Pong! 🏓 (${Date.now() - start}ms)`);
  },
};
