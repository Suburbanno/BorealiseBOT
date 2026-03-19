function clampLimit(value, fallback, min, max) {
    const n = Number(value);
    if (!Number.isFinite(n))
        return fallback;
    return Math.max(min, Math.min(max, Math.floor(n)));
}
function formatHistoryItem(item) {
    const media = item?.media ?? {};
    const title = media.title ?? "?";
    const label = media.artist ? `${media.artist} - ${title}` : title;
    const user = item?.displayName ?? item?.username ?? "?";
    const woots = Number(item?.woots ?? 0);
    const mehs = Number(item?.mehs ?? 0);
    const grabs = Number(item?.grabs ?? 0);
    return `${user}: ${label} [+${woots}/-${mehs}/g${grabs}]`;
}
export default {
    name: "history",
    aliases: ["recent", "played", "historico"],
    description: "Mostra as musicas tocadas recentemente na sala.",
    usage: "!history [limite]",
    cooldown: 8_000,
    async execute(ctx) {
        const { api, bot, args, reply, t } = ctx;
        const limit = clampLimit(args[0], 3, 1, 5);
        try {
            const res = await api.room.getHistory(bot.cfg.room, 1, limit);
            const history = res?.data?.data?.history ?? res?.data?.history ?? [];
            if (!Array.isArray(history) || history.length === 0) {
                await reply(t("cmd.history.empty"));
                return;
            }
            const items = history.map(formatHistoryItem).join(" | ");
            await reply(t("cmd.history.list", { items }));
        }
        catch (err) {
            await reply(t("cmd.history.error", { error: err.message }));
        }
    },
};
