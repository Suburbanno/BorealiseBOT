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

import { BorealiseBot } from "./bot.js";

const bot = new BorealiseBot();

// ── Graceful shutdown ─────────────────────────────────────────────────────────

let stopping = false;

async function shutdown(signal) {
  if (stopping) return;
  stopping = true;
  console.log(`\n[index] ${signal} received — shutting down…`);
  await bot.stop();
  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

// ── Start ──────────────────────────────────────────────────────────────────────

bot.start().catch((err) => {
  console.error("[index] Fatal startup error:", err.message);
  process.exit(1);
});
