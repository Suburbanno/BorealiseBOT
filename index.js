/**
 * index.js — Borealise Chatbot entry point
 *
 * Usage:
 *   node index.js                  # production
 *   node --watch index.js          # auto-restart on changes (Node ≥ 18)
 *
 * Required env vars (read from .env):
 *   BOT_EMAIL, BOT_PASSWORD, BOT_ROOM
 *
 * See .env.example for all available options.
 */
import { BorealiseBot } from "./lib/bot.js";
import { loadConfig } from "./lib/config.js";
import { initStorage, getAllSettings } from "./lib/storage.js";
import { applyStoredSettings } from "./lib/settings.js";
import { sleep } from "./helpers/time.js";
import { isServerDownError } from "./helpers/errors.js";
import { printBanner } from "./helpers/banner.js";
import { BOT_VERSION } from "./lib/version.js";

let bot;
const RETRY_MS = 30_000;

// ── Graceful shutdown ─────────────────────────────────────────────────────────

let stopping = false;

async function shutdown(signal) {
  if (stopping) return;
  stopping = true;
  console.log(`\n[index] ${signal} received — shutting down…`);
  if (bot) await bot.stop();
  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
// ── Start ──────────────────────────────────────────────────────────────────────
async function main() {
  printBanner({ name: "NiceATC", version: BOT_VERSION });
  await initStorage();
  const cfg = applyStoredSettings(loadConfig(), await getAllSettings());
  bot = new BorealiseBot(cfg);
  await bot.loadModules();

  while (true) {
    try {
      await bot.connect();
      return;
    } catch (err) {
      if (isServerDownError(err)) {
        console.error(
          `[index] Server unavailable. Retrying in ${RETRY_MS / 1000}s...`,
        );
        await sleep(RETRY_MS);
        continue;
      }

      console.error("[index] Fatal startup error:", err.message);
      process.exit(1);
    }
  }
}

main();
