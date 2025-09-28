import { useState, useEffect } from "react";
import type { Store } from './storeFactory.js'

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

const stores: Record<string, Store<any>> = {};

// useStore.<key>() returns [state, utils]
const useStore: any = new Proxy({}, {
  get: (_, key: string) => (): [any, StoreUtils<any>] => {
    if (!stores[key]) {
      const initial = (config as any)[key]?.value ?? null;
      let state = initial;
      const subs = new Set<(val: any) => void>();

      const set = (val: any) => {
        state = val;
        subs.forEach(fn => fn(state));
      };

      stores[key] = { get: () => state, set, subs } as Store<any>;
    }

    const store = stores[key];
    const [val, setVal] = useState(store.get());

    useEffect(() => {
      const sub = (s: any) => setVal(s);
      if (store.subs) store.subs.add(sub);
      return () => { if (store.subs) store.subs.delete(sub); };
    }, [key]);

    const utils: StoreUtils = {
      set: store.set,
      inc: () => store.set((val ?? 0) + 1),
      dec: () => store.set((val ?? 0) - 1),
      add: (item: any) => store.set([...(val ?? []), item]),
      remove: (i: number) => store.set((val ?? []).filter((_: any, idx: number) => idx !== i)),
      reset: () => store.set((config as any)[key].value),
    };

    return [val, utils];
  }
});

export default useStore;

// Helper: subscribe to derived value from a store
export function useSelector(storeKey: string, selector: (s: any) => any) {
  // return a hook that follows same pattern as useStore
  return () => {
    const [value, setValue] = useState(() => {
      const st = (stores as any)[storeKey];
      return st ? selector(st.get()) : undefined;
    });

    useEffect(() => {
  const st = (stores as any)[storeKey];
  if (!st || !st.subs) return;
  const sub = (s: any) => setValue(selector(s));
  st.subs.add(sub);
  return () => { if (st.subs) st.subs.delete(sub); };
    }, [storeKey]);

    return value;
  };
}
