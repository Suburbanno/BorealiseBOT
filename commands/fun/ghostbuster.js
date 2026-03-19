export default {
    name: "ghostbuster",
    description: "Verifica se um usuario esta na sala.",
    usage: "!ghostbuster [usuario]",
    cooldown: 5000,
    async execute(ctx) {
        const { bot, sender, rawArgs, reply, t } = ctx;
        const targetInput = String(rawArgs ?? "")
            .replace(/^@/, "")
            .trim();
        const name = targetInput || sender.username || sender.displayName || "alguem";
        const user = bot.findRoomUser(name);
        if (user) {
            await reply(t("cmd.ghostbuster.in_room", { name }));
            return;
        }
        await reply(t("cmd.ghostbuster.not_in_room", { name }));
    },
};
