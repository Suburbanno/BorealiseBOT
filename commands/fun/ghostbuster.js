export default {
  name: "ghostbuster",
  description: "Verifica se um usuario esta na sala.",
  usage: "!ghostbuster [usuario]",
  cooldown: 5000,

  async execute(ctx) {
    const { bot, sender } = ctx;
    const targetInput = String(ctx.rawArgs ?? "")
      .replace(/^@/, "")
      .trim();
    const name =
      targetInput || sender.username || sender.displayName || "alguem";
    const user = bot.findRoomUser(name);
    if (user) {
      await ctx.reply(`${name} esta na sala.`);
      return;
    }
    await ctx.reply(`${name} nao esta na sala.`);
  },
};
