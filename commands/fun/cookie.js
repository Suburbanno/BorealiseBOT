export default {
  name: "cookie",
  description: "Da um cookie para alguem.",
  usage: "!cookie [usuario]",
  cooldown: 5000,

  async execute(ctx) {
    const { bot, sender } = ctx;
    const targetInput = String(ctx.rawArgs ?? "")
      .replace(/^@/, "")
      .trim();
    const senderName = sender.username ?? sender.displayName ?? "alguem";

    if (!targetInput) {
      await ctx.reply(`@${senderName} aqui esta seu cookie.`);
      return;
    }

    const user = bot.findRoomUser(targetInput);
    if (!user) {
      await ctx.reply(`Nao encontrei "${targetInput}" na sala.`);
      return;
    }

    const name = user.username ?? user.displayName ?? targetInput;
    await ctx.reply(`@${senderName} deu um cookie para @${name}.`);
  },
};
