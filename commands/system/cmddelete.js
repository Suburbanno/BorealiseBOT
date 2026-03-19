import { getSetting, setSetting } from "../../lib/storage.js";

function parseBoolean(value) {
  if (value == null) return null;

  const normalized = String(value).trim().toLowerCase();
  if (["on", "true", "1", "enable", "enabled"].includes(normalized)) return true;
  if (["off", "false", "0", "disable", "disabled"].includes(normalized)) return false;
  return null;
}

export default {
  name: "cmddelete",
  aliases: ["delcmd", "commanddelete"],
  description: "Ativa, desativa ou consulta a deleção automática de comandos.",
  usage: "!cmddelete [on|off|status|delay <ms>]",
  cooldown: 3000,
  minRole: "manager",

  async execute(ctx) {
    const { args, reply, bot, t } = ctx;
    const sub = String(args[0] ?? "status").toLowerCase();

    if (sub === "status") {
      await reply(
        t("cmd.cmddelete.status", {
          state: bot.cfg.deleteCommandMessagesEnabled
            ? t("cmd.cmddelete.state_on")
            : t("cmd.cmddelete.state_off"),
          delay: bot.cfg.deleteCommandMessagesDelayMs,
        }),
      );
      return;
    }

    if (sub === "delay") {
      const raw = Number(args[1]);
      if (!Number.isFinite(raw) || raw < 0) {
        await reply(t("cmd.cmddelete.delay_usage"));
        return;
      }

      const value = Math.floor(raw);
      await setSetting("deleteCommandMessagesDelayMs", value);
      bot.updateConfig("deleteCommandMessagesDelayMs", value);
      await reply(t("cmd.cmddelete.delay_updated", { value }));
      return;
    }

    const enabled = parseBoolean(sub);
    if (enabled == null) {
      await reply(t("cmd.cmddelete.usage"));
      return;
    }

    await setSetting("deleteCommandMessagesEnabled", enabled);
    bot.updateConfig("deleteCommandMessagesEnabled", enabled);

    const delay = await getSetting(
      "deleteCommandMessagesDelayMs",
      bot.cfg.deleteCommandMessagesDelayMs,
    );
    bot.updateConfig("deleteCommandMessagesDelayMs", Number(delay) || 0);

    await reply(
      enabled ? t("cmd.cmddelete.enabled") : t("cmd.cmddelete.disabled"),
    );
  },
};
