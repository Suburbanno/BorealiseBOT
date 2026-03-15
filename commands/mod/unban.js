/**
 * commands/mod/unban.js
 */

export default {
  name: "unban",
  aliases: ["desbanir"],
  description: "Remove o ban de um usuario. Requer cargo manager ou superior.",
  usage: "!unban <usuario>",
  cooldown: 5_000,
  minRole: "manager",

  async execute(ctx) {
    const { api, bot, args, reply, t } = ctx;
    const target = (args[0] ?? "").replace(/^@/, "").trim();
    if (!target) {
      await reply(t("cmd.unban.usage"));
      return;
    }

    let userId = bot.findRoomUser(target)?.userId ?? null;

    if (!userId) {
      try {
        const bansRes = await api.room.getBans(bot.cfg.room);
        const bans = bansRes?.data?.data ?? bansRes?.data ?? [];
        const lower = target.toLowerCase();
        const found = (Array.isArray(bans) ? bans : []).find(
          (b) =>
            (b.username ?? "").toLowerCase() === lower ||
            (b.displayName ?? b.display_name ?? "").toLowerCase() === lower,
        );
        if (found) {
          userId = String(found.userId ?? found.user_id ?? found.id ?? "");
        }
      } catch {
        // getBans failed — try anyway below; server will return an error if invalid
      }
    }

    if (!userId) {
      await reply(t("cmd.unban.not_found", { target }));
      return;
    }

    try {
      await api.room.unban(bot.cfg.room, userId);
      await reply(t("cmd.unban.success", { target }));
    } catch (err) {
      await reply(t("cmd.unban.error", { error: err.message }));
    }
  },
};
