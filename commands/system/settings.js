/**
 * commands/system/settings.js
 */
import { getSetting, setSetting } from "../../lib/storage.js";
import { RUNTIME_SETTING_KEYS, parseSettingValue } from "../../lib/settings.js";

const ALLOWED_KEYS = new Set(RUNTIME_SETTING_KEYS);

export default {
  name: "settings",
  aliases: ["config", "set"],
  description: "Consulta ou altera configuracoes persistentes do bot.",
  usage: "!settings <chave> [valor]",
  cooldown: 3000,
  minRole: "manager",

  async execute(ctx) {
    const { args, reply, bot, t } = ctx;
    const key = args[0];
    if (!key) {
      await reply(t("cmd.settings.usage"));
      return;
    }

    if (key === "list") {
      await reply(t("cmd.settings.list", { keys: RUNTIME_SETTING_KEYS.join(", ") }));
      return;
    }

    if (!ALLOWED_KEYS.has(key)) {
      await reply(t("cmd.settings.invalid_key"));
      return;
    }
    if (args.length === 1) {
      // Consultar
      const val = await getSetting(key, bot.cfg[key]);
      await reply(
        val !== undefined
          ? t("cmd.settings.value", { key, value: JSON.stringify(val) })
          : t("cmd.settings.not_found", { key })
      );
      return;
    }
    // Alterar
    const rawValue = args.slice(1).join(" ");
    const value = parseSettingValue(rawValue);
    await setSetting(key, value);
    bot.updateConfig(key, value);
    await reply(t("cmd.settings.updated", { key, value: JSON.stringify(value) }));
  },
};
