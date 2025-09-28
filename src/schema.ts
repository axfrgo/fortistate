// Schema registration: runtime is a no-op, but TS consumers can augment the
// `FortistateStores` interface to declare store key -> type mappings.
export function registerSchema(_: any) {
  // runtime noop — used for type-only registration
}

// Consumers can add declaration merging like:
// declare module 'fortistate' {
//   interface FortistateStores { 'user': { id: string; name: string } }
// }

export type FortistateStores = Record<string, any>

export default { registerSchema }
