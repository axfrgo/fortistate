# Examples

This folder contains example presets and configs used to test the fortistate loader and plugin system.

Run the plugin smoke test:

```powershell
npm run plugins-smoke
```

Try the CLI directly to load the examples folder:

```powershell
# from package root
node dist/cli.js load examples
```

The example preset registers an `example` store that you can later access with `getStore('example')` or `useStore.example()` in React.
