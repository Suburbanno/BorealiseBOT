/**
 * commands/mod/lock.js
 */

export default {
  name: "lock",
  aliases: ["lockwl", "lockqueue", "travar"],
  description: "Trava a fila de DJs. Requer cargo bouncer ou superior.",
  usage: "!lock",
  cooldown: 5_000,
  minRole: "bouncer",

  async execute(ctx) {
    const { api, bot, reply, t } = ctx;
    try {
      await api.room.lockWaitlist(bot.cfg.room);
      await reply(t("cmd.lock.success"));
    } catch (err) {
      await reply(t("cmd.lock.error", { error: err.message }));
    }
  },
};
