# fortistate

A tiny state library and developer inspector for fast iteration and debugging.

[![CI](https://github.com/axfrgo/fortistate/actions/workflows/ci.yml/badge.svg)](https://github.com/axfrgo/fortistate/actions)
[![npm](https://img.shields.io/npm/v/fortistate.svg)](https://www.npmjs.com/package/fortistate)

Quick install & getting started
------------------------------

Follow the step-by-step quickstarts in `GETTING_STARTED.md`:

```bash
npx open GETTING_STARTED.md || start GETTING_STARTED.md
```

![Inspector demo](docs/inspector-demo.gif)

Quickstarts
-----------

React (hooks)

```tsx
import React from 'react'
import { createStore, useStore } from 'fortistate'

const counter = createStore({ value: 0 })

function Counter(){
	const [state, setState] = useStore(counter)
	return <button onClick={() => setState(s => ({ value: s.value + 1 }))}>{state.value}</button>
}

export default Counter
```

Vue (composition)

```js
import { createStore, useStore } from 'fortistate'
import { ref } from 'vue'

const counter = createStore({ value: 0 })

export default {
	setup(){
		const [state, setState] = useStore(counter)
		return { state, inc: () => setState(s => ({ value: s.value + 1 })) }
	}
}
```

Next.js (auto-register example)

See `examples/my-nextjs-app` for a full Next.js example that auto-registers stores on the client and demonstrates the inspector integration.

Zero-config inspector
---------------------

Start a local inspector for your project (zero-config):

```bash
npm run inspect
# or
npx fortistate inspect
```

By default the inspector runs an HTTP server that serves a small UI and a WebSocket endpoint. Browser agents (examples included) auto-register client stores and stream updates to the inspector. Use `--token` and `--allow-origin` flags to control access in shared environments.

CLI / Inspector flags
---------------------

The CLI exposes a few useful flags when running `npx fortistate inspect` or `npm run inspect`:

- `--port <n>`: specify the inspector port (default 3333).
- `--token <token>`: set a simple auth token to accept remote register/change requests.
- `--allow-origin <origin>`: add an allowed origin for CORS.
- `--quiet`: reduce debug logs in tests or CI.

Example:

```bash
npx fortistate inspect --port 3333 --token hunter2 --allow-origin http://localhost:3000
```

Developer experience (DX)
------------------------

- One-line install and small runtime make adoption trivial.
- Hooks for React/Vue and an example Next.js app make getting started fast.
- Inspector provides live remote inspection, persisted registrations across restarts, and simple token/origin controls for basic security.

CI and stability
----------------

There is a small CI workflow that runs tests and builds on push and pull requests; it helps keep the package stable. See `.github/workflows/ci.yml` for details.

Examples and templates
----------------------

Look in `examples/` for working integrations (Next.js example and a small inspector client). Contributing templates and migration recipes are planned to make adoption even easier.

Contributing
------------

See `CONTRIBUTING.md` for contribution guidelines and release notes.

[![CI](https://github.com/fgh-labs/fortistate/actions/workflows/ci.yml/badge.svg)](https://github.com/fgh-labs/fortistate/actions/workflows/ci.yml)

Small utility-first state library and tooling.

## Testing

- Tests are run with Vitest. There is a global `testTimeout` configured in `vitest.config.ts` set to 20000ms to allow network/socket tests (inspector) to be stable in CI.
- The inspector integration test opens a local WebSocket, requests a snapshot and verifies that stores are included. The test runs quietly in CI by default (the inspector server is created with `quiet: true`).

Run tests locally:

```bash
npm ci
npm run build
npm test
```

## Inspector (dev tooling)

Fortistate ships a lightweight inspector that runs an HTTP + WebSocket server (default port 4000, examples use 4555).

Start the inspector:

```bash
# from the fortistate package root
node dist/cli.js inspect 4555
```

Options:
- --token <token> — require requests to include header x-fortistate-token for /register and /change
- --allow-origin <origin> — set Access-Control-Allow-Origin for CORS (useful for browser clients)

Dev helper:
- GET /set-token — small HTML form to set a token for local dev
- POST /set-token — accepts JSON or form-encoded token and saves `.fortistate-inspector-token` in working dir (dev only)

Snapshots and persistence:
- Remote registrations are stored in `.fortistate-remote-stores.json` and loaded at inspector startup.

## Release notes — v1.0.1

- Inspector: added persistence for remote-registered stores, token support, CORS/allow-origin support, and a small dev token setter UI.
- CLI: added `--token` and `--allow-origin` flags for `inspect` command.
- Example: Next.js example auto-registers demo counter to the inspector for easier testing.

## What's new (latest)

- Embedded inspector client: safer event wiring (no inline onclick code), modernized UI, and a new store filter input for easier navigation.
- Auto-swap detection: the inspector can now heuristically detect the host app's active store key (URL param, data-active-key, or common names) and swap stores without manual key entry.
- Presets & CSS: apply presets remotely; installer helper can optionally write a preset's CSS into the project. The inspector UI now has clearer apply / install CSS buttons.
- Favicon support: inspector serves `/favicon.ico` from the project root if present (or a packaged fallback), so you can set a custom icon.
- Example fixes: Next.js demo now reflects the selected store in the header and actions (inc/dec/reset) operate on the selected store.

## Publishing a release (npm + GitHub)

1. Bump the package version in `package.json` (semver). Example to set v1.0.2:

```bash
npm version patch -m "release: v%s"
```

2. Build the package and run tests:

```bash
npm run build
npm test
```

3. Dry-run publish to check packaged files:

```bash
npm publish --dry-run
```

4. Publish to npm and push a git tag (example using npm to publish):

```bash
npm publish
git push origin --follow-tags
```

5. Create a GitHub release (optional) and attach the changelog/notes. If you want, I can automatically create a release for you after publishing.

Notes:
- If your project uses a CI workflow to publish from tags (recommended), consider adding a GitHub Actions workflow to publish on semantic version tags. I can add a sample workflow if you'd like.



