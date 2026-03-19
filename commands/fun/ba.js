export default {
    name: "ba",
    description: "Mensagem simples de BA.",
    usage: "!ba",
    cooldown: 5000,
    async execute(ctx) {
        await ctx.reply("BA: nao configurado.");
    },
};
