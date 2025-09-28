// Reusable types for fortistate public API
import type { FortistateConfig as _Fc } from './config.js'

export type FortistateConfig = _Fc

export type PluginApi = {
  registerStore: (key: string, init: any) => void
}

export type PluginFn = (api: PluginApi) => void | Promise<void>

export type LoadResult = { loaded: number }
