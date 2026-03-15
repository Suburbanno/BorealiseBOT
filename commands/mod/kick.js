/**
 * commands/mod/kick.js
 */

export default {
  name: "kick",
  aliases: ["expulsar"],
  description: "Remove um usuario da sala. Requer cargo bouncer ou superior.",
  usage: "!kick <usuario>",
  cooldown: 5_000,
  minRole: "bouncer",

  async execute(ctx) {
    const { api, bot, args, reply } = ctx;
    const target = (args[0] ?? "").replace(/^@/, "").trim();
    if (!target) {
      await reply("Uso: !kick <usuario>");
      return;
    }

    const user = bot.findRoomUser(target);
    if (!user) {
      await reply(`Usuario "${target}" nao encontrado na sala.`);
      return;
    }

    if (String(user.userId) === String(bot._userId)) {
      await reply("Nao posso me expulsar.");
      return;
    }

    if (bot.getUserRoleLevel(user.userId) >= bot.getBotRoleLevel()) {
      await reply(
        `Nao posso expulsar ${user.displayName ?? user.username} — o cargo dele e igual ou superior ao meu.`,
      );
      return;
    }

    try {
      await api.room.kick(bot.cfg.room, user.userId);
      await reply(`👢 ${user.displayName ?? user.username} foi expulso.`);
    } catch (err) {
      await reply(`Erro ao expulsar: ${err.message}`);
    }
  },
};
