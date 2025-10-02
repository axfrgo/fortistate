// Minimal config loader for fortistate
import { statSync } from 'fs'
import path from 'path'
import { pathToFileURL } from 'url'

export type FortistateConfig = {
  presets?: Array<any>
  plugins?: Array<any>
  [k: string]: any
}

export async function _loadModule(p: string, options: { bustCache?: boolean } = {}) {
  let url = pathToFileURL(p).href
  if (options.bustCache) {
    url += (url.includes('?') ? '&' : '?') + 't=' + Date.now()
  }
  try {
    const mod = await import(url)
    return mod?.default ?? mod
  } catch (e) {
    // fallback to require for CommonJS files
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { createRequire } = await import('module')
      const req = createRequire(import.meta.url)
      if (options.bustCache) {
        try {
          const resolved = req.resolve(p)
          if ((req as unknown as { cache?: Record<string, unknown> }).cache) delete (req as any).cache[resolved]
          if (typeof require !== 'undefined' && require.cache && require.cache[resolved]) delete require.cache[resolved]
        } catch (eResolve) { /* ignore */ }
      }
      // require may throw if file isn't CJS
      return req(p)
    } catch (e2) {
      throw e
    }
  }
}

export function resolveConfig(cwd = process.cwd()): { path?: string; config?: FortistateConfig } {
  const names = ['fortistate.config.js', 'fortistate.config.mjs', 'fortistate.config.cjs']
  for (const name of names) {
    const p = path.resolve(cwd, name)
    try {
      if (statSync(p)) {
        // try to load synchronously if possible via require (for CJS), otherwise leave to async loader
        try {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const mod = require(p)
          return { path: p, config: mod?.default ?? mod }
        } catch (e) {
          // cannot require here (probably ESM runtime), return a stub indicating path only
          return { path: p }
        }
      }
    } catch (e) {
      // ignore
    }
  }
  return { }
}

export default resolveConfig
