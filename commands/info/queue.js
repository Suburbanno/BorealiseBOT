/**
 * commands/info/queue.js
 */

export default {
  name: "queue",
  aliases: ["fila", "waitlist", "position", "pos"],
  description: "Mostra a posição do bot na fila de DJs.",
  usage: "!queue",
  cooldown: 5_000,

  async execute(ctx) {
    const { bot, reply, t } = ctx;
    const s = bot.getSessionState();

    if (!s.inWaitlist || s.waitlistPosition == null) {
      await reply(t("cmd.queue.not_in_queue"));
      return;
    }

    const total = s.waitlistTotal ?? "?";
    const next = s.nextDjName ? t("cmd.queue.next", { name: s.nextDjName }) : "";
    await reply(t("cmd.queue.position", { position: s.waitlistPosition, total }) + next);
  },
};
