/**
 * commands/mod/swap.js
 */

import { getWaitlist } from "../../helpers/waitlist.js";

export default {
  name: "swap",
  aliases: ["trocar"],
  description:
    "Troca a posicao de dois usuarios na fila. Requer cargo bouncer ou superior.",
  usage: "!swap <usuario1> <usuario2>",
  cooldown: 5_000,
  minRole: "bouncer",

  async execute(ctx) {
    const { api, bot, args, reply, t } = ctx;
    const targetA = (args[0] ?? "").replace(/^@/, "").trim();
    const targetB = (args[1] ?? "").replace(/^@/, "").trim();

    if (!targetA || !targetB) {
      await reply(t("cmd.swap.usage"));
      return;
    }

    const userA = bot.findRoomUser(targetA);
    const userB = bot.findRoomUser(targetB);
    if (!userA || !userB) {
      await reply(t("cmd.swap.not_found"));
      return;
    }

    try {
      const wl = await getWaitlist(api, bot.cfg.room);
      const idxA = wl.findIndex(
        (u) => String(u.id ?? u.userId) === String(userA.userId),
      );
      const idxB = wl.findIndex(
        (u) => String(u.id ?? u.userId) === String(userB.userId),
      );

      if (idxA < 0 || idxB < 0) {
        await reply(t("cmd.swap.not_in_queue"));
        return;
      }

      if (idxA === idxB) {
        await reply(t("cmd.swap.same_position"));
        return;
      }

      if (idxA < idxB) {
        await api.room.moveInWaitlist(bot.cfg.room, Number(userB.userId), idxA);
        await api.room.moveInWaitlist(bot.cfg.room, Number(userA.userId), idxB);
      } else {
        await api.room.moveInWaitlist(bot.cfg.room, Number(userA.userId), idxB);
        await api.room.moveInWaitlist(bot.cfg.room, Number(userB.userId), idxA);
      }

      await reply(
        t("cmd.swap.success", {
          nameA: userA.displayName ?? userA.username,
          nameB: userB.displayName ?? userB.username,
        })
      );
    } catch (err) {
      await reply(t("cmd.swap.error", { error: err.message }));
    }
  },
};
