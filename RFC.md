Fortistate RFC — become the Tailwind of state

Goals
- Provide a pragmatic, unopinionated, but extensible state toolkit for modern web apps.
- Offer both programmatic API (createStore/getStore) and React-first hooks (useStore/useSelector).
- Enable a plugin/preset ecosystem: plugins register stores, add middleware, and hook into a JIT dev server.
- Provide a CLI and inspector (like `tailwindcss` and `tailwindcss-contrast`) for dev-time features.

Phases
1) Core: small, fast, well-typed runtime and hook API (done)
2) Tooling: CLI, config loader, plugin system, presets, and inspector
3) Ecosystem: plugins, official presets, React/Next integrations, Vite/webpack plugins
4) Experience: JIT dev server, VS Code extension, playground

Plugin model (sketch)
- plugin = (api) => { api.registerStore('cart', { items: [] }) }
- plugin can export hooks, commands, or register an inspector UI

Config
- `fortistate.config.js` with `presets` and `plugins`
- Allow presets to be functions that return config

CLI
- `fortistate init` create starter config
- `fortistate build` run compilation or JIT
- `fortistate inspect` start a dev inspector

Next steps
- Implement config resolution and plugin loading
- Add official `preset-react` that wires sensible defaults for React apps
- Add `vite` plugin to provide HMR integration


