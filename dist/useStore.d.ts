export type StoreUtils<T = any> = {
    set: (v: T) => void;
    inc?: () => void;
    dec?: () => void;
    add?: (item: any) => void;
    remove?: (i: number) => void;
    reset: () => void;
};
declare const useStore: any;
export default useStore;
export declare function useSelector(storeKey: string, selector: (s: any) => any): () => any;
