import { BorealiseBot } from "./lib/bot.js";
import { loadConfig } from "./lib/config.js";
import { initStorage, getAllSettings } from "./lib/storage.js";
import { applyStoredSettings } from "./lib/settings.js";
import { setTimeout as sleep } from "timers/promises";
import { isServerDownError } from "./helpers/errors.js";
import { printBanner } from "./helpers/banner.js";
import { BOT_VERSION } from "./lib/version.js";
let bot;
const RETRY_MS = 30_000;
let stopping = false;
async function shutdown(signal) {
    if (stopping)
        return;
    stopping = true;
    console.log(`\n[index] ${signal} received — shutting down…`);
    if (bot) {
        await Promise.race([
            bot.stop(),
            new Promise(r => setTimeout(r, 10000).unref())
        ]);
    }
    process.exit(0);
}
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("uncaughtException", (err) => {
    console.error("[index] Uncaught Exception:", err);
    shutdown("UNCAUGHT_EXCEPTION");
});
process.on("unhandledRejection", (reason) => {
    console.error("[index] Unhandled Rejection:", reason);
    shutdown("UNHANDLED_REJECTION");
});
async function main() {
    printBanner({ name: "NiceATC", version: BOT_VERSION });
    try {
        await initStorage();
        const cfg = applyStoredSettings(loadConfig(), await getAllSettings());
        bot = new BorealiseBot(cfg);
        await bot.loadModules();
    }
    catch (err) {
        console.error("[index] Fatal initialization error:", err);
        process.exit(1);
    }
    while (true) {
        try {
            await bot.connect();
            return;
        }
        catch (err) {
            if (isServerDownError(err)) {
                console.error(`[index] Server unavailable. Retrying in ${RETRY_MS / 1000}s...`);
                await sleep(RETRY_MS);
                continue;
            }
            console.error("[index] Fatal startup error:", err.message);
            process.exit(1);
        }
    }
}
main().catch(err => {
    console.error("[index] Fatal exception in main():", err);
    process.exit(1);
});
