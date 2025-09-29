export type StoreConfig<T> = { value: T };

export interface Store<T> {
  get: () => T
  set: (v: T) => void
  subscribe: (fn: (s: T) => void) => () => void
  reset: () => void
  // internal subscriber set (not part of public API but used internally)
  subs?: Set<(s: T) => void>
}

export class StoreFactory {
  private stores = new Map<string, Store<any>>();
  // listeners for store lifecycle and updates
  private createListeners = new Set<(key: string, initial: any) => void>()
  private changeListeners = new Set<(key: string, value: any) => void>()

  create<T>(key: string, config: StoreConfig<T>): Store<T> {
    if (this.stores.has(key)) return this.stores.get(key) as Store<T>;
    let state = config.value as T;
    const subs = new Set<(s: T) => void>();

    // Normalization helper: given the configured initial value, coerce an
    // incoming write into a canonical shape so user-written changes (from
    // inspector or elsewhere) don't accidentally change store shape.
    const normalize = (incoming: any, initial: any) => {
      // if initial is an array, ensure incoming is an array
      if (Array.isArray(initial)) {
        return Array.isArray(incoming) ? incoming : (incoming === undefined || incoming === null ? [] : [incoming]);
      }

      // if initial is an object (but not null), and incoming is a primitive,
      // wrap into { value: incoming }
      if (initial && typeof initial === 'object' && !Array.isArray(initial)) {
        if (incoming === null || incoming === undefined) return initial;
        if (typeof incoming === 'object') return incoming;
        return { value: incoming };
      }

      // otherwise, pass through (numbers, strings, booleans)
      return incoming;
    };

    const api: Store<T> = {
      get: () => state,
      set: (v: T) => {
        const coerced = normalize(v, config.value as any) as T;
        state = coerced;
        subs.forEach(fn => fn(state));
        // notify change listeners
        for (const l of this.changeListeners) l(key, state)
      },
      subscribe: (fn: (s: T) => void) => {
        subs.add(fn);
        return () => subs.delete(fn);
      },
      reset: () => api.set(config.value),
      subs,
    };

    this.stores.set(key, api as Store<any>);
    // notify create listeners
    for (const l of this.createListeners) l(key, config.value)
    return api;
  }

  // subscribe to store creation events
  subscribeCreate(fn: (key: string, initial: any) => void) {
    this.createListeners.add(fn)
    return () => this.createListeners.delete(fn)
  }

  // subscribe to store change events
  subscribeChange(fn: (key: string, value: any) => void) {
    this.changeListeners.add(fn)
    return () => this.changeListeners.delete(fn)
  }

  get<T>(key: string): Store<T> | undefined {
    return this.stores.get(key) as Store<T> | undefined;
  }

  has(key: string) {
    return this.stores.has(key);
  }

  keys() {
    return Array.from(this.stores.keys());
  }

  // Set many stores in a single batch (notify subscribers after updates)
  batchSet(values: Record<string, any>) {
    const updated: string[] = [];
    for (const k of Object.keys(values)) {
      const st = this.stores.get(k);
      if (st) {
        st.set(values[k]);
        updated.push(k);
      }
    }
    return updated;
  }

  // Subscribe to all stores changes (receive key + new value)
  subscribeAll(fn: (key: string, value: any) => void) {
    const subs: Array<() => void> = [];
    for (const key of this.keys()) {
      const st = this.stores.get(key);
      if (st) {
        const sub = (v: any) => fn(key, v);
        if (st.subs) {
          st.subs.add(sub);
          subs.push(() => st.subs && st.subs.delete(sub));
        }
      }
    }
    return () => subs.forEach(u => u());
  }

  // Reset all stores to their initial configured value (if available)
  resetAll() {
    for (const key of this.keys()) {
      const st = this.stores.get(key);
      if (st && st.reset) st.reset();
    }
  }
}

export const globalStoreFactory = new StoreFactory();

export function createStore<T>(key: string, config: StoreConfig<T>) {
  return globalStoreFactory.create(key, config);
}

export function getStore<T>(key: string) {
  return globalStoreFactory.get<T>(key);
}

// Typed helper for consumers who augment `FortistateStores` via declaration merging
export function getTypedStore<K extends keyof import('./schema.js').FortistateStores>(key: K) {
  return globalStoreFactory.get<import('./schema.js').FortistateStores[K] & any>(String(key));
}

// Utility: wrap a store's set/get to add logging for debugging
export function wrapWithLogging(key: string) {
  const st = globalStoreFactory.get<any>(key);
  if (!st) return null;
  return {
    get: () => st.get(),
    set: (v: any) => {
      // simple log - users can replace with any logger
      // eslint-disable-next-line no-console
      console.log(`[fortistate] set ${key}:`, v);
      st.set(v);
    }
  };
}

export default globalStoreFactory;
