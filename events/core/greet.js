/**
 * events/greet.js
 *
 * Sends a configurable welcome message when a user joins the room.
 *
 * Configuration (via .env):
 *   GREET_ENABLED=true          — toggle on/off at startup
 *   GREET_MESSAGE=🎵 ...        — message template (supports {name} and {username})
 *   GREET_COOLDOWN_MS=3600000   — per-user cooldown in ms (default: 1 hour)
 *
 * The handler can also be toggled at runtime:
 *   bot.events.enable("greet")
 *   bot.events.disable("greet")
 *
 * Cooldown is managed by EventRegistry using cooldownScope: "user", so each
 * user has their own cooldown window — the bot won't greet the same person
 * again until the cooldown expires.
 */

import { Events } from "@borealise/shared";

export default {
  name: "greet",
  description:
    "Saúda novos usuários quando entram na sala. Configurável via GREET_* no .env.",
  enabled: true,

  event: Events.ROOM_USER_JOIN,

  /**
   * Cooldown value read dynamically from bot config so GREET_COOLDOWN_MS is
   * respected without restarting the process.
   * EventRegistry calls this with (ctx, data) before each dispatch.
   */
  cooldown: (ctx) => ctx.bot.cfg.greetCooldownMs,
  cooldownScope: "user",

  async handle(ctx, data) {
    const { bot, reply, t } = ctx;

    const userId = String(data?.userId ?? data?.user_id ?? data?.id ?? "");
    if (!userId || userId === String(bot._userId)) return;

    const display =
      data?.displayName ?? data?.display_name ?? data?.username ?? null;
    const username = data?.username ?? display ?? null;

    if (!display) return;

    const template = bot.cfg.greetMessage || t("event.greet.message");
    const message = template
      .replace(/{name}/g, display)
      .replace(/{username}/g, username ?? display);

    await reply(message);
  },
};
