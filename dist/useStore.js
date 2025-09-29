import { useState, useEffect } from "react";
import { globalStoreFactory } from './storeFactory.js';
// Inline default config to avoid cross-file resolution issues during build
const config = {
    counter: { value: 0 },
    items: { value: [] },
    user: { value: null },
    isLoggedIn: { value: false },
    todos: { value: [] }
};
// Use the shared global store factory so all parts of the app (examples,
// runtime, inspector) operate on the same Store instances. When a key is
// requested that doesn't exist we create it with a default from `config`.
function makeUtils(store, key) {
    return {
        set: store.set,
        inc: () => {
            const cur = store.get();
            if (typeof cur === 'number')
                return store.set(cur + 1);
            if (cur && typeof cur === 'object') {
                if (typeof cur.value === 'number')
                    return store.set({ ...cur, value: cur.value + 1 });
                if (typeof cur.count === 'number')
                    return store.set({ ...cur, count: cur.count + 1 });
            }
            const n = Number(cur);
            if (Number.isFinite(n))
                return store.set((n + 1));
            return store.set(1);
        },
        dec: () => {
            const cur = store.get();
            if (typeof cur === 'number')
                return store.set(cur - 1);
            if (cur && typeof cur === 'object') {
                if (typeof cur.value === 'number')
                    return store.set({ ...cur, value: cur.value - 1 });
                if (typeof cur.count === 'number')
                    return store.set({ ...cur, count: cur.count - 1 });
            }
            const n = Number(cur);
            if (Number.isFinite(n))
                return store.set((n - 1));
            return store.set(-1);
        },
        add: (item) => {
            const cur = store.get();
            if (Array.isArray(cur))
                return store.set([...cur, item]);
            if (cur && typeof cur === 'object') {
                if (Array.isArray(cur.items))
                    return store.set({ ...cur, items: [...cur.items, item] });
                if (Array.isArray(cur.todos))
                    return store.set({ ...cur, todos: [...cur.todos, item] });
            }
            return store.set([...(cur ? [cur] : []), item]);
        },
        remove: (i) => {
            const cur = store.get();
            if (Array.isArray(cur))
                return store.set(cur.filter((_, idx) => idx !== i));
            if (cur && typeof cur === 'object') {
                if (Array.isArray(cur.items))
                    return store.set({ ...cur, items: cur.items.filter((_, idx) => idx !== i) });
                if (Array.isArray(cur.todos))
                    return store.set({ ...cur, todos: cur.todos.filter((_, idx) => idx !== i) });
            }
            return store.set(cur);
        },
        reset: () => {
            if (!key)
                return store.set(null);
            return store.set(config[key].value);
        }
    };
}
// callable useStore: accepts a Store object returned from createStore()
function useStoreFn(storeOrKey) {
    // If a store object is passed, subscribe to it directly
    if (storeOrKey && typeof storeOrKey.get === 'function') {
        const st = storeOrKey;
        const [val, setVal] = useState(st.get());
        useEffect(() => {
            // prefer the public subscribe API when available
            const unsub = typeof st.subscribe === 'function' ? st.subscribe((s) => setVal(s)) : () => { };
            return () => { try {
                unsub();
            }
            catch (e) { /* ignore */ } };
        }, [st]);
        return [val, makeUtils(st)];
    }
    // otherwise fall back to proxy-get by key (unsupported here)
    throw new Error('useStore must be called with a store object or accessed as a property: useStore.<key>()');
}
const useStore = new Proxy(useStoreFn, {
    get: (_, key) => () => {
        var _a, _b;
        // Ensure a store exists in the global factory with a sensible default
        let store = globalStoreFactory.get(key);
        if (!store) {
            const initial = (_b = (_a = config[key]) === null || _a === void 0 ? void 0 : _a.value) !== null && _b !== void 0 ? _b : null;
            // create will return the store and wire up change listeners
            store = globalStoreFactory.create(key, { value: initial });
        }
        const [val, setVal] = useState(store.get());
        useEffect(() => {
            // prefer the public subscribe API
            const unsub = typeof store.subscribe === 'function' ? store.subscribe((s) => setVal(s)) : () => { };
            return () => { try {
                unsub();
            }
            catch (e) { /* ignore */ } };
        }, [key]);
        return [val, makeUtils(store, key)];
    }
});
export default useStore;
// Helper: subscribe to derived value from a store (by key)
export function useSelector(storeKey, selector) {
    return () => {
        const [value, setValue] = useState(() => {
            const st = globalStoreFactory.get(storeKey);
            return st ? selector(st.get()) : undefined;
        });
        useEffect(() => {
            const st = globalStoreFactory.get(storeKey);
            if (!st || typeof st.subscribe !== 'function')
                return;
            const unsub = st.subscribe((s) => setValue(selector(s)));
            return () => { try {
                unsub();
            }
            catch (e) { /* ignore */ } };
        }, [storeKey]);
        return value;
    };
}
