import { useState, useEffect } from "react";
import type { Store } from './storeFactory.js'
import { globalStoreFactory } from './storeFactory.js'

// Inline default config to avoid cross-file resolution issues during build
const config: Record<string, { value: any }> = {
  counter: { value: 0 },
  items: { value: [] },
  user: { value: null },
  isLoggedIn: { value: false },
  todos: { value: [] }
};

export type StoreUtils<T = any> = {
  set: (v: T) => void;
  inc?: () => void;
  dec?: () => void;
  add?: (item: any) => void;
  remove?: (i: number) => void;
  reset: () => void;
};

// Use the shared global store factory so all parts of the app (examples,
// runtime, inspector) operate on the same Store instances. When a key is
// requested that doesn't exist we create it with a default from `config`.

function makeUtils(store: Store<any>, key?: string): StoreUtils<any> {
  return {
    set: store.set,
    inc: () => {
      const cur = store.get()
      if (typeof cur === 'number') return store.set((cur as any) + 1)
      if (cur && typeof cur === 'object') {
        if (typeof (cur as any).value === 'number') return store.set({ ...cur, value: (cur as any).value + 1 })
        if (typeof (cur as any).count === 'number') return store.set({ ...cur, count: (cur as any).count + 1 })
      }
      const n = Number(cur)
      if (Number.isFinite(n)) return store.set((n + 1) as any)
      return store.set(1 as any)
    },
    dec: () => {
      const cur = store.get()
      if (typeof cur === 'number') return store.set((cur as any) - 1)
      if (cur && typeof cur === 'object') {
        if (typeof (cur as any).value === 'number') return store.set({ ...cur, value: (cur as any).value - 1 })
        if (typeof (cur as any).count === 'number') return store.set({ ...cur, count: (cur as any).count - 1 })
      }
      const n = Number(cur)
      if (Number.isFinite(n)) return store.set((n - 1) as any)
      return store.set(-1 as any)
    },
    add: (item: any) => {
      const cur = store.get()
      if (Array.isArray(cur)) return store.set([...(cur as any), item])
      if (cur && typeof cur === 'object') {
        if (Array.isArray((cur as any).items)) return store.set({ ...cur, items: [...(cur as any).items, item] })
        if (Array.isArray((cur as any).todos)) return store.set({ ...cur, todos: [...(cur as any).todos, item] })
      }
      return store.set([...(cur ? [cur] : []), item] as any)
    },
    remove: (i: number) => {
      const cur = store.get()
      if (Array.isArray(cur)) return store.set((cur as any).filter((_: any, idx: number) => idx !== i))
      if (cur && typeof cur === 'object') {
        if (Array.isArray((cur as any).items)) return store.set({ ...cur, items: (cur as any).items.filter((_: any, idx: number) => idx !== i) })
        if (Array.isArray((cur as any).todos)) return store.set({ ...cur, todos: (cur as any).todos.filter((_: any, idx: number) => idx !== i) })
      }
      return store.set(cur)
    },
    reset: () => {
      if (!key) return store.set(null)
      return store.set((config as any)[key].value)
    }
  }
}

// callable useStore: accepts a Store object returned from createStore()
function useStoreFn(storeOrKey?: any): [any, StoreUtils<any>] {
  // If a store object is passed, subscribe to it directly
  if (storeOrKey && typeof storeOrKey.get === 'function') {
    const st: Store<any> = storeOrKey
    const [val, setVal] = useState(st.get())
    useEffect(() => {
      // prefer the public subscribe API when available
      const unsub = typeof st.subscribe === 'function' ? st.subscribe((s: any) => setVal(s)) : () => { /* no-op */ }
      return () => { try { unsub(); } catch (e) { /* ignore */ } }
    }, [st])
    return [val, makeUtils(st)]
  }

  // otherwise fall back to proxy-get by key (unsupported here)
  throw new Error('useStore must be called with a store object or accessed as a property: useStore.<key>()')
}

const useStore = new Proxy(useStoreFn, {
  get: (_, key: string) => (): [any, StoreUtils<any>] => {
    // Ensure a store exists in the global factory with a sensible default
    let store = globalStoreFactory.get<any>(key as string);
    if (!store) {
      const initial = (config as any)[key as string]?.value ?? null;
      // create will return the store and wire up change listeners
      store = globalStoreFactory.create(key as string, { value: initial });
    }

    const [val, setVal] = useState(store.get());

    useEffect(() => {
      // prefer the public subscribe API
      const unsub = typeof store.subscribe === 'function' ? store.subscribe((s: any) => setVal(s)) : () => { /* no-op */ };
      return () => { try { unsub(); } catch (e) { /* ignore */ } };
    }, [key]);

    return [val, makeUtils(store, key)];
  }
});

export default useStore;

// Helper: subscribe to derived value from a store (by key)
export function useSelector(storeKey: string, selector: (s: any) => any) {
  return () => {
    const [value, setValue] = useState(() => {
      const st = globalStoreFactory.get<any>(storeKey);
      return st ? selector(st.get()) : undefined;
    });

    useEffect(() => {
      const st = globalStoreFactory.get<any>(storeKey);
      if (!st || typeof st.subscribe !== 'function') return;
      const unsub = st.subscribe((s: any) => setValue(selector(s)));
      return () => { try { unsub(); } catch (e) { /* ignore */ } };
    }, [storeKey]);

    return value;
  };
}
