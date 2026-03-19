import { ROLE_LEVELS } from "../../lib/permissions.js";
export default {
    name: "help",
    aliases: ["comandos", "commands", "ajuda"],
    description: "Lista os comandos disponíveis ou mostra detalhes de um comando.",
    usage: "!help [comando]",
    cooldown: 5_000,
    async execute(ctx) {
        const { args, bot, reply, senderRoleLevel, t } = ctx;
        if (args.length > 0) {
            const cmd = bot.commands.resolve(args[0].toLowerCase());
            if (!cmd) {
                await reply(t("cmd.help.not_found", { cmd: args[0] }));
                return;
            }
            const lines = [`!${cmd.name} — ${cmd.description}`];
            if (cmd.usage)
                lines.push(`Uso: ${cmd.usage}`);
            if (cmd.aliases?.length)
                lines.push(`Aliases: ${cmd.aliases.map((a) => `!${a}`).join(", ")}`);
            if (cmd.minRole)
                lines.push(`Requer: ${cmd.minRole} ou superior`);
            await reply(lines.join(" | "));
            return;
        }
        const list = bot.commands.all
            .filter((c) => {
            if (!c.minRole)
                return true;
            return senderRoleLevel >= (ROLE_LEVELS[c.minRole.toLowerCase()] ?? 0);
        })
            .map((c) => `!${c.name}`)
            .sort()
            .join("  ");
        await reply(t("cmd.help.list", { list }));
    },
};
