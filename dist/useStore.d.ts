export type StoreUtils<T = any> = {
    set: (v: T) => void;
    inc?: () => void;
    dec?: () => void;
    add?: (item: any) => void;
    remove?: (i: number) => void;
    reset: () => void;
};
declare function useStoreFn(storeOrKey?: any): [any, StoreUtils<any>];
declare const useStore: typeof useStoreFn;
export default useStore;
export declare function useSelector(storeKey: string, selector: (s: any) => any): () => any;
