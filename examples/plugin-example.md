Example plugin / preset

Create `my-preset/index.js`:

```js
module.exports = function fortistatePreset() {
  return {
    plugins: [
      (api) => {
        api.registerStore('session', { user: null })
      }
    ]
  }
}
```

Add to `fortistate.config.js`:

```js
module.exports = {
  presets: ['./my-preset'],
  plugins: []
}
```

Usage: the preset registers a `session` store which the app can `useStore.session()` or `getStore('session')` to access.
