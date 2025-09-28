"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var state_config_1 = require("./state.config");
var stores = {};
var useStore = new Proxy({}, {
    get: function (_, key) { return function () {
        var _a, _b;
        if (!stores[key]) {
            var initial = (_b = (_a = state_config_1.default[key]) === null || _a === void 0 ? void 0 : _a.value) !== null && _b !== void 0 ? _b : null;
            var state_1 = initial;
            var subs_1 = new Set();
            var set = function (val) {
                state_1 = val;
                subs_1.forEach(function (fn) { return fn(state_1); });
            };
            stores[key] = { get: function () { return state_1; }, set: set, subs: subs_1 };
        }
        var store = stores[key];
        var _c = (0, react_1.useState)(store.get()), val = _c[0], setVal = _c[1];
        (0, react_1.useEffect)(function () {
            var sub = function (s) { return setVal(s); };
            store.subs.add(sub);
            return function () { return store.subs.delete(sub); };
        }, [key]);
        var utils = {
            set: store.set,
            inc: function () { return store.set((val !== null && val !== void 0 ? val : 0) + 1); },
            dec: function () { return store.set((val !== null && val !== void 0 ? val : 0) - 1); },
            add: function (item) { return store.set(__spreadArray(__spreadArray([], (val !== null && val !== void 0 ? val : []), true), [item], false)); },
            remove: function (i) { return store.set((val !== null && val !== void 0 ? val : []).filter(function (_, idx) { return idx !== i; })); },
            reset: function () { return store.set(state_config_1.default[key].value); },
        };
        return [val, utils];
    }; }
});
exports.default = useStore;
