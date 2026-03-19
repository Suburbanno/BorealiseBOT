import { fileURLToPath, pathToFileURL } from "url";
import path from "path";
import { listJsFilesRecursive } from "../helpers/fs.js";
export class EventRegistry {
    constructor() {
        this._handlers = new Map();
        this._enabled = new Map();
        this._cooldowns = new Map();
    }
    reset() {
        this._handlers.clear();
        this._enabled.clear();
        this._cooldowns.clear();
    }
    register(def) {
        if (!def?.name || typeof def.handle !== "function") {
            throw new Error(`[EventRegistry] Invalid handler: must have "name" and "handle".`);
        }
        const events = Array.isArray(def.events)
            ?def.events
            : def.event != null
                ?[def.event]
                : [];
        if (events.length === 0) {
            throw new Error(`[EventRegistry] Handler "${def.name}" must specify "event" or "events".`);
        }
        const key = def.name.toLowerCase();
        if (this._handlers.has(key)) {
            console.warn(`[EventRegistry] Overwriting existing handler: ${key}`);
        }
        this._handlers.set(key, { ...def, _events: events });
    }
    async loadDir(dirUrl) {
        const summary = { loaded: 0, failed: 0, errors: [] };
        const dirPath = fileURLToPath(dirUrl);
        const selfPath = fileURLToPath(import.meta.url);
        let files;
        try {
            files = listJsFilesRecursive(dirPath, new Set([selfPath]));
        }
        catch (err) {
            summary.failed++;
            summary.errors.push({ file: dirPath, error: err.message });
            return summary;
        }
        files.sort();
        for (const file of files) {
            const rel = path.relative(dirPath, file);
            let exported;
            try {
                const mod = await import(pathToFileURL(file).href);
                exported = mod.default ?? mod;
            }
            catch (err) {
                summary.failed++;
                summary.errors.push({ file: rel, error: err.message });
                continue;
            }
            const defs = Array.isArray(exported) ?exported : [exported];
            for (const def of defs) {
                try {
                    this.register(def);
                    summary.loaded++;
                }
                catch (err) {
                    summary.failed++;
                    summary.errors.push({ file: rel, error: err.message });
                }
            }
        }
        return summary;
    }
    enable(name) {
        this._enabled.set(name.toLowerCase(), true);
    }
    disable(name) {
        this._enabled.set(name.toLowerCase(), false);
    }
    isEnabled(name) {
        const key = name.toLowerCase();
        if (this._enabled.has(key))
            return this._enabled.get(key);
        return this._handlers.get(key)?.enabled !== false;
    }
    getHandler(name) {
        return this._handlers.get(name.toLowerCase()) ?? null;
    }
    getRequiredEvents() {
        const events = new Set();
        for (const def of this._handlers.values()) {
            if (this.isEnabled(def.name)) {
                def._events.forEach((e) => events.add(e));
            }
        }
        return [...events];
    }
    get all() {
        return [...this._handlers.values()];
    }
    async dispatch(pipelineEvent, ctx, data) {
        for (const def of this._handlers.values()) {
            if (!def._events.includes(pipelineEvent))
                continue;
            if (!this.isEnabled(def.name))
                continue;
            const cooldownMs = typeof def.cooldown === "function"
                ?def.cooldown(ctx, data)
                : (def.cooldown ?? 0);
            if (cooldownMs > 0) {
                const scope = def.cooldownScope ?? "global";
                const subject = scope === "user"
                    ?String(data?.userId ?? data?.user_id ?? data?.id ?? "global")
                    : "global";
                const ck = `${subject}:${def.name}`;
                const last = this._cooldowns.get(ck) ?? 0;
                if (Date.now() - last < cooldownMs)
                    continue;
                this._cooldowns.set(ck, Date.now());
            }
            try {
                await def.handle(ctx, data);
            }
            catch (err) {
                console.error(`[EventRegistry] Error in "${def.name}" handler: ${err.message}`);
            }
        }
    }
}
