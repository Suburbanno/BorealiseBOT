/**
 * commands/fun/cookie.js
 */
import { pickRandom } from "../../helpers/random.js";

export default {
  name: "cookie",
  description: "Da um cookie para alguem.",
  usage: "!cookie [usuario]",
  cooldown: 5000,

  async execute(ctx) {
    const { bot, sender, rawArgs, reply, t } = ctx;
    const targetInput = String(rawArgs ?? "")
      .replace(/^@/, "")
      .trim();
    const senderName = sender.username ?? sender.displayName ?? "alguem";

    if (!targetInput) {
      const lines = t("cmd.cookie.self_lines", { sender: senderName });
      const msg = pickRandom(lines);
      await reply(msg);
      return;
    }

    const user = bot.findRoomUser(targetInput);
    if (!user) {
      await reply(t("cmd.cookie.not_found", { target: targetInput }));
      return;
    }

    const targetName = user.username ?? user.displayName ?? targetInput;
    const lines = t("cmd.cookie.gift_lines", { sender: senderName, target: targetName });
    const msg = pickRandom(lines);
    await reply(msg);
  },
};
