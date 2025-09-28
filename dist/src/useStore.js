import { useState, useEffect } from "react";
import config from "../state.config.js";
const stores = {};
export const useStore = new Proxy({}, {
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
            store.subs.add(sub);
            return () => store.subs.delete(sub);
        }, [key]);
        const utils = {
            set: store.set,
            inc: () => store.set(val + 1),
            dec: () => store.set(val - 1),
            add: (item) => store.set([...val, item]),
            remove: (i) => store.set(val.filter((_, idx) => idx !== i)),
            reset: () => store.set(config[key].value),
        };
        return [val, utils];
    }
});
