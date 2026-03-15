/**
 * commands/queue.js
 *
 * !queue / !fila — show the bot's waitlist position and next-up DJ info
 */

export default {
  name: "queue",
  aliases: ["fila", "waitlist", "position", "pos"],
  description: "Mostra a posição do bot na fila de DJs.",
  usage: "!queue",
  cooldown: 5_000,

  async execute(ctx) {
    const { bot, reply } = ctx;
    const s = bot.getSessionState();

    if (!s.inWaitlist || s.waitlistPosition == null) {
      await reply("O bot não está na fila no momento.");
      return;
    }

    const total = s.waitlistTotal ?? "?";
    const next = s.nextDjName ? ` (próximo: ${s.nextDjName})` : "";
    await reply(
      `🎧 Bot está na posição ${s.waitlistPosition}/${total} da fila${next}`,
    );
  },
};
