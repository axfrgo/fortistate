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
        const api = {
            get: () => state,
            set: (v) => {
                state = v;
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
