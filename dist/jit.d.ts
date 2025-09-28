export type JitOptions = {
    port?: number;
    root?: string;
};
export declare function createJitServer(opts?: JitOptions): {
    start: () => Promise<void>;
    stop: () => Promise<void>;
};
export default createJitServer;
