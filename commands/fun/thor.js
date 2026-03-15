/**
 * commands/fun/thor.js
 */
import { pickRandom } from "../../helpers/random.js";
import { getWaitlist } from "../../helpers/waitlist.js";
import { getRoleLevel } from "../../lib/permissions.js";

const GOOD_CHANCE = 3;
const NEUTRAL_CHANCE = 27;

export default {
  name: "thor",
  description: "Teste sua sorte com o martelo do Thor.",
  usage: "!thor",
  cooldown: 1000_000,

  async execute(ctx) {
    const { bot, api, sender, reply, t } = ctx;
    const userId = sender.userId != null ? String(sender.userId) : "";
    const name = sender.username ?? sender.displayName ?? "alguem";
    const tag = `@${name}`;

    if (!userId) {
      await reply(t("cmd.thor.no_user"));
      return;
    }

    if (!api?.room?.getWaitlist) {
      await reply(t("cmd.thor.api_unavailable"));
      return;
    }

    if (bot.getBotRoleLevel() < getRoleLevel("bouncer")) {
      await reply(t("cmd.thor.no_permission"));
      return;
    }

    let waitlist = [];
    try {
      waitlist = await getWaitlist(api, bot.cfg.room);
    } catch (err) {
      await reply(t("cmd.thor.queue_error", { error: err.message }));
      return;
    }

    const inList = waitlist.some(
      (u) => String(u.id ?? u.userId ?? u.user_id ?? "") === userId,
    );
    if (!inList) {
      await reply(t("cmd.thor.not_in_queue"));
      return;
    }

    const roll = Math.floor(Math.random() * 100);
    if (roll < GOOD_CHANCE) {
      try {
        await api.room.moveInWaitlist(bot.cfg.room, Number(userId), 0);
        const lines = t("cmd.thor.good_lines", { name: tag });
        await reply(pickRandom(lines));
      } catch (err) {
        await reply(t("cmd.thor.move_error", { name: tag, error: err.message }));
      }
      return;
    }

    if (roll < GOOD_CHANCE + NEUTRAL_CHANCE) {
      const lines = t("cmd.thor.neutral_lines", { name: tag });
      await reply(pickRandom(lines));
      return;
    }

    try {
      await api.room.removeFromWaitlist(bot.cfg.room, Number(userId));
      const lines = t("cmd.thor.bad_lines", { name: tag });
      await reply(pickRandom(lines));
    } catch (err) {
      await reply(t("cmd.thor.remove_error", { name: tag, error: err.message }));
    }
  },
};
