/**
 * commands/mod/timeguard.js
 */

import { setSetting } from "../../lib/storage.js";

export default {
  name: "timeguard",
  aliases: ["tg"],
  description: "Ativa ou desativa o limite de tempo de musica.",
  usage: "!timeguard",
  cooldown: 5_000,
  minRole: "bouncer",

  async execute(ctx) {
    const { bot, reply, t } = ctx;
    const enabled = !bot.cfg.timeGuardEnabled;
    bot.updateConfig("timeGuardEnabled", enabled);
    await setSetting("timeGuardEnabled", enabled);
    await reply(t(`cmd.timeguard.${enabled ? "enabled" : "disabled"}`));
  },
};
