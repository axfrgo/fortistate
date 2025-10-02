import path from 'path'
import { pathToFileURL } from 'url'
import { createStore, globalStoreFactory } from './storeFactory.js'
import resolveConfig, { _loadModule } from './config.js'
import { registerStore as pluginRegisterStore, clearRegistered as clearRegisteredPlugins } from './plugins.js'
import type { PluginFn } from './types.js'

function registerViaApi(key: string, init: any) {
  try {
    const existed = globalStoreFactory.has(key)
    const store = createStore(key, { value: init })
    if (store && existed) store.set(init)
    pluginRegisterStore(key, init)
  } catch (e) {
    // ignore individual plugin registration errors
  }
}

export async function loadPlugins(cwd = process.cwd()) {
  const resolved = resolveConfig(cwd)
  let cfg: any = null
  if (resolved.path) {
    try {
      cfg = await _loadModule(resolved.path, { bustCache: true })
    } catch (e) {
      if (resolved.config) cfg = resolved.config
      else {
        // could not load asynchronously
        // eslint-disable-next-line no-console
        console.warn('Could not async-load config from', resolved.path, (e && typeof e === 'object' && 'message' in e) ? (e as any).message : String(e))
        clearRegisteredPlugins()
        return { loaded: 0, configPath: resolved.path }
      }
    }
  } else if (resolved.config) {
    cfg = resolved.config
  }
  if (!cfg) {
    clearRegisteredPlugins()
    return { loaded: 0, configPath: resolved.path }
  }
  clearRegisteredPlugins()
  let count = 0

  // resolve presets first (they may return additional config)
  const presets = cfg.presets || []
  for (const preset of presets) {
    try {
      let presetCfg: any
      if (typeof preset === 'function') {
        presetCfg = await preset()
      } else {
        const pPath = path.isAbsolute(preset as string) ? preset as string : path.resolve(cwd, preset as string)
        let url = pathToFileURL(pPath).href
        url += (url.includes('?') ? '&' : '?') + 't=' + Date.now()
        let mod: any
        try {
          mod = await import(url).then(m => (m.default ?? m))
        } catch (eImport) {
          try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const { createRequire } = await import('module')
            const req = createRequire(import.meta.url)
            try {
              const resolvedReq = req.resolve(pPath)
              if ((req as any).cache) delete (req as any).cache[resolvedReq]
              if (typeof require !== 'undefined' && require.cache && require.cache[resolvedReq]) delete require.cache[resolvedReq]
            } catch (eResolve) { /* ignore */ }
            mod = req(pPath)
          } catch (eReq) {
            throw eImport
          }
        }
        presetCfg = typeof mod === 'function' ? await mod() : mod
      }
      if (presetCfg?.plugins) cfg.plugins = [...(cfg.plugins || []), ...presetCfg.plugins]
    } catch (err) {
      // ignore single preset failure
      // eslint-disable-next-line no-console
      console.warn('Could not load preset', preset, (err && typeof err === 'object' && 'message' in err) ? (err as any).message : String(err))
    }
  }

  const plugins = cfg.plugins || []
  for (const p of plugins) {
    try {
      if (typeof p === 'function') {
        await Promise.resolve((p as Function)({ registerStore: (key: string, init: any) => registerViaApi(key, init) }))
        count++
        continue
      }

      const pPath = path.isAbsolute(p as string) ? p as string : path.resolve(cwd, p as string)
  let url = pathToFileURL(pPath).href
  url += (url.includes('?') ? '&' : '?') + 't=' + Date.now()
      let mod: any
      try {
        mod = await import(url).then(m => (m.default ?? m))
      } catch (eImport) {
        // fallback to require for CommonJS plugins
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { createRequire } = await import('module')
        const req = createRequire(import.meta.url)
        try {
          const resolvedReq = req.resolve(pPath)
          if ((req as any).cache) delete (req as any).cache[resolvedReq]
          if (typeof require !== 'undefined' && require.cache && require.cache[resolvedReq]) delete require.cache[resolvedReq]
        } catch (eResolve) { /* ignore */ }
        mod = req(pPath)
      }
      const fn: PluginFn = typeof mod === 'function' ? mod : (mod && mod.plugin) || null
      if (!fn) continue
      await Promise.resolve(fn({ registerStore: (key: string, init: any) => registerViaApi(key, init) }))
      count++
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('Could not load plugin', p, (err && typeof err === 'object' && 'message' in err) ? (err as any).message : String(err))
    }
  }

  return { loaded: count, configPath: resolved.path, config: cfg }
}

export default loadPlugins
