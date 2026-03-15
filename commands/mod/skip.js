/**
 * commands/mod/skip.js
 */

export default {
  name: "skip",
  aliases: ["pular"],
  description: "Pula a musica atual. Requer cargo bouncer ou superior.",
  usage: "!skip [motivo]",
  cooldown: 5_000,
  minRole: "bouncer",

  async execute(ctx) {
    const { api, bot, reply, rawArgs, t } = ctx;
    const reason = String(rawArgs ?? "").trim();
    try {
      await api.room.skipTrack(bot.cfg.room);
      const msg = reason
        ? t("cmd.skip.success_reason", { reason })
        : t("cmd.skip.success");
      await reply(msg);
    } catch (err) {
      await reply(t("cmd.skip.error", { error: err.message }));
    }
  },
};
