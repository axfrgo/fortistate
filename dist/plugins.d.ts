import type { PluginApi } from './types.js';
export type FortistatePlugin = (api: PluginApi) => void;
export declare function registerStore(key: string, init: any): void;
export declare function getRegistered(): {
    [x: string]: any;
};
export declare function clearRegistered(): void;
declare const _default: {
    registerStore: typeof registerStore;
    getRegistered: typeof getRegistered;
    clearRegistered: typeof clearRegistered;
};
export default _default;
