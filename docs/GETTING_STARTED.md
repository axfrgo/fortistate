# Fortistate — Getting Started

Fortistate is an extensible state management toolkit designed to be extended via presets and plugins (a Tailwind-like ecosystem ambition).

Quick start

1) Install the package (local dev):

```powershell
# from fortistate root
npm install
npm run build
```

2) Create a config

```powershell
node dist/cli.js init
```

3) Load plugins from an examples folder

```powershell
node dist/cli.js load examples
```

Files of interest
- `src/loader.ts` - plugin loader
- `src/plugins.ts` - plugin registry
- `examples/` - example presets and configs

Inspector integration
---------------------

- Running `npm run inspect` (or `npx fortistate inspect`) now auto-loads `fortistate.config.{js,cjs,mjs}` from the working directory.
- Any presets that return plugins are resolved before execution, so your config is the single source of truth for inspector state.
- File changes to the config or to string-referenced presets/plugins trigger a reload (backed by `chokidar`); connected inspector clients receive store updates instantly.
- Set `FORTISTATE_DISABLE_CONFIG_WATCH=1` if you need to disable filesystem watching in constrained environments.


