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


