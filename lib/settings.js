export const RUNTIME_SETTING_KEYS = [
    "autoWoot",
    "botMessage",
    "botMentionCooldownMs",
    "greetEnabled",
    "greetMessage",
    "greetCooldownMs",
    "motdEnabled",
    "motd",
    "motdInterval",
    "intervalMessages",
    "messageInterval",
    "blacklistEnabled",
    "deleteCommandMessagesEnabled",
    "deleteCommandMessagesDelayMs",
    "timeGuardEnabled",
    "maxSongLengthMin",
    "language",
    "dcWindowMin",
    "mediaCheckDebug",
];
const RUNTIME_SETTING_SET = new Set(RUNTIME_SETTING_KEYS);
export function filterRuntimeSettings(input) {
    const out = {};
    if (!input || typeof input !== "object")
        return out;
    for (const [key, value] of Object.entries(input)) {
        if (RUNTIME_SETTING_SET.has(key))
            out[key] = value;
    }
    return out;
}
export function parseSettingValue(raw) {
    if (raw == null)
        return null;
    if (typeof raw !== "string")
        return raw;
    const trimmed = raw.trim();
    if (trimmed === "true")
        return true;
    if (trimmed === "false")
        return false;
    if (trimmed !== "" && !Number.isNaN(Number(trimmed))) {
        return Number(trimmed);
    }
    if ((trimmed.startsWith("[") && trimmed.endsWith("]")) ||
        (trimmed.startsWith("{") && trimmed.endsWith("}"))) {
        try {
            return JSON.parse(trimmed);
        }
        catch {
            return raw;
        }
    }
    return raw;
}
export function applyStoredSettings(cfg, stored) {
    const overrides = filterRuntimeSettings(stored);
    return { ...cfg, ...overrides };
}
