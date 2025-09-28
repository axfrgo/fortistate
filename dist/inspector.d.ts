export declare function createInspectorServer(opts?: {
    port?: number;
    quiet?: boolean;
    token?: string;
    allowOrigin?: string;
    allowOriginStrict?: boolean;
}): {
    start: () => Promise<void>;
    stop: () => Promise<void>;
};
export default createInspectorServer;
