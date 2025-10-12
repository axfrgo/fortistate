import path from 'path';
import { createStore, globalStoreFactory } from './storeFactory.js';
import resolveConfig, { _loadModule } from './config.js';
import { registerStore as pluginRegisterStore, clearRegistered as clearRegisteredPlugins } from './plugins.js';
function registerViaApi(key, init) {
    try {
        const existed = globalStoreFactory.has(key);
        const store = createStore(key, { value: init });
        if (store && existed)
            store.set(init);
        pluginRegisterStore(key, init);
    }
    catch (e) {
        // ignore individual plugin registration errors
    }
}
export async function loadPlugins(cwd = process.cwd()) {
    const resolved = resolveConfig(cwd);
    let cfg = null;
    if (resolved.path) {
        try {
            cfg = await _loadModule(resolved.path, { bustCache: true });
        }
        catch (e) {
            if (resolved.config)
                cfg = resolved.config;
            else {
                // could not load asynchronously
                // eslint-disable-next-line no-console
                console.warn('Could not async-load config from', resolved.path, (e && typeof e === 'object' && 'message' in e) ? e.message : String(e));
                clearRegisteredPlugins();
                return { loaded: 0, configPath: resolved.path };
            }
        }
    }
    else if (resolved.config) {
        cfg = resolved.config;
    }
    if (!cfg) {
        clearRegisteredPlugins();
        return { loaded: 0, configPath: resolved.path };
    }
    clearRegisteredPlugins();
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
                const mod = await _loadModule(pPath, { bustCache: true });
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
                await Promise.resolve(p({ registerStore: (key, init) => registerViaApi(key, init) }));
                count++;
                continue;
            }
            const pPath = path.isAbsolute(p) ? p : path.resolve(cwd, p);
            const mod = await _loadModule(pPath, { bustCache: true });
            const fn = typeof mod === 'function' ? mod : (mod && mod.plugin) || null;
            if (!fn)
                continue;
            await Promise.resolve(fn({ registerStore: (key, init) => registerViaApi(key, init) }));
            count++;
        }
        catch (err) {
            // eslint-disable-next-line no-console
            console.warn('Could not load plugin', p, (err && typeof err === 'object' && 'message' in err) ? err.message : String(err));
        }
    }
    return { loaded: count, configPath: resolved.path, config: cfg };
}
export default loadPlugins;
