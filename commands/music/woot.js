/**
 * commands/music/woot.js
 */

export default {
  name: "woot",
  aliases: ["w", "voto", "votar"],
  description: "Força o bot a dar woot na música atual.",
  usage: "!woot",
  cooldown: 10_000,

  async execute(ctx) {
    const { bot, reply, sender, t } = ctx;

    if (!bot._currentTrack?.title) {
      await reply(t("cmd.woot.no_track"));
      return;
    }

    try {
      await bot._api.room.vote(bot.cfg.room, "woot");
      bot._wootCount++;
      await reply(
        t("cmd.woot.success", { title: bot._currentTrack.title, user: sender.username ?? "you" })
      );
    } catch (err) {
      await reply(t("cmd.woot.error", { error: err.message }));
    }
  },
};
