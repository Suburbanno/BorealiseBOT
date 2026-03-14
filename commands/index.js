/**
 * commands/index.js — CommandRegistry
 *
 * Loads every .js file from the commands/ directory (excluding itself)
 * and registers them by name + aliases.
 *
 * Each command module must export a default object that satisfies:
 *
 *   {
 *     name:        string          — primary trigger (without prefix)
 *     aliases?:    string[]        — alternative triggers
 *     description: string          — shown in !help
 *     usage?:      string          — shown in !help <command>
 *     cooldown?:   number          — per-user cooldown in ms (default: 3 000)
 *     minRole?:    string          — minimum room role required (e.g. "bouncer", "manager")
 *     execute(ctx): Promise<void>  — command handler
 *   }
 *
 * Context object passed to execute():
 *
 *   {
 *     bot:      BorealiseBot       — bot instance
 *     api:      ApiClient          — REST client (for advanced commands)
 *     args:     string[]           — whitespace-split arguments
 *     rawArgs:  string             — everything after the command name
 *     message:  string             — full original message
 *     sender:   { userId, username, displayName }
 *     senderRole:      string      — sender's room role ("bouncer", "user", etc.)
 *     senderRoleLevel: number      — numeric privilege level of sender
 *     botRole:         string      — bot's own room role
 *     botRoleLevel:    number      — numeric privilege level of bot
 *     room:     string             — room slug
 *     reply(text): Promise<void>   — send a chat message
 *   }
 */

import { readdirSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";
import { ROLE_LEVELS, getRoleLevel } from "../lib/permissions.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class CommandRegistry {
  constructor() {
    /** @type {Map<string, object>} name → command definition */
    this._commands = new Map();
    /** @type {Map<string, string>} alias → canonical name */
    this._aliases = new Map();
    /** @type {Map<string, number>} "userId:commandName" → lastUsedTs */
    this._cooldowns = new Map();
  }

  // ── Registration ───────────────────────────────────────────────────────────

  /**
   * Register a single command definition.
   * @param {object} cmd
   */
  register(cmd) {
    if (!cmd?.name || typeof cmd.execute !== "function") {
      throw new Error(
        `[CommandRegistry] Invalid command: must have "name" and "execute".`,
      );
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

  /**
   * Dynamically import all .js command files from a directory URL.
   * @param {URL} dirUrl  — e.g. new URL('./commands/', import.meta.url)
   */
  async loadDir(dirUrl) {
    const dirPath = fileURLToPath(dirUrl);
    const selfName = "index.js";

    let files;
    try {
      files = readdirSync(dirPath).filter(
        (f) => f.endsWith(".js") && f !== selfName,
      );
    } catch (err) {
      console.error(
        `[CommandRegistry] Could not read commands dir: ${err.message}`,
      );
      return;
    }

    for (const file of files) {
      try {
        const mod = await import(new URL(file, dirUrl).href);
        const exported = mod.default ?? mod;
        // Support both single-command export and array-of-commands export
        const cmds = Array.isArray(exported) ? exported : [exported];
        for (const cmd of cmds) {
          this.register(cmd);
          console.log(`[CommandRegistry] Loaded: ${cmd.name}`);
        }
      } catch (err) {
        console.error(
          `[CommandRegistry] Failed to load ${file}: ${err.message}`,
        );
      }
    }
  }

  // ── Lookup ─────────────────────────────────────────────────────────────────

  /**
   * Resolve a command by name or alias. Returns undefined if not found.
   * @param {string} name
   */
  resolve(name) {
    const key = name.toLowerCase();
    if (this._commands.has(key)) return this._commands.get(key);
    const canonical = this._aliases.get(key);
    if (canonical) return this._commands.get(canonical);
    return undefined;
  }

  /**
   * All registered command definitions (unique, no duplicates for aliases).
   * @returns {object[]}
   */
  get all() {
    return [...this._commands.values()];
  }

  // ── Dispatch ───────────────────────────────────────────────────────────────

  /**
   * Find and execute a command by name. Handles cooldown enforcement.
   * @param {object} ctx  — context built by bot.js
   * @param {string} name — command name (already lowercased, without prefix)
   */
  async dispatch(ctx, name) {
    const cmd = this.resolve(name);
    if (!cmd) return; // silently ignore unknown commands

    // ── Role check ────────────────────────────────────────────────────────────
    if (cmd.minRole) {
      const required = ROLE_LEVELS[cmd.minRole.toLowerCase()] ?? 0;

      // Check if the bot itself has the required role in the room.
      if ((ctx.botRoleLevel ?? 0) < required) {
        console.log(
          `[CommandRegistry] Bot lacks role "${cmd.minRole}" (level ${ctx.botRoleLevel}) for !${cmd.name} — skipping`,
        );
        await ctx
          .reply(
            `Não tenho permissão para executar !${cmd.name} — preciso ser ${cmd.minRole} ou superior.`,
          )
          .catch(() => {});
        return;
      }

      // Check if the message sender has the required role.
      if ((ctx.senderRoleLevel ?? 0) < required) {
        await ctx
          .reply(
            `@${ctx.sender.username ?? ctx.sender.userId} Você precisa ser ${cmd.minRole} ou superior para usar !${cmd.name}.`,
          )
          .catch(() => {});
        return;
      }
    }

    // Cooldown check
    const cooldownMs = cmd.cooldown ?? 3_000;
    if (cooldownMs > 0 && ctx.sender?.userId) {
      const ck = `${ctx.sender.userId}:${cmd.name}`;
      const last = this._cooldowns.get(ck) ?? 0;
      const remaining = cooldownMs - (Date.now() - last);
      if (remaining > 0) {
        const secs = Math.ceil(remaining / 1000);
        await ctx
          .reply(
            `@${ctx.sender.username ?? ctx.sender.userId} aguarda ${secs}s para usar !${cmd.name} novamente.`,
          )
          .catch(() => {});
        return;
      }
      this._cooldowns.set(ck, Date.now());
    }

    await cmd.execute(ctx);
  }
}
