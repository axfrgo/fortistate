## Utility-first state primitives

Fortistate provides small primitives inspired by the utility-first philosophy. Use these to compose small focused stores and behaviors:

- atom(key, initial) — create a simple store for a single value
- derived(key, deps, compute) — create a derived read-only store recomputed from dependencies
- action(fn) — lightweight helper to define actions that operate on stores
- persist(key, storageKey?) — persist a store to localStorage

Example:

- Create an atom:
  const counter = atom('counter', 0)

- Create a derived store:
  derived('double', ['counter'], (n) => n * 2)

- Persist a store:
  persist('counter')

These primitives are intentionally small and composable; combine them with plugins, presets, and the JIT inspector to build a powerful, utility-first state workflow.
