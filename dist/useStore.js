import { useState, useEffect } from "react";
// Inline default config to avoid cross-file resolution issues during build
const config = {
    counter: { value: 0 },
    items: { value: [] },
    user: { value: null },
    isLoggedIn: { value: false },
    todos: { value: [] }
};
const stores = {};
// useStore.<key>() returns [state, utils]
const useStore = new Proxy({}, {
    get: (_, key) => () => {
        var _a, _b;
        if (!stores[key]) {
            const initial = (_b = (_a = config[key]) === null || _a === void 0 ? void 0 : _a.value) !== null && _b !== void 0 ? _b : null;
            let state = initial;
            const subs = new Set();
            const set = (val) => {
                state = val;
                subs.forEach(fn => fn(state));
            };
            stores[key] = { get: () => state, set, subs };
        }
        const store = stores[key];
        const [val, setVal] = useState(store.get());
        useEffect(() => {
            const sub = (s) => setVal(s);
            if (store.subs)
                store.subs.add(sub);
            return () => { if (store.subs)
                store.subs.delete(sub); };
        }, [key]);
        const utils = {
            set: store.set,
            inc: () => store.set((val !== null && val !== void 0 ? val : 0) + 1),
            dec: () => store.set((val !== null && val !== void 0 ? val : 0) - 1),
            add: (item) => store.set([...(val !== null && val !== void 0 ? val : []), item]),
            remove: (i) => store.set((val !== null && val !== void 0 ? val : []).filter((_, idx) => idx !== i)),
            reset: () => store.set(config[key].value),
        };
        return [val, utils];
    }
});
export default useStore;
// Helper: subscribe to derived value from a store
export function useSelector(storeKey, selector) {
    // return a hook that follows same pattern as useStore
    return () => {
        const [value, setValue] = useState(() => {
            const st = stores[storeKey];
            return st ? selector(st.get()) : undefined;
        });
        useEffect(() => {
            const st = stores[storeKey];
            if (!st || !st.subs)
                return;
            const sub = (s) => setValue(selector(s));
            st.subs.add(sub);
            return () => { if (st.subs)
                st.subs.delete(sub); };
        }, [storeKey]);
        return value;
    };
}
