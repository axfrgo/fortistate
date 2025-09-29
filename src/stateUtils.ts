import { globalStoreFactory } from './storeFactory.js'

// Duplicate a store under a new key
export function duplicateStore(sourceKey: string, destKey: string) {
  const src = globalStoreFactory.get(sourceKey)
  if (!src) throw new Error('source store not found: ' + sourceKey)
  const val = src.get()
  const existing = globalStoreFactory.get(destKey)
  if (existing) existing.set(val)
  else globalStoreFactory.create(destKey, { value: val })
  return true
}

// Swap two stores' values (keys remain the same)
export function swapStores(keyA: string, keyB: string) {
  const a = globalStoreFactory.get(keyA)
  const b = globalStoreFactory.get(keyB)
  if (!a || !b) throw new Error('one or both stores not found')
  const ta = a.get()
  const tb = b.get()
  a.set(tb)
  b.set(ta)
  return true
}

// Move a store to a new key (delete original)
export function moveStore(oldKey: string, newKey: string) {
  const st = globalStoreFactory.get(oldKey)
  if (!st) throw new Error('store not found: ' + oldKey)
  const v = st.get()
  const ex = globalStoreFactory.get(newKey)
  if (ex) ex.set(v)
  else globalStoreFactory.create(newKey, { value: v })
  // best-effort delete: StoreFactory doesn't export delete; simulate by resetting to null
  try { st.set(null as any) } catch (e) { /* ignore */ }
  return true
}

export default { duplicateStore, swapStores, moveStore }
