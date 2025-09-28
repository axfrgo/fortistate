# Fortistate

<!-- CI badge: replace `OWNER/REPO` with your GitHub org/repo if you rename the repo -->
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


