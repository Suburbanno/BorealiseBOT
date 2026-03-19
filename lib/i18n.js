import { readFile } from "fs/promises";
import { createRequire } from "module";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
const __dirname = dirname(fileURLToPath(import.meta.url));
const LOCALES_DIR = resolve(__dirname, "../locales");
const _cache = new Map();
async function loadLocale(lang) {
    const cached = _cache.get(lang);
    if (cached)
        return cached;
    const file = resolve(LOCALES_DIR, `${lang}.json`);
    try {
        const raw = await readFile(file, "utf8");
        const data = JSON.parse(raw);
        _cache.set(lang, data);
        return data;
    }
    catch {
        if (lang !== "en") {
            console.warn(`[i18n] Locale "${lang}" not found — falling back to "en".`);
            return loadLocale("en");
        }
        throw new Error(`[i18n] English locale file not found at ${file}`);
    }
}
function resolve_(data, key) {
    return key.split(".").reduce((o, k) => (o != null && typeof o === "object" ?o[k] : undefined), data);
}
function interpolate(str, vars) {
    if (!vars || typeof str !== "string")
        return str;
    return str.replace(/\{(\w+)\}/g, (_, k) => (vars[k] != null ?String(vars[k]) : `{${k}}`));
}
function createT(lang, localeData) {
    return function t(key, vars) {
        const val = resolve_(localeData, key);
        if (val === undefined) {
            console.warn(`[i18n:${lang}] Missing key: "${key}"`);
            return key;
        }
        if (Array.isArray(val)) {
            if (!vars)
                return val;
            return val.map((item) => (typeof item === "string" ?interpolate(item, vars) : item));
        }
        if (typeof val !== "string") {
            console.warn(`[i18n:${lang}] Key "${key}" is not a string or array (got ${typeof val}).`);
            return String(val);
        }
        return interpolate(val, vars);
    };
}
export async function createI18n(lang = "en") {
    const data = await loadLocale(lang);
    return createT(lang, data);
}
export function createI18nSync(lang, data) {
    return createT(lang, data);
}
export function clearLocaleCache() {
    _cache.clear();
}
