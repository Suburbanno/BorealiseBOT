/**
 * commands/system/autowoot.js
 */

import { setSetting } from "../../lib/storage.js";

export default {
  name: "autowoot",
  aliases: ["aw"],
  description: "Ativa ou desativa o auto-woot do bot.",
  usage: "!autowoot",
  cooldown: 5000,
  minRole: "manager",

  async execute(ctx) {
    const { bot, reply, t } = ctx;
    const next = !bot.cfg.autoWoot;
    bot.updateConfig("autoWoot", next);
    await setSetting("autoWoot", next);
    await reply(t(next ? "cmd.autowoot.enabled" : "cmd.autowoot.disabled"));
  },
};
