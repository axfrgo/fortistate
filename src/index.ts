export { StoreFactory, globalStoreFactory, createStore, getStore, wrapWithLogging } from "./storeFactory.js";
export { default as useStore } from "./useStore.js";
export { useSelector } from "./useStore.js";
export { loadPlugins } from './loader.js'
export { getRegistered, registerStore } from './plugins.js'
export { atom, derived, action, persist, useAtom } from './utils.js'

// presets and state utilities
export * from './presets.js'
export * from './stateUtils.js'

// temporal & cosmogenesis (v2.0+)
export * from './temporal/causalEvent.js'
export * from './temporal/causalStore.js'
export * from './algebra/entropy.js'
export * from './algebra/substrate.js'
export * from './cosmogenesis/laws.js'
export * from './cosmogenesis/auditor.js'
export * from './cosmogenesis/telemetry.js'
export * from './cosmogenesis/universe.js'
export * from './cosmogenesis/emergence.js'

// inspector (Phase 2: Multiversal Inspector)
export * from './inspector/timeline.js'
export * from './inspector/causalMap.js'
export * from './inspector/branchMerge.js'
export * from './inspector/narrator.js'

export type { FortistateConfig } from './config.js'
export type { PluginFn, PluginApi } from './types.js'
export type { Store } from './storeFactory.js'
export type { StoreUtils } from './useStore.js'
export { registerSchema } from './schema.js'

// Additional utilities could be added here in future (selectors, middleware, persistence helpers)

