function clampLimit(value, fallback, min, max) {
    const n = Number(value);
    if (!Number.isFinite(n))
        return fallback;
    return Math.max(min, Math.min(max, Math.floor(n)));
}
function formatAction(action) {
    return String(action ?? "unknown").replaceAll("_", " ");
}
function formatAuditItem(log) {
    const actor = log?.actorUsername ?? "?";
    const action = formatAction(log?.action);
    const target = log?.targetUsername ? ` -> ${log.targetUsername}` : "";
    return `${actor}: ${action}${target}`;
}
export default {
    name: "audit",
    aliases: ["auditlog", "modlog"],
    description: "Mostra entradas recentes da auditoria da sala.",
    usage: "!audit [limite]",
    cooldown: 10_000,
    minRole: "manager",
    async execute(ctx) {
        const { api, bot, args, reply, t } = ctx;
        const limit = clampLimit(args[0], 5, 1, 8);
        try {
            const res = await api.room.getAuditLog(bot.cfg.room, limit);
            const logs = res?.data?.data?.logs ?? res?.data?.logs ?? [];
            if (!Array.isArray(logs) || logs.length === 0) {
                await reply(t("cmd.audit.empty"));
                return;
            }
            const items = logs.map(formatAuditItem).join(" | ");
            await reply(t("cmd.audit.list", { items }));
        }
        catch (err) {
            await reply(t("cmd.audit.error", { error: err.message }));
        }
    },
};
