export declare function createInspectorServer(opts?: {
    port?: number;
    quiet?: boolean;
    token?: string;
    allowOrigin?: string;
    allowOriginStrict?: boolean;
    devClient?: boolean;
    host?: string;
}): {
    start: () => Promise<void>;
    stop: () => Promise<void>;
};
export default createInspectorServer;
