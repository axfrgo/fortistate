/**
 * FortiState Inspector Client Integration
 * Automatically registers all local stores with the Inspector server
 */

import { globalStoreFactory } from '../../../../src/storeFactory'

const INSPECTOR_URL = import.meta.env.VITE_INSPECTOR_URL || 'http://localhost:4000'
const INSPECTOR_ENABLED = import.meta.env.VITE_INSPECTOR_ENABLED !== 'false'

let registered = false
const registeredKeys = new Set<string>()

/**
 * Register a store with the remote inspector
 */
async function registerStore(key: string, initial: any) {
  if (registeredKeys.has(key)) return
  
  try {
    const response = await fetch(`${INSPECTOR_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, initial }),
    })
    
    if (response.ok) {
      registeredKeys.add(key)
      console.debug(`[Inspector] Registered store: ${key}`)
    }
  } catch (err) {
    console.debug(`[Inspector] Failed to register ${key}:`, err)
  }
}

/**
 * Notify inspector of store changes
 */
async function notifyChange(key: string, value: any) {
  if (!registeredKeys.has(key)) return
  
  try {
    await fetch(`${INSPECTOR_URL}/change`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value }),
    })
  } catch (err) {
    // Silently ignore - inspector might be offline
  }
}

/**
 * Initialize inspector integration
 * Registers all existing stores and subscribes to future changes
 */
export function initInspector() {
  if (!INSPECTOR_ENABLED || registered) return
  
  console.log('[Inspector] Initializing client integration...')
  registered = true
  
  // Register all existing stores
  const allKeys = globalStoreFactory.keys()
  for (const key of allKeys) {
    try {
      const store = globalStoreFactory.get(key)
      if (!store) continue
      
      const currentValue = store.get()
      registerStore(key, currentValue)
      
      // Subscribe to changes
      store.subscribe((newValue: any) => {
        notifyChange(key, newValue)
      })
    } catch (err) {
      console.warn(`[Inspector] Failed to register store ${key}:`, err)
    }
  }
  
  console.log(`[Inspector] Registered ${allKeys.length} stores`)
  console.log(`[Inspector] View at ${INSPECTOR_URL}`)
}
