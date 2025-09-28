import path from 'path';
import { pathToFileURL } from 'url';
import { createStore } from './storeFactory.js';
import resolveConfig, { _loadModule } from './config.js';
import { registerStore as pluginRegisterStore } from './plugins.js';
export async function loadPlugins(cwd = process.cwd()) {
    const resolved = resolveConfig(cwd);
    let cfg = resolved.config;
    if (!cfg && resolved.path) {
        try {
            cfg = await _loadModule(resolved.path);
        }
        catch (e) {
            // could not load asynchronously
            // eslint-disable-next-line no-console
            console.warn('Could not async-load config from', resolved.path, (e && typeof e === 'object' && 'message' in e) ? e.message : String(e));
            return { loaded: 0 };
        }
    }
    if (!cfg)
        return { loaded: 0 };
    let count = 0;
    // resolve presets first (they may return additional config)
    const presets = cfg.presets || [];
    for (const preset of presets) {
        try {
            let presetCfg;
            if (typeof preset === 'function') {
                presetCfg = await preset();
            }
            else {
                const pPath = path.isAbsolute(preset) ? preset : path.resolve(cwd, preset);
                const url = pathToFileURL(pPath).href;
                let mod;
                try {
                    mod = await import(url).then(m => { var _a; return ((_a = m.default) !== null && _a !== void 0 ? _a : m); });
                }
                catch (eImport) {
                    try {
                        // eslint-disable-next-line @typescript-eslint/no-var-requires
                        const { createRequire } = await import('module');
                        const req = createRequire(import.meta.url);
                        mod = req(pPath);
                    }
                    catch (eReq) {
                        throw eImport;
                    }
                }
                presetCfg = typeof mod === 'function' ? await mod() : mod;
            }
            if (presetCfg === null || presetCfg === void 0 ? void 0 : presetCfg.plugins)
                cfg.plugins = [...(cfg.plugins || []), ...presetCfg.plugins];
        }
        catch (err) {
            // ignore single preset failure
            // eslint-disable-next-line no-console
            console.warn('Could not load preset', preset, (err && typeof err === 'object' && 'message' in err) ? err.message : String(err));
        }
    }
    const plugins = cfg.plugins || [];
    for (const p of plugins) {
        try {
            if (typeof p === 'function') {
                await Promise.resolve(p({ registerStore: (key, init) => {
                        try {
                            createStore(key, { value: init });
                            pluginRegisterStore(key, init);
                        }
                        catch (e) { /* ignore */ }
                    } }));
                count++;
                continue;
            }
            const pPath = path.isAbsolute(p) ? p : path.resolve(cwd, p);
            const url = pathToFileURL(pPath).href;
            let mod;
            try {
                mod = await import(url).then(m => { var _a; return ((_a = m.default) !== null && _a !== void 0 ? _a : m); });
            }
            catch (eImport) {
                // fallback to require for CommonJS plugins
                // eslint-disable-next-line @typescript-eslint/no-var-requires
                const { createRequire } = await import('module');
                const req = createRequire(import.meta.url);
                mod = req(pPath);
            }
            const fn = typeof mod === 'function' ? mod : (mod && mod.plugin) || null;
            if (!fn)
                continue;
            await Promise.resolve(fn({ registerStore: (key, init) => {
                    try {
                        createStore(key, { value: init });
                        pluginRegisterStore(key, init);
                    }
                    catch (e) { /* ignore */ }
                } }));
            count++;
        }
        catch (err) {
            // eslint-disable-next-line no-console
            console.warn('Could not load plugin', p, (err && typeof err === 'object' && 'message' in err) ? err.message : String(err));
        }
    }
    return { loaded: count };
}
export default loadPlugins;
