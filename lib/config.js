import { createRequire } from "module";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const envPath = path.join(ROOT, ".env");
if (!fs.existsSync(envPath)) {
    console.error(`[config] .env not found at ${envPath}\n` +
        "         Copy .env.example to .env and fill in your credentials.");
    process.exit(1);
}
const require = createRequire(import.meta.url);
const dotenv = require("dotenv");
dotenv.config({ path: envPath });
const configPath = path.join(ROOT, "config.json");
const examplePath = path.join(ROOT, "config.example.json");
if (!fs.existsSync(configPath)) {
    if (fs.existsSync(examplePath)) {
        fs.copyFileSync(examplePath, configPath);
        console.warn("[config] config.json not found — copied from config.example.json.\n" +
            "         Edit config.json (especially 'room') before running.");
    }
    else {
        console.error(`[config] config.json not found at ${configPath}\n` +
            "         Copy config.example.json to config.json and edit it.");
        process.exit(1);
    }
}
let _json;
try {
    _json = JSON.parse(fs.readFileSync(configPath, "utf8"));
}
catch (err) {
    console.error(`[config] Failed to parse config.json: ${err.message}`);
    process.exit(1);
}
export function loadConfig() {
    const requiredEnv = (key) => {
        const v = process.env[key];
        if (!v) {
            console.error(`[config] Missing required env var: ${key}`);
            process.exit(1);
        }
        return v;
    };
    const j = (key, fallback) => _json[key] ?? fallback;
    const jBool = (key, fallback) => Boolean(j(key, fallback));
    const jInt = (key, fallback) => {
        const v = Number(j(key, fallback));
        return Number.isFinite(v) ?v : fallback;
    };
    const jStr = (key, fallback) => String(j(key, fallback) ?? "");
    const jArr = (key, fallback) => {
        const v = j(key, fallback);
        return Array.isArray(v) ?v : fallback;
    };
    const room = jStr("room", "");
    if (!room || room === "room-slug") {
        console.error("[config] config.json: 'room' must be set to a valid room slug.");
        process.exit(1);
    }
    return {
        email: requiredEnv("BOT_EMAIL"),
        password: requiredEnv("BOT_PASSWORD"),
        room,
        apiUrl: jStr("apiUrl", "https://prod.borealise.com/api"),
        wsUrl: jStr("wsUrl", "wss://prod.borealise.com/ws"),
        cmdPrefix: jStr("cmdPrefix", "!"),
        autoWoot: jBool("autoWoot", true),
        botMessage: jStr("botMessage", ""),
        botMentionCooldownMs: jInt("botMentionCooldownMs", 30_000),
        greetEnabled: jBool("greetEnabled", true),
        greetMessage: jStr("greetMessage", ""),
        greetCooldownMs: jInt("greetCooldownMs", 3_600_000),
        motdEnabled: jBool("motdEnabled", false),
        motdInterval: jInt("motdInterval", 5),
        motd: jStr("motd", ""),
        intervalMessages: jArr("intervalMessages", []),
        messageInterval: jInt("messageInterval", 5),
        blacklistEnabled: jBool("blacklistEnabled", true),
        deleteCommandMessagesEnabled: jBool("deleteCommandMessagesEnabled", false),
        deleteCommandMessagesDelayMs: jInt("deleteCommandMessagesDelayMs", 5000),
        timeGuardEnabled: jBool("timeGuardEnabled", false),
        maxSongLengthMin: jInt("maxSongLengthMin", 10),
        mediaCheckDebug: jBool("mediaCheckDebug", false),
        dcWindowMin: jInt("dcWindowMin", 10),
        language: jStr("language", "pt"),
    };
}
