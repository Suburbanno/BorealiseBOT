/**
 * commands/help.js
 *
 * !help          — list all available commands
 * !help <name>   — show detailed usage for a specific command
 */

export default {
  name: "help",
  aliases: ["comandos", "commands", "ajuda"],
  description: "Lista os comandos disponíveis ou mostra detalhes de um comando.",
  usage: "!help [comando]",
  cooldown: 5_000,

  async execute(ctx) {
    const { args, bot, reply } = ctx;

    if (args.length > 0) {
      // Detailed help for one command
      const cmd = bot.commands.resolve(args[0].toLowerCase());
      if (!cmd) {
        await reply(`Comando "!${args[0]}" não encontrado.`);
        return;
      }
      const lines = [`!${cmd.name} — ${cmd.description}`];
      if (cmd.usage) lines.push(`Uso: ${cmd.usage}`);
      if (cmd.aliases?.length) lines.push(`Aliases: ${cmd.aliases.map((a) => `!${a}`).join(", ")}`);
      await reply(lines.join(" | "));
      return;
    }

    // List all commands
    const list = bot.commands.all
      .map((c) => `!${c.name}`)
      .sort()
      .join("  ");
    await reply(`Comandos: ${list}  •  Use !help <comando> para mais detalhes.`);
  },
};
