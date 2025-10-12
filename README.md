# fortistate

**Version 3.0 - Collaborative Inspector Edition** 👥

A powerful state management library with collaborative inspector, real-time debugging, and IDE integration. Share snapshots 📸, locate stores in code 🔍, and collaborate with your team in real-time!

[![CI](https://github.com/axfrgo/fortistate/actions/workflows/ci.yml/badge.svg)](https://github.com/axfrgo/fortistate/actions)
[![npm](https://img.shields.io/npm/v/fortistate.svg)](https://www.npmjs.com/package/fortistate)

---

## � What's New in v3.0!

### Collaborative Inspector Features

**📸 Share Store Snapshots**
- One-click shareable URLs with encoded state
- Export as JSON, CSV, Email, or Tweet
- Perfect for bug reports and team collaboration

**🔍 Locate Store in Code**
- Automatically opens store files in VS Code
- Intelligent search pattern generation
- Works with VS Code, WebStorm, and GitHub

**👥 Invite Team to Inspector**
- Share inspector session URLs
- QR code for mobile access
- Real-time collaboration and debugging

**🎨 Aurora White Theme**
- Beautiful, professional interface
- Improved readability and UX
- Modern glassmorphism design

[See full v3.0 release notes →](./RELEASE_NOTES_v3.0.md)

---

## 🚀 Quick Start

### Installation
```bash
npm install fortistate
```

### Create a Store
```typescript
import { createStore } from 'fortistate'

const counterStore = createStore('counter', { count: 0 })
```

### Start the Inspector
```bash
npx fortistate inspect
```

Open `http://localhost:4000` and enjoy the new collaboration features!

### Use New v3.0 Features
- Click **📸** on any store to share snapshots
- Click **🔍** to locate store in your code (auto-opens VS Code!)
- Click **👥 Invite** to share with your team

---

## 🎯 Advanced Features (v2.0 - Cosmogenesis Engine)

**From Cosmogenesis Engine → Substrate of Possibility** — Evolution into "Figma for State Management" with quantum mechanics and relativity built-in.

🚀 **Meta-Laws Engine is live!** Compose laws with conflict resolution:

**Week 7-8: Meta-Laws Engine** ⚖️
- 🔗 **Law composition**: AND/OR/IMPLIES/SEQUENCE/PARALLEL operators
- ⚡ **Conflict resolution**: 7 strategies (priority, voting, frame-dependent, etc.)
- 🧩 **Dynamic mutation**: Add/remove laws at runtime
- 🎨 **Helper functions**: `and()`, `or()`, `implies()`, `sequence()`
- 🎯 **157/161 tests passing** (97.5% - core functionality 100%)

[Meta-laws docs →](./WEEK_7_8_COMPLETE.md) | [Progress tracker →](./V3_PROGRESS.md)

**Week 5-6: Relativistic Substrate** 🌌
- 🚀 **Observer frames**: Multiple perspectives with relative velocities
- ⏱️ **Causal ordering**: Light cone constraints, no time paradoxes
- 🔄 **Lorentz transformations**: Time dilation for distributed systems
- 📊 **29 new tests**: 133/133 v3.0 tests passing (100%)

[Relativistic docs →](./WEEK_5_6_COMPLETE.md)

**Week 3-4: Quantum Substrate** ⚛️
- 🌊 **Superposition**: States exist in multiple possibilities simultaneously
- 🔗 **Entanglement**: Spooky action between entities
- 👁️ **Observer**: Collapse superpositions via measurement (Born rule)
- 📊 **37 new tests**: 104/104 v3.0 tests passing (100%)

[Quantum docs →](./WEEK_3_4_COMPLETE.md)

**Week 1-2: Possibility Algebra** 🔤
- 🏗️ **Entity primitive**: Type-safe entity definitions
- 🔒 **Constraint primitive**: Validation with auto-repair
- ⚖️ **Law primitive**: Universal rules governing behavior
- 📊 **67 tests**: Foundation complete

[Foundation docs →](./WEEK_1_2_COMPLETE.md)

---

## 🚀 v3.0 Quick Start

### Meta-Law Composition
```typescript
import { defineMetaLaw, defineLaw, and } from '@fortistate/possibility'

// Define individual laws
const creditCheck = defineLaw({
  name: 'credit-check',
  inputs: ['customer'],
  output: 'approved',
  enforce: (c) => c.creditScore > 650
})

const inventoryCheck = defineLaw({
  name: 'inventory-check',
  inputs: ['product'],
  output: 'available',
  enforce: (p) => p.stock > 0
})

const fraudCheck = defineLaw({
  name: 'fraud-check',
  inputs: ['transaction'],
  output: 'safe',
  enforce: (t) => !t.flagged && t.amount < 10000
})

// Compose into meta-law (ALL must pass)
const orderApproval = and('order-approval', [
  creditCheck,
  inventoryCheck,
  fraudCheck
], {
  conflictResolution: 'error',
  context: { mode: 'strict' }
})

// Execute
const result = orderApproval.execute([customer, product, transaction])

if (result.success) {
  console.log('Order approved! ✅')
} else {
  console.log('Order denied:', result.error)
  console.log('Failed checks:', 
    Array.from(result.lawResults.entries())
      .filter(([_, r]) => !r.success)
      .map(([name, _]) => name)
  )
}
```

---

## 🌟 What's New in v2.0 (Phase 3D Complete!)

🚀 **Physics Simulations are live!** Latest achievements:

**Phase 3D: Physics Simulations** �
- ⚛️ **Classical mechanics substrate**: Gravity, friction, momentum, energy
- 💥 **Collision detection & resolution**: Elastic collisions with conservation laws
- 📐 **Vector mathematics**: 2D physics operations and utilities
- 🔒 **Constraint enforcement**: Mass positivity, velocity limits, position bounds
- 📊 **Energy tracking**: Kinetic, potential, and total energy calculations
- 🎮 **Example simulations**: Bouncing ball, multi-body collisions

[Physics guide →](./docs/PHYSICS.md) | [Examples →](./examples/physics/)

**Phase 3C: Performance Harness** ⚡
- 📊 **Statistical benchmarking**: P95/P99 analysis with warmup
- 🎯 **Result: 5.6ms average** (3x better than 15ms target!)
- 💾 **Memory tracking**: ~38MB for 10k events
- 📈 **Scalability testing**: Constraint overhead, repairs, cross-store laws

[Performance docs →](./docs/PERFORMANCE.md)

**Phase 3B: Universe Manager** 🌌
- 🌐 **Universe orchestration**: Manage multiple causal stores as unified realities
- 🔄 **Lifecycle management**: Start, pause, resume, destroy universes
- 📸 **Snapshots & time travel**: Capture and restore complete universe state
- 🌿 **Universe forking**: Create alternate timelines with divergent state
- 🌐 **Multiverse coordination**: Manage multiple universes simultaneously

[Universe docs →](./docs/UNIVERSE_MANAGER.md) | [Quick reference →](./docs/UNIVERSE_QUICKSTART.md) | [Full roadmap →](./COSMOGENESIS_ROADMAP.md)

**Phase 1 (Temporal Foundation):**
- ⏰ **Time travel**: Jump to any state in history
- 🌿 **Universe branching**: Create parallel timelines
- 📊 **Entropy measurement**: Quantify state complexity
- 🔒 **Existence constraints**: Define "laws of nature"

[Phase 1 summary →](./PHASE_1_COMPLETE.md) | [Migration guide →](./docs/TEMPORAL_MIGRATION.md)

---

Quick install & getting started
------------------------------

```bash
npm install fortistate
```

### Basic Usage (v1.x compatible)

```tsx
import { createStore, useStore } from 'fortistate'

const counter = createStore({ value: 0 })

function Counter() {
  const [state, setState] = useStore(counter)
  return <button onClick={() => setState(s => ({ value: s.value + 1 }))}>
    {state.value}
  </button>
}
```

### New: Temporal State & Universe Management (v2.0+)

```tsx
import { createUniverse } from 'fortistate'

// Define laws of physics for your universe
const substrate = {
  id: 'my-app',
  name: 'Application Rules',
  constraints: new Map([...]),
  laws: new Map([...]),
}

// Create a universe with multiple stores
const universe = createUniverse({
  id: 'my-app',
  substrate,
})

// Create stores within the universe
const counter = universe.createStore('counter', 0)
const user = universe.createStore('user', { name: 'Alice' })

// Time travel
const pastState = counter.at(Date.now() - 5000)  // 5 seconds ago

// Snapshots
const checkpoint = universe.snapshot()
universe.restore(checkpoint)  // Rollback to checkpoint

// Forking (create parallel realities)
const fork = universe.fork('experiment-a')
fork.getStore('counter')?.set(999)  // Changes don't affect original

// Multiverse coordination
import { Multiverse } from 'fortistate'
const multiverse = new Multiverse()
multiverse.add(universe1)
multiverse.add(universe2)
multiverse.pauseAll()  // Freeze all universes
```

[Full Universe Manager guide →](./docs/UNIVERSE_MANAGER.md)

---

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

- `--port <n>`: specify the inspector port (default 4000).
- `--token <token>`: provide a legacy shared token (backward compatibility only — use session-based auth for production).
- `--allow-origin <origin>`: add an allowed origin for CORS.
- `--quiet`: reduce debug logs in tests or CI.
- `FORTISTATE_REQUIRE_SESSIONS=1`: require issued sessions for write operations; combine with `FORTISTATE_ALLOW_ANON_SESSIONS=1` to keep anonymous read-only access during local testing.

**New:** Session management via CLI

```bash
# Create editor session
fortistate session create --role editor --label "Alice" --ttl 24h

# List active sessions (requires admin token)
fortistate session list --port 4000 --token <admin-token>

# Revoke session
fortistate session revoke <session-id> --token <admin-token>
```

Run `fortistate help` for complete command reference and environment variable documentation.

Example:

```bash
npx fortistate inspect --port 3333 --allow-origin http://localhost:3000
```

For comprehensive session workflows, see `docs/SESSION_WORKFLOWS.md`.

Config-driven presets & plugins
-------------------------------

- The inspector now looks for `fortistate.config.{js,cjs,mjs}` in its working directory and automatically loads any declared presets or plugins.
- Presets that return additional plugins are resolved before plugin execution, matching the RFC roadmap for a Tailwind-like ecosystem.
- Config changes (or updates to string-referenced presets/plugins) trigger a reload via [`chokidar`](https://github.com/paulmillr/chokidar); the inspector refreshes registered stores in-place and broadcasts updates to connected clients.
- Use the environment variable `FORTISTATE_DISABLE_CONFIG_WATCH=1` to disable file watching when running in environments where filesystem watchers are not desirable.
- When a plugin/preset is removed from the config, the associated stores are cleaned up from the inspector's remote view so the UI stays in sync with the source of truth.

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

Collaboration & security:
- Set `FORTISTATE_REQUIRE_SESSIONS=1` to require session tokens for write endpoints and WebSocket connections. Create sessions via `POST /session/create` (roles: `observer`, `editor`, `admin`).
- The inspector issues JWT-based sessions by default; provide `FORTISTATE_SESSION_SECRET` to persist tokens across restarts (otherwise ephemeral secret is generated).
- Audit entries are appended to `.fortistate-audit.log` (JSON Lines). Admin sessions can retrieve recent entries via `GET /audit/log?limit=<n>&format=<json|csv|plain>`. Logs rotate automatically by size (default: 1 MB) or age (default: 30 days); configure with `FORTISTATE_AUDIT_MAX_SIZE` (bytes) and `FORTISTATE_AUDIT_ROTATE_DAYS`.
- Admins can clean up access with `POST /session/revoke`, passing either a `sessionId` or `token` to invalidate.
- **New:** Role-based middleware simplifies endpoint guards. See `docs/AUTHENTICATION.md` for comprehensive auth documentation and security best practices.

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



