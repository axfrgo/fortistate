export type StoreConfig<T> = {
    value: T;
};
export interface Store<T> {
    get: () => T;
    set: (v: T) => void;
    subscribe: (fn: (s: T) => void) => () => void;
    reset: () => void;
    subs?: Set<(s: T) => void>;
}
export declare class StoreFactory {
    private stores;
    private createListeners;
    private changeListeners;
    create<T>(key: string, config: StoreConfig<T>): Store<T>;
    subscribeCreate(fn: (key: string, initial: any) => void): () => boolean;
    subscribeChange(fn: (key: string, value: any) => void): () => boolean;
    get<T>(key: string): Store<T> | undefined;
    has(key: string): boolean;
    keys(): string[];
    batchSet(values: Record<string, any>): string[];
    subscribeAll(fn: (key: string, value: any) => void): () => void;
    resetAll(): void;
}
export declare const globalStoreFactory: StoreFactory;
export declare function createStore<T>(key: string, config: StoreConfig<T>): Store<T>;
export declare function getStore<T>(key: string): Store<T> | undefined;
export declare function getTypedStore<K extends keyof import('./schema.js').FortistateStores>(key: K): Store<any> | undefined;
export declare function wrapWithLogging(key: string): {
    get: () => any;
    set: (v: any) => void;
} | null;
export default globalStoreFactory;
