export type FortistateConfig = {
    presets?: Array<any>;
    plugins?: Array<any>;
    [k: string]: any;
};
export declare function _loadModule(p: string): Promise<any>;
export declare function resolveConfig(cwd?: string): {
    path?: string;
    config?: FortistateConfig;
};
export default resolveConfig;
