/**
 * config.js
 *
 * Reads bot configuration from environment variables (loaded from .env).
 * Call loadConfig() once at startup.
 */

import { createRequire } from "module";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";

// Load .env from the chatbot directory
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, ".env");

if (!fs.existsSync(envPath)) {
  console.error(
    `[config] .env file not found at ${envPath}\n` +
      `         Copy .env.example to .env and fill in your credentials.`
  );
  process.exit(1);
}

// dotenv is CJS — use createRequire to load it
const require = createRequire(import.meta.url);
const dotenv = require("dotenv");
dotenv.config({ path: envPath });

export function loadConfig() {
  const required = (key) => {
    const value = process.env[key];
    if (!value) {
      console.error(`[config] Missing required env var: ${key}`);
      process.exit(1);
    }
    return value;
  };

  const optional = (key, fallback = "") => process.env[key] ?? fallback;
  const bool = (key, fallback) =>
    optional(key, fallback ? "true" : "false").toLowerCase() === "true";
  const int = (key, fallback) =>
    parseInt(optional(key, String(fallback)), 10) || fallback;

  return {
    email: required("BOT_EMAIL"),
    password: required("BOT_PASSWORD"),
    room: required("BOT_ROOM"),

    apiUrl: optional("BOREALISE_API_URL", "https://prod.borealise.com/api"),
    wsUrl: optional("BOREALISE_WS_URL", "wss://prod.borealise.com/ws"),

    cmdPrefix: optional("CMD_PREFIX", "!"),
    autoWoot: bool("AUTO_WOOT", true),
    autoJoin: bool("AUTO_JOIN", false),
    afkMessage: optional("AFK_MESSAGE", ""),
    afkCooldownMs: int("AFK_COOLDOWN_MS", 30_000),
  };
}
