/**
 * commands/music/togglebl.js
 */

import { setSetting } from "../../lib/storage.js";

export default {
  name: "togglebl",
  aliases: ["bltoggle", "blacklisttoggle"],
  description: "Ativa ou desativa a blacklist de musicas.",
  usage: "!togglebl",
  cooldown: 5000,
  minRole: "bouncer",

  async execute(ctx) {
    const { bot, reply, t } = ctx;
    const enabled = !bot.cfg.blacklistEnabled;
    bot.updateConfig("blacklistEnabled", enabled);
    await setSetting("blacklistEnabled", enabled);
    await reply(t(enabled ? "cmd.togglebl.enabled" : "cmd.togglebl.disabled"));
  },
};
