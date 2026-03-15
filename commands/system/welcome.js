/**
 * commands/system/welcome.js
 */

import { setSetting } from "../../lib/storage.js";

export default {
  name: "welcome",
  aliases: ["greet", "boasvindas"],
  description: "Ativa ou desativa a saudacao de entrada.",
  usage: "!welcome",
  cooldown: 5000,
  minRole: "bouncer",

  async execute(ctx) {
    const { bot, reply, t } = ctx;
    const enabled = !bot.cfg.greetEnabled;
    bot.updateConfig("greetEnabled", enabled);
    await setSetting("greetEnabled", enabled);
    await reply(t(enabled ? "cmd.welcome.enabled" : "cmd.welcome.disabled"));
  },
};
