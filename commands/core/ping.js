export default {
    name: "ping",
    aliases: ["pong"],
    description: "Verifica se o bot está online.",
    usage: "!ping",
    cooldown: 5_000,
    async execute(ctx) {
        const { t } = ctx;
        const start = Date.now();
        await ctx.reply(t("cmd.ping.pong", { user: ctx.sender.username ?? "you", ms: Date.now() - start }));
    },
};
