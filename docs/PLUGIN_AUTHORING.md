# Plugin authoring guide

A fortistate plugin is a function that receives an API and can register stores or provide other side-effects.

Basic plugin

```js
// my-plugin.js
module.exports = function myPlugin(api) {
  api.registerStore('cart', { items: [] })
}
```

Preset that returns plugins

```js
module.exports = function myPreset() {
  return {
    plugins: [
      (api) => api.registerStore('session', { user: null })
    ]
  }
}
```

Notes
- Plugins can be CJS or ESM. The loader attempts dynamic import first and falls back to require.
- The `registerStore` function both creates the store (via `createStore`) and records the registration in the plugin registry.
- While the inspector is running it will automatically reload your plugin when the referenced file changes, so you can iterate on presets/plugins without restarting (`FORTISTATE_DISABLE_CONFIG_WATCH=1` disables this behaviour).

Testing
- Use the example preset in `examples/presets/` and run:

```powershell
npm run plugins-smoke
```

This will build and run an integration smoke test validating the preset registers its store.
