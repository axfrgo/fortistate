export type JitServerOptions = {
    port?: number;
    quiet?: boolean;
};
export declare function createJitServer(opts?: JitServerOptions): {
    start: () => Promise<void>;
    stop: () => Promise<void>;
};
export default createJitServer;
