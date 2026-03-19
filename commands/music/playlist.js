function clampLimit(value, fallback, min, max) {
    const n = Number(value);
    if (!Number.isFinite(n))
        return fallback;
    return Math.max(min, Math.min(max, Math.floor(n)));
}
function normalizePlaylists(res) {
    return res?.data?.data?.playlists ?? res?.data?.playlists ?? [];
}
function getPlaylistSize(playlist) {
    if (Number.isFinite(playlist?.itemCount))
        return playlist.itemCount;
    if (Array.isArray(playlist?.items))
        return playlist.items.length;
    return "?";
}
export default {
    name: "playlist",
    aliases: ["playlists", "pl"],
    description: "Lista e gerencia playlists do bot.",
    usage: "!playlist [list [limite]|activate <id>|shuffle <id>]",
    cooldown: 5_000,
    minRole: "manager",
    async execute(ctx) {
        const { api, args, reply, t } = ctx;
        const sub = (args[0] ?? "list").toLowerCase();
        if (sub === "list") {
            try {
                const limit = clampLimit(args[1], 10, 1, 15);
                const res = await api.playlist.getAll();
                const playlists = normalizePlaylists(res);
                if (!Array.isArray(playlists) || playlists.length === 0) {
                    await reply(t("cmd.playlist.empty"));
                    return;
                }
                const items = playlists
                    .slice(0, limit)
                    .map((playlist) => {
                    const active = playlist?.isActive ? "* " : "";
                    return `${active}${playlist?.id}:${playlist?.name} (${getPlaylistSize(playlist)})`;
                })
                    .join(" | ");
                await reply(t("cmd.playlist.list", { items }));
            }
            catch (err) {
                await reply(t("cmd.playlist.error", { error: err.message }));
            }
            return;
        }
        if (sub === "activate" || sub === "shuffle") {
            const playlistId = Number(args[1]);
            if (!Number.isFinite(playlistId) || playlistId < 1) {
                await reply(t("cmd.playlist.usage"));
                return;
            }
            try {
                if (sub === "activate") {
                    await api.playlist.activate(playlistId);
                    await reply(t("cmd.playlist.activated", { id: playlistId }));
                }
                else {
                    await api.playlist.shuffle(playlistId);
                    await reply(t("cmd.playlist.shuffled", { id: playlistId }));
                }
            }
            catch (err) {
                await reply(t("cmd.playlist.error", { error: err.message }));
            }
            return;
        }
        await reply(t("cmd.playlist.usage"));
    },
};
