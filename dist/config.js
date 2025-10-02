// Minimal config loader for fortistate
import { statSync } from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
export async function _loadModule(p, options = {}) {
    var _a;
    let url = pathToFileURL(p).href;
    if (options.bustCache) {
        url += (url.includes('?') ? '&' : '?') + 't=' + Date.now();
    }
    try {
        const mod = await import(url);
        return (_a = mod === null || mod === void 0 ? void 0 : mod.default) !== null && _a !== void 0 ? _a : mod;
    }
    catch (e) {
        // fallback to require for CommonJS files
        try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const { createRequire } = await import('module');
            const req = createRequire(import.meta.url);
            if (options.bustCache) {
                try {
                    const resolved = req.resolve(p);
                    if (req.cache)
                        delete req.cache[resolved];
                    if (typeof require !== 'undefined' && require.cache && require.cache[resolved])
                        delete require.cache[resolved];
                }
                catch (eResolve) { /* ignore */ }
            }
            // require may throw if file isn't CJS
            return req(p);
        }
        catch (e2) {
            throw e;
        }
    }
}
export function resolveConfig(cwd = process.cwd()) {
    var _a;
    const names = ['fortistate.config.js', 'fortistate.config.mjs', 'fortistate.config.cjs'];
    for (const name of names) {
        const p = path.resolve(cwd, name);
        try {
            if (statSync(p)) {
                // try to load synchronously if possible via require (for CJS), otherwise leave to async loader
                try {
                    // eslint-disable-next-line @typescript-eslint/no-var-requires
                    const mod = require(p);
                    return { path: p, config: (_a = mod === null || mod === void 0 ? void 0 : mod.default) !== null && _a !== void 0 ? _a : mod };
                }
                catch (e) {
                    // cannot require here (probably ESM runtime), return a stub indicating path only
                    return { path: p };
                }
            }
        }
        catch (e) {
            // ignore
        }
    }
    return {};
}
export default resolveConfig;
