/**
 * commands/woot.js
 *
 * !woot — manually cast a woot (upvote) for the current track.
 * Useful when AUTO_WOOT=false or as a fun command for users to cheer.
 *
 * NOTE: Only the bot account votes — this is not a way for users to vote on
 * behalf of themselves. It just triggers the bot's own vote action.
 */

export default {
  name: "woot",
  aliases: ["w", "voto", "votar"],
  description: "Força o bot a dar woot na música atual.",
  usage: "!woot",
  cooldown: 10_000,

  async execute(ctx) {
    const { bot, reply, sender } = ctx;

    if (!bot._currentTrack?.title) {
      await reply("Nenhuma música tocando para votar.");
      return;
    }

    try {
      await bot._api.room.vote(bot.cfg.room, "woot");
      bot._wootCount++;
      await reply(
        `👍 Woot! "${bot._currentTrack.title}" — votado por @${sender.username ?? "you"}`,
      );
    } catch (err) {
      await reply(`Não foi possível votar: ${err.message}`);
    }
  },
};
