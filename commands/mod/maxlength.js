import { setSetting } from "../../lib/storage.js";
export default {
    name: "maxlength",
    aliases: ["maxlen", "maxsong"],
    description: "Define a duracao maxima de musica (em minutos).",
    usage: "!maxlength <min>",
    cooldown: 5_000,
    minRole: "manager",
    async execute(ctx) {
        const { bot, args, reply, t } = ctx;
        const minutes = Number(args[0]);
        if (!Number.isFinite(minutes) || minutes < 1) {
            await reply(t("cmd.maxlength.usage"));
            return;
        }
        const value = Math.floor(minutes);
        bot.updateConfig("maxSongLengthMin", value);
        await setSetting("maxSongLengthMin", value);
        await reply(t("cmd.maxlength.success", { value }));
    },
};
