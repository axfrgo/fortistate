// Schema registration: runtime is a no-op, but TS consumers can augment the
// `FortistateStores` interface to declare store key -> type mappings.
export function registerSchema(_) {
    // runtime noop — used for type-only registration
}
export default { registerSchema };
