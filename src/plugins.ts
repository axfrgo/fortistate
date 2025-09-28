// Simple plugin API skeleton

import type { PluginApi } from './types.js'

export type FortistatePlugin = (api: PluginApi) => void

// keep a canonical registry of stores registered by plugins/presets
const registered: Record<string, any> = {}

export function registerStore(key: string, init: any) {
  registered[key] = init
}

export function getRegistered() {
  return { ...registered }
}

export function clearRegistered() {
  for (const k of Object.keys(registered)) delete registered[k]
}

export default { registerStore, getRegistered, clearRegistered }
