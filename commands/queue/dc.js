/**
 * commands/queue/dc.js
 */

import { ROLE_LEVELS } from "../../lib/permissions.js";
import { getWaitlistSnapshot } from "../../lib/storage.js";
import { getWaitlist } from "../../helpers/waitlist.js";

export default {
  name: "dc",
  aliases: ["disconnect"],
  description: "Restaura a posicao na fila apos uma desconexao rapida.",
  usage: "!dc [usuario]",
  cooldown: 10_000,

  async execute(ctx) {
    const { api, bot, args, sender, senderRoleLevel, reply, t } = ctx;
    const targetTag = args[0] ? args[0].replace(/^@/, "").trim() : null;
    const isSelf = !targetTag;

    let user;
    if (isSelf) {
      user = {
        userId: sender.userId,
        displayName: sender.displayName ?? sender.username ?? "user",
      };
    } else {
      user = bot.findRoomUser(targetTag);
      if (!user) {
        await reply(t("cmd.dc.not_found", { target: targetTag }));
        return;
      }
    }

    if (!isSelf && senderRoleLevel < ROLE_LEVELS.bouncer) {
      await reply(t("cmd.dc.no_permission"));
      return;
    }

    let snap;
    try {
      snap = await getWaitlistSnapshot(user.userId);
    } catch {
      await reply(t("cmd.dc.db_error"));
      return;
    }
    if (!snap) {
      await reply(t("cmd.dc.no_snapshot"));
      return;
    }

    const updatedAt = Number(snap.updated_at ?? snap.updatedAt ?? 0);
    const dcWindowMs = (Number(bot.cfg.dcWindowMin) || 10) * 60 * 1000;
    if (!updatedAt || Date.now() - updatedAt > dcWindowMs) {
      await reply(t("cmd.dc.expired"));
      return;
    }

    const oldPos = Number(snap.position);
    if (!oldPos || oldPos < 1) {
      await reply(t("cmd.dc.invalid_position"));
      return;
    }

    try {
      const waitlist = await getWaitlist(api, bot.cfg.room);
      const isTargetInWl = waitlist.some(
        (u) => String(u.id ?? u.userId) === String(user.userId),
      );

      if (!isTargetInWl) {
        await reply(t("cmd.dc.not_in_queue"));
        return;
      }

      await api.room.moveInWaitlist(bot.cfg.room, Number(user.userId), oldPos - 1);
      await reply(t("cmd.dc.success", { name: user.displayName, position: oldPos }));
    } catch (err) {
      await reply(t("cmd.dc.error", { error: err.message }));
    }
  },
};
