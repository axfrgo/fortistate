import { createStore, getStore } from './storeFactory.js';
import { useState, useEffect } from 'react';
// atom: create a simple store with a key and initial value
export function atom(key, initial) {
    return createStore(key, { value: initial });
}
// derived: create a read-only derived value from one or more stores
// Accepts sync or async compute functions. Recomputes when any dependency updates.
export function derived(key, deps, compute) {
    const getter = () => deps.map(d => { var _a; return (_a = getStore(d)) === null || _a === void 0 ? void 0 : _a.get(); });
    const initVals = getter();
    const init = compute(...initVals);
    const st = createStore(key, { value: init });
    async function recompute() {
        try {
            const vals = getter();
            const maybe = compute(...vals);
            if (maybe && typeof maybe.then === 'function') {
                const next = await maybe;
                st.set(next);
            }
            else {
                st.set(maybe);
            }
        }
        catch (e) {
            // swallow compute errors for now
        }
    }
    for (const d of deps) {
        const dep = getStore(d);
        if (!dep)
            continue;
        dep.subscribe(() => void recompute());
    }
    // initial async resolution
    if (init instanceof Promise) {
        init.then((v) => st.set(v)).catch(() => { });
    }
    return st;
}
// action: helper to produce actions that can update stores
export function action(fn) {
    return (...args) => fn(...args);
}
// persist: simple localStorage persistence for a store (key must be serializable)
export function persist(storeKey, storageKey) {
    const st = getStore(storeKey);
    if (!st)
        return () => { };
    const sk = storageKey || `fortistate:${storeKey}`;
    try {
        const raw = (typeof localStorage !== 'undefined') ? localStorage.getItem(sk) : null;
        if (raw) {
            try {
                st.set(JSON.parse(raw));
            }
            catch (e) { /* ignore parse */ }
        }
    }
    catch (e) { /* localStorage may be unavailable */ }
    const unsub = st.subscribe((v) => {
        try {
            if (typeof localStorage !== 'undefined')
                localStorage.setItem(sk, JSON.stringify(v));
        }
        catch (e) { /* ignore */ }
    });
    return unsub;
}
// React hook for atoms: returns [value, utils]
export function useAtom(key) {
    const st = getStore(key);
    const [val, setVal] = useState(() => st === null || st === void 0 ? void 0 : st.get());
    useEffect(() => {
        if (!st)
            return;
        const sub = (v) => setVal(v);
        st.subscribe(sub);
        return () => { st.subscribe(() => { }) && undefined; };
    }, [key]);
    const utils = {
        set: (v) => st && st.set(v),
        reset: () => st && st.reset(),
    };
    return [val, utils];
}
export default { atom, derived, action, persist, useAtom };
