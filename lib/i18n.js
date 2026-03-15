/**
 * lib/i18n.js
 *
 * Lightweight i18n helper. Loads a JSON locale file from locales/ and
 * exposes a `t(key, vars?)` function for string interpolation.
 *
 * Usage:
 *   import { createI18n } from './lib/i18n.js';
 *   const t = createI18n('pt');
 *   t('cmd.ban.not_found', { target: 'foo' }); // → 'Usuario "foo" nao encontrado na sala.'
 *   t('cmd.cookie.self_lines');                 // → string[] (raw array)
 *
 * Placeholders use {key} syntax. Arrays are returned as-is so callers can
 * use pickRandom() or other helpers on them.
 *
 * Falls back to English if the requested locale file is missing.
 * Falls back to the key path if the string is missing from the locale.
 */

import { readFile } from "fs/promises";
import { createRequire } from "module";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOCALES_DIR = resolve(__dirname, "../locales");

// Cache of loaded locale data — avoids re-reading the file on every bot reload
const _cache = new Map();

/**
 * Load (and cache) a locale JSON by language code.
 * Falls back to "en" if the file is not found.
 * @param {string} lang  e.g. "pt" or "en"
 * @returns {Promise<Record<string,unknown>>}
 */
async function loadLocale(lang) {
  const cached = _cache.get(lang);
  if (cached) return cached;

  const file = resolve(LOCALES_DIR, `${lang}.json`);
  try {
    const raw = await readFile(file, "utf8");
    const data = JSON.parse(raw);
    _cache.set(lang, data);
    return data;
  } catch {
    if (lang !== "en") {
      console.warn(`[i18n] Locale "${lang}" not found — falling back to "en".`);
      return loadLocale("en");
    }
    throw new Error(`[i18n] English locale file not found at ${file}`);
  }
}

/**
 * Resolve a dot-separated key path inside a nested object.
 * Returns the raw value (string, array, or undefined).
 * @param {Record<string,unknown>} data
 * @param {string} key  e.g. "cmd.ban.not_found"
 */
function resolve_(data, key) {
  return key.split(".").reduce((o, k) => (o != null && typeof o === "object" ? o[k] : undefined), data);
}

/**
 * Interpolate {placeholder} tokens in a string.
 * @param {string} str
 * @param {Record<string,string|number>} [vars]
 */
function interpolate(str, vars) {
  if (!vars || typeof str !== "string") return str;
  return str.replace(/\{(\w+)\}/g, (_, k) => (vars[k] != null ? String(vars[k]) : `{${k}}`));
}

/**
 * Create a bound translation function for the given language.
 *
 * @param {string} lang
 * @param {Record<string,unknown>} localeData  — pre-loaded locale object
 * @returns {(key: string, vars?: Record<string,string|number>) => string | string[]}
 */
function createT(lang, localeData) {
  /**
   * @param {string} key   dot-separated key, e.g. "cmd.ban.not_found"
   * @param {Record<string,string|number>} [vars]  interpolation variables
   * @returns {string | string[]}
   */
  return function t(key, vars) {
    const val = resolve_(localeData, key);

    if (val === undefined) {
      console.warn(`[i18n:${lang}] Missing key: "${key}"`);
      return key;
    }

    // Return arrays as-is so callers can use pickRandom() etc.
    if (Array.isArray(val)) {
      if (!vars) return val;
      return val.map((item) => (typeof item === "string" ? interpolate(item, vars) : item));
    }

    if (typeof val !== "string") {
      console.warn(`[i18n:${lang}] Key "${key}" is not a string or array (got ${typeof val}).`);
      return String(val);
    }

    return interpolate(val, vars);
  };
}

/**
 * Load the locale for `lang` and return a ready-to-use `t()` function.
 * This is async because it reads from disk on first call.
 *
 * @param {string} lang  e.g. "pt" | "en"
 * @returns {Promise<(key: string, vars?: Record<string,string|number>) => string | string[]>}
 */
export async function createI18n(lang = "en") {
  const data = await loadLocale(lang);
  return createT(lang, data);
}

/**
 * Synchronously create a translation function from a pre-loaded locale data object.
 * Use this when you have already loaded the locale data (e.g. in a hot-reload flow).
 *
 * @param {string} lang
 * @param {Record<string,unknown>} data
 */
export function createI18nSync(lang, data) {
  return createT(lang, data);
}

/** Clear the locale cache (useful when hot-reloading locales). */
export function clearLocaleCache() {
  _cache.clear();
}
