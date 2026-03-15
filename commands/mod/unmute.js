/**
 * commands/mod/unmute.js
 */

export default {
  name: "unmute",
  aliases: ["dessilenciar"],
  description:
    "Remove o silencio de um usuario. Requer cargo bouncer ou superior.",
  usage: "!unmute <usuario>",
  cooldown: 5_000,
  minRole: "bouncer",

  async execute(ctx) {
    const { api, bot, args, reply } = ctx;
    const target = (args[0] ?? "").replace(/^@/, "").trim();
    if (!target) {
      await reply("Uso: !unmute <usuario>");
      return;
    }

    const user = bot.findRoomUser(target);
    if (!user) {
      await reply(`Usuario "${target}" nao encontrado na sala.`);
      return;
    }

    try {
      await api.room.unmute(bot.cfg.room, user.userId);
      await reply(`🔊 ${user.displayName ?? user.username} foi dessilenciado.`);
    } catch (err) {
      await reply(`Erro ao dessilenciar: ${err.message}`);
    }
  },
};
