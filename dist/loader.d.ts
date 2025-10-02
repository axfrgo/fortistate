export declare function loadPlugins(cwd?: string): Promise<{
    loaded: number;
    configPath: string | undefined;
    config?: undefined;
} | {
    loaded: number;
    configPath: string | undefined;
    config: any;
}>;
export default loadPlugins;
