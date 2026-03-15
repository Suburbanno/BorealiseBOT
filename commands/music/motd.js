/**
 * commands/music/motd.js
 */

import { setSetting } from "../../lib/storage.js";

const motd = {
  name: "motd",
  aliases: ["mensagem"],
  description: "Configura a mensagem do dia (MOTD) e o intervalo.",
  usage: "!motd [mensagem|on|off|interval <n>]",
  cooldown: 5000,
  minRole: "bouncer",

  async execute(ctx) {
    const { bot, args, reply, t } = ctx;

    if (args.length === 0) {
      const enabled = Boolean(bot.cfg.motdEnabled);
      const interval = bot.cfg.motdInterval ?? 0;
      const msg = bot.cfg.motd ?? "";
      await reply(t("cmd.motd.status", {
        state: enabled ? t("cmd.motd.state_on") : t("cmd.motd.state_off"),
        interval,
        msg
      }));
      return;
    }

    const sub = args[0].toLowerCase();
    if (sub === "on" || sub === "off") {
      const enabled = sub === "on";
      bot.updateConfig("motdEnabled", enabled);
      await setSetting("motdEnabled", enabled);
      await reply(t(enabled ? "cmd.motd.enabled" : "cmd.motd.disabled"));
      return;
    }

    if (sub === "interval") {
      const n = Number(args[1]);
      if (!Number.isFinite(n) || n <= 0) {
        await reply(t("cmd.motd.interval_usage"));
        return;
      }
      bot.updateConfig("motdInterval", Math.floor(n));
      await setSetting("motdInterval", Math.floor(n));
      await reply(t("cmd.motd.interval_updated", { value: Math.floor(n) }));
      return;
    }

    const message = args.join(" ").trim();
    if (!message) {
      await reply(t("cmd.motd.msg_usage"));
      return;
    }

    bot.updateConfig("motd", message);
    bot.updateConfig("motdEnabled", true);
    await setSetting("motd", message);
    await setSetting("motdEnabled", true);
    await reply(t("cmd.motd.updated"));
  },
};

const togglemotd = {
  name: "togglemotd",
  aliases: ["motdtoggle"],
  description: "Ativa ou desativa a mensagem do dia (MOTD).",
  usage: "!togglemotd",
  cooldown: 5000,
  minRole: "bouncer",

  async execute(ctx) {
    const { bot, reply, t } = ctx;
    const enabled = !bot.cfg.motdEnabled;
    bot.updateConfig("motdEnabled", enabled);
    await setSetting("motdEnabled", enabled);
    await reply(t(enabled ? "cmd.motd.enabled" : "cmd.motd.disabled"));
  },
};

export default [motd, togglemotd];
