export class StoreFactory {
    constructor() {
        this.stores = new Map();
        // listeners for store lifecycle and updates
        this.createListeners = new Set();
        this.changeListeners = new Set();
    }
    create(key, config) {
        if (this.stores.has(key))
            return this.stores.get(key);
        let state = config.value;
        const subs = new Set();
        // Normalization helper: given the configured initial value, coerce an
        // incoming write into a canonical shape so user-written changes (from
        // inspector or elsewhere) don't accidentally change store shape.
        const normalize = (incoming, initial) => {
            // if initial is an array, ensure incoming is an array
            if (Array.isArray(initial)) {
                return Array.isArray(incoming) ? incoming : (incoming === undefined || incoming === null ? [] : [incoming]);
            }
            // if initial is an object (but not null), and incoming is a primitive,
            // wrap into { value: incoming }
            if (initial && typeof initial === 'object' && !Array.isArray(initial)) {
                if (incoming === null || incoming === undefined)
                    return initial;
                if (typeof incoming === 'object')
                    return incoming;
                return { value: incoming };
            }
            // otherwise, pass through (numbers, strings, booleans)
            return incoming;
        };
        const api = {
            get: () => state,
            set: (v) => {
                const coerced = normalize(v, config.value);
                state = coerced;
                subs.forEach(fn => fn(state));
                // notify change listeners
                for (const l of this.changeListeners)
                    l(key, state);
            },
            subscribe: (fn) => {
                subs.add(fn);
                return () => subs.delete(fn);
            },
            reset: () => api.set(config.value),
            subs,
        };
        this.stores.set(key, api);
        // notify create listeners
        for (const l of this.createListeners)
            l(key, config.value);
        return api;
    }
    // subscribe to store creation events
    subscribeCreate(fn) {
        this.createListeners.add(fn);
        return () => this.createListeners.delete(fn);
    }
    // subscribe to store change events
    subscribeChange(fn) {
        this.changeListeners.add(fn);
        return () => this.changeListeners.delete(fn);
    }
    get(key) {
        return this.stores.get(key);
    }
    has(key) {
        return this.stores.has(key);
    }
    keys() {
        return Array.from(this.stores.keys());
    }
    // Set many stores in a single batch (notify subscribers after updates)
    batchSet(values) {
        const updated = [];
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
    subscribeAll(fn) {
        const subs = [];
        for (const key of this.keys()) {
            const st = this.stores.get(key);
            if (st) {
                const sub = (v) => fn(key, v);
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
            if (st && st.reset)
                st.reset();
        }
    }
}
export const globalStoreFactory = new StoreFactory();
export function createStore(key, config) {
    return globalStoreFactory.create(key, config);
}
export function getStore(key) {
    return globalStoreFactory.get(key);
}
// Typed helper for consumers who augment `FortistateStores` via declaration merging
export function getTypedStore(key) {
    return globalStoreFactory.get(String(key));
}
// Utility: wrap a store's set/get to add logging for debugging
export function wrapWithLogging(key) {
    const st = globalStoreFactory.get(key);
    if (!st)
        return null;
    return {
        get: () => st.get(),
        set: (v) => {
            // simple log - users can replace with any logger
            // eslint-disable-next-line no-console
            console.log(`[fortistate] set ${key}:`, v);
            st.set(v);
        }
    };
}
export default globalStoreFactory;
