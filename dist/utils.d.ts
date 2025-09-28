export declare function atom<T>(key: string, initial: T): import("./storeFactory.js").Store<T>;
export declare function derived<T>(key: string, deps: string[], compute: (...values: any[]) => T | Promise<T>): import("./storeFactory.js").Store<T>;
export declare function action<R extends any[]>(fn: (...args: R) => void): (...args: R) => void;
export declare function persist(storeKey: string, storageKey?: string): () => void;
export declare function useAtom<T>(key: string): readonly [T | undefined, {
    readonly set: (v: T) => void | undefined;
    readonly reset: () => void | undefined;
}];
declare const _default: {
    atom: typeof atom;
    derived: typeof derived;
    action: typeof action;
    persist: typeof persist;
    useAtom: typeof useAtom;
};
export default _default;
