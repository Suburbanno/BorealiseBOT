import { fileURLToPath, pathToFileURL } from "url";
import path from "path";
import { ROLE_LEVELS } from "../lib/permissions.js";
import { listJsFilesRecursive } from "../helpers/fs.js";

export class CommandRegistry {
  constructor() {
    this._commands = new Map();
    this._aliases = new Map();
    this._cooldowns = new Map();
  }

  reset() {
    this._commands.clear();
    this._aliases.clear();
    this._cooldowns.clear();
  }

  register(cmd) {
    if (!cmd?.name || typeof cmd.execute !== "function") {
      throw new Error(`[CommandRegistry] Invalid command: must have "name" and "execute".`);
    }

    const key = cmd.name.toLowerCase();
    if (this._commands.has(key)) {
      console.warn(`[CommandRegistry] Overwriting existing command: ${key}`);
    }

    this._commands.set(key, cmd);
    for (const alias of cmd.aliases ?? []) {
      this._aliases.set(alias.toLowerCase(), key);
    }
  }

  async loadDir(dirUrl) {
    const summary = { loaded: 0, failed: 0, errors: [] };
    const dirPath = fileURLToPath(dirUrl);
    const selfPath = fileURLToPath(import.meta.url);

    let files;
    try {
      files = listJsFilesRecursive(dirPath, new Set([selfPath]));
    } catch (err) {
      summary.failed++;
      summary.errors.push({ file: dirPath, error: err.message });
      return summary;
    }

    files.sort();

    for (const file of files) {
      const rel = path.relative(dirPath, file);
      let exported;

      try {
        const mod = await import(pathToFileURL(file).href);
        exported = mod.default ?? mod;
      } catch (err) {
        summary.failed++;
        summary.errors.push({ file: rel, error: err.message });
        continue;
      }

      const cmds = Array.isArray(exported) ? exported : [exported];
      for (const cmd of cmds) {
        try {
          this.register(cmd);
          summary.loaded++;
        } catch (err) {
          summary.failed++;
          summary.errors.push({ file: rel, error: err.message });
        }
      }
    }

    return summary;
  }

  resolve(name) {
    const key = name.toLowerCase();
    if (this._commands.has(key)) return this._commands.get(key);
    const canonical = this._aliases.get(key);
    if (canonical) return this._commands.get(canonical);
    return undefined;
  }

  get all() {
    return [...this._commands.values()];
  }

  _getDeleteDelay(ctx, cmd) {
    if (!cmd) return null;
    if (cmd.deleteOn === false) return null;

    if (cmd.deleteOn === true) {
      const fallback = Number(ctx.bot?.cfg?.deleteCommandMessagesDelayMs ?? 0);
      return fallback >= 0 ? fallback : null;
    }

    if (Number.isFinite(cmd.deleteOn)) {
      const delay = Number(cmd.deleteOn);
      return delay >= 0 ? delay : null;
    }

    return null;
  }

  _wrapReply(ctx, cmd) {
    const baseReply = ctx.reply;
    const deleteDelayMs = this._getDeleteDelay(ctx, cmd);

    return async (text) => {
      const result = await baseReply(text);
      if (deleteDelayMs != null && result?.messageId) {
        ctx.bot.scheduleMessageDelete(result.messageId, deleteDelayMs);
      }
      return result;
    };
  }

  async dispatch(ctx, name) {
    const cmd = this.resolve(name);
    if (!cmd) return;

    const commandCtx = {
      ...ctx,
      reply: this._wrapReply(ctx, cmd),
    };

    if (cmd.minRole) {
      const required = ROLE_LEVELS[cmd.minRole.toLowerCase()] ?? 0;

      if ((commandCtx.botRoleLevel ?? 0) < required) {
        console.log(
          `[CommandRegistry] Bot lacks role "${cmd.minRole}" (level ${commandCtx.botRoleLevel}) for !${cmd.name} — skipping`,
        );
        await commandCtx
          .reply(commandCtx.t("registry.no_permission_bot", { cmd: cmd.name, role: cmd.minRole }))
          .catch(() => {});
        return;
      }

      if ((commandCtx.senderRoleLevel ?? 0) < required) {
        await commandCtx
          .reply(commandCtx.t("registry.no_permission_user", {
            user: commandCtx.sender.username ?? commandCtx.sender.userId,
            role: cmd.minRole,
            cmd: cmd.name,
          }))
          .catch(() => {});
        return;
      }
    }

    const cooldownMs = cmd.cooldown ?? 3_000;
    if (cooldownMs > 0 && commandCtx.sender?.userId) {
      const ck = `${commandCtx.sender.userId}:${cmd.name}`;
      const last = this._cooldowns.get(ck) ?? 0;
      const remaining = cooldownMs - (Date.now() - last);

      if (remaining > 0) {
        const secs = Math.ceil(remaining / 1000);
        await commandCtx
          .reply(commandCtx.t("registry.cooldown", {
            user: commandCtx.sender.username ?? commandCtx.sender.userId,
            secs,
            cmd: cmd.name,
          }))
          .catch(() => {});
        return;
      }

      this._cooldowns.set(ck, Date.now());
    }

    await cmd.execute(commandCtx);
  }
}
