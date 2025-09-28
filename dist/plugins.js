// Simple plugin API skeleton
// keep a canonical registry of stores registered by plugins/presets
const registered = {};
export function registerStore(key, init) {
    registered[key] = init;
}
export function getRegistered() {
    return { ...registered };
}
export function clearRegistered() {
    for (const k of Object.keys(registered))
        delete registered[k];
}
export default { registerStore, getRegistered, clearRegistered };
