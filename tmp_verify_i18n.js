import fs from "fs";
import path from "path";

const dir = process.cwd();

// Load locales
const pt = JSON.parse(fs.readFileSync(path.join(dir, "locales/pt.json"), "utf8"));
const en = JSON.parse(fs.readFileSync(path.join(dir, "locales/en.json"), "utf8"));

function flattenKeys(obj, prefix = "") {
  let keys = [];
  for (const k in obj) {
    if (k === "_meta") continue; // Ignore metadata
    const newKey = prefix ? `${prefix}.${k}` : k;
    if (typeof obj[k] === "object" && !Array.isArray(obj[k])) {
      keys = keys.concat(flattenKeys(obj[k], newKey));
    } else {
      keys.push(newKey);
    }
  }
  return keys;
}

const ptKeys = new Set(flattenKeys(pt));
const enKeys = new Set(flattenKeys(en));

// Find all t("...") usages
function scanDir(d) {
  let results = [];
  const list = fs.readdirSync(d);
  for (const file of list) {
    const f = path.join(d, file);
    if (fs.statSync(f).isDirectory()) {
      if (!f.includes("node_modules") && !f.includes(".git")) {
        results = results.concat(scanDir(f));
      }
    } else if (f.endsWith(".js") || f.endsWith(".ts")) {
      const content = fs.readFileSync(f, "utf8");
      // Match t("key") or t('key')
      const regex = /t\(\s*['"]([^'"]+)['"]/g;
      let match;
      while ((match = regex.exec(content)) !== null) {
        results.push({ key: match[1], file: path.relative(dir, f) });
      }
    }
  }
  return results;
}

const usages = scanDir(dir);

let errors = 0;

console.log("=== Checking i18n JSON Sync ===");
for (const k of ptKeys) {
  if (!enKeys.has(k)) {
    console.log(`[Missing in EN] Key exists in PT but not EN: ${k}`);
    errors++;
  }
}
for (const k of enKeys) {
  if (!ptKeys.has(k)) {
    console.log(`[Missing in PT] Key exists in EN but not PT: ${k}`);
    errors++;
  }
}

console.log("\n=== Checking Usage in Code ===");
for (const { key, file } of usages) {
  // If we dynamically reconstruct parts of the key (like `event.mediaCheck.${reasonText}`) it might not be a direct match.
  // We'll skip keys that don't look like standard full paths (often containing variables inside them directly in code)
  if (key.includes("${")) continue;

  if (!ptKeys.has(key)) {
    console.log(`[Missing Translation] Code uses key \`${key}\` in ${file}, but it is missing in JSON locales!`);
    errors++;
  }
}

if (errors === 0) {
  console.log("\\nAll i18n keys and usages are perfectly synced! :)");
} else {
  console.log(`\\nFound ${errors} issues.`);
}
