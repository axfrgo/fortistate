import { createStore, getStore } from './storeFactory.js'
import { useState, useEffect } from 'react'

// atom: create a simple store with a key and initial value
export function atom<T>(key: string, initial: T) {
  return createStore<T>(key, { value: initial });
}

// derived: create a read-only derived value from one or more stores
// Accepts sync or async compute functions. Recomputes when any dependency updates.
export function derived<T>(key: string, deps: string[], compute: (...values: any[]) => T | Promise<T>) {
  const getter = () => deps.map(d => getStore(d)?.get());
  const initVals = getter();
  const init = (compute as any)(...initVals) as T | Promise<T>;
  const st = createStore<T>(key, { value: init as any } as any);

  async function recompute() {
    try {
      const vals = getter();
      const maybe = (compute as any)(...vals);
      if (maybe && typeof (maybe as any).then === 'function') {
        const next = await maybe
        st.set(next as T)
      } else {
        st.set(maybe as T)
      }
    } catch (e) {
      // swallow compute errors for now
    }
  }

  for (const d of deps) {
    const dep = getStore(d);
    if (!dep) continue;
    dep.subscribe(() => void recompute());
  }

  // initial async resolution
  if (init instanceof Promise) {
    init.then((v) => st.set(v as T)).catch(() => {/* ignore */})
  }

  return st;
}

// action: helper to produce actions that can update stores
export function action<R extends any[]>(fn: (...args: R) => void) {
  return (...args: R) => fn(...args);
}

// persist: simple localStorage persistence for a store (key must be serializable)
export function persist(storeKey: string, storageKey?: string) {
  const st = getStore<any>(storeKey);
  if (!st) return () => {};
  const sk = storageKey || `fortistate:${storeKey}`;
  try {
    const raw = (typeof localStorage !== 'undefined') ? localStorage.getItem(sk) : null;
    if (raw) {
      try { st.set(JSON.parse(raw)); } catch (e) { /* ignore parse */ }
    }
  } catch (e) { /* localStorage may be unavailable */ }

  const unsub = st.subscribe((v) => {
    try { if (typeof localStorage !== 'undefined') localStorage.setItem(sk, JSON.stringify(v)); } catch (e) { /* ignore */ }
  });

  return unsub;
}

// React hook for atoms: returns [value, utils]
export function useAtom<T>(key: string) {
  const st = getStore<T>(key);
  const [val, setVal] = useState<T | undefined>(() => st?.get());

  useEffect(() => {
    if (!st) return;
    const sub = (v: T) => setVal(v);
    st.subscribe(sub);
    return () => { st.subscribe(() => {}) && undefined };
  }, [key]);

  const utils = {
    set: (v: T) => st && st.set(v),
    reset: () => st && st.reset(),
  } as const;

  return [val, utils] as const;
}

export default { atom, derived, action, persist, useAtom }
