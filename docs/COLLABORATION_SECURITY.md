# Collaboration & Security (Phase 2)

This document describes the inspector's collaboration and security features: session creation, optional JWT support, session enforcement, and the audit log.

## Session creation

Endpoint: POST /session/create

Request JSON: { "role": "observer" | "editor", "expiresIn": "7d" } (expiresIn optional)
Response JSON: { "token": "...", "role": "observer" | "editor" }

Behavior:
- If the environment variable `FORTISTATE_JWT_SECRET` is set, the server will issue a signed JWT containing the role (observer/editor). The JWT will be signed with the secret and an optional `expiresIn` claim can be supplied in the request.
- If `FORTISTATE_JWT_SECRET` is not set, the server will issue a random UUID-like token and persist it to `.fortistate-sessions.json` in the server `cwd`.
- Sessions are persisted to `.fortistate-sessions.json` so tokens survive restarts.
- The default TTL is seven days. Override with `expiresIn`, `FORTISTATE_SESSION_TTL` (e.g. `12h`), or by passing `defaultTtlMs` when embedding the inspector.
- The global maximum session count defaults to 500 and can be tuned with `FORTISTATE_SESSION_MAX`.

Related session endpoints:
- `GET /session/current` — return the caller's resolved session (if any) and global session requirements.
- `GET /session/list` — admin-only list of active sessions (automatically cleans up expired entries).
- `POST /session/revoke` — admin-only endpoint to revoke a session by `sessionId` or by `token` (opaque or JWT). Revocations are recorded in the audit log as `session:revoke`.

## Session enforcement

Environment variable: `FORTISTATE_REQUIRE_SESSIONS`

- If `FORTISTATE_REQUIRE_SESSIONS` is set to `1`, write endpoints require a valid session token.
- When sessions are required, anonymous HTTP requests to protected routes return `401 unauthorized`, and anonymous WebSocket handshakes close with code `4401`.
- Clients should include the session token in the `x-fortistate-token` HTTP header.
- Roles:
  - `observer`: read-only. Requests that attempt to modify state will be rejected with 403 `read-only`.
  - `editor`: may perform write operations.
  - `admin`: can manage sessions and read the audit log.
- WebSocket connections use the same token resolution rules (either the `x-fortistate-token` header or `Authorization: Bearer <token>`). Anonymous WebSocket access is rejected when sessions are required.
- Admins can revoke issued sessions via `POST /session/revoke` to immediately terminate access (active WebSocket connections are closed on the next message send/broadcast once the session disappears).
- Allow anonymous collaboration for greenfield testing by exporting `FORTISTATE_ALLOW_ANON_SESSIONS=1`. This keeps session issuance optional while still honoring sessions and legacy tokens when provided.

Write endpoints that enforce sessions include (non-exhaustive):
- POST /register
- POST /change
- POST /apply-preset
- POST /duplicate-store
- POST /swap-stores
- POST /move-store
- POST /open-source (requires additional opt-in allowOpen)

JWT behavior:
- When JWTs are enabled, the server will verify the token using the `FORTISTATE_JWT_SECRET` and extract the role claim.
- Audit entries reference the raw token string (JWT or session id). For privacy-conscious deployments, prefer short-lived JWTs.

### Legacy token compatibility

- The CLI `--token` flag (or `opts.token` in the programmatic API) continues to work as a "legacy" shared secret.
- Legacy tokens are resolved alongside sessions. When a request passes the legacy token and the handler opts-in via `{ allowLegacy: true }`, the action is authorized even if sessions are required globally.
- To force all callers onto sessions, set `FORTISTATE_REQUIRE_SESSIONS=1` *and* avoid passing `allowLegacy` for new endpoints. The shared role enforcer will return `401 unauthorized` with reason `legacy-token-required` when a handler disallows the legacy token.

### Role enforcement flow (HTTP & WebSocket)

The inspector now centralizes its authorization logic via `createRoleEnforcer`, which every HTTP route and WebSocket connection shares.

1. **Resolution** — Tokens are pulled from `x-fortistate-token`, `Authorization: Bearer`, and optional explicit overrides. The result is cached per request.
2. **Session lookup** — When a bearer value matches an active session (JWT or opaque), the resolved session role drives authorization decisions.
3. **Decision matrix** — Each endpoint declares a required role (`observer`, `editor`, or `admin`) plus optional flags:
  - `optional: true` allows the request to continue when no token is present (useful for read-only metadata routes).
  - `allowLegacy: true` enables the legacy token fallback for that endpoint. When omitted, the legacy token is rejected even if configured.
  - `requireSession: true` forces session usage even if sessions are not globally required.
4. **WebSockets** — The same enforcer drives the connection handshake. Denied connections send a close frame with `4401`, while successful connections reuse the cached auth on every message.

Every authorization outcome is emitted to the audit log with the resolved session id (or `legacy`) so operators can trace why a request succeeded or failed.

## Audit log

Audit file: `.fortistate-audit.log` (JSON Lines)

- Every mutating action is appended to the audit file as a single JSON object per line.
- Typical fields:
  - `time` – ISO timestamp string
  - `sessionId` – opaque session id (or `null` if missing)
  - `role` – resolved role (`observer`, `editor`, `admin`, or `legacy`)
  - `action` – action name (e.g., `session:create`, `register`, `change`)
  - `details` – action-specific details (keys, values, etc.)

Example line:

{"time":"2025-09-30T12:34:56.789Z","sessionId":"<session-id>","role":"editor","action":"change","details":{"key":"my.store","prev":null,"value":42}}

### Reading the audit log

- Endpoint: `GET /audit/log?limit=200`
- Auth: requires an `admin` session (legacy token allowed for compatibility)
- Response payload:
  ```json
  {
    "entries": [/* most recent entries, oldest first */],
    "totalLines": 123,
    "returned": 50,
    "limit": 50
  }
  ```
- The server limits `limit` to the range 1…1000 to avoid large payloads.
- Every successful read is itself recorded in the audit log (`audit:read`).

## Files created on disk

- `.fortistate-sessions.json` - persisted sessions (when JWT not used)
- `.fortistate-audit.log` - append-only JSONL audit file

## Notes and operational guidance

- For CI or automated environments, use short-lived JWTs and do not persist long-lived tokens to disk.
- Audit logs are append-only and safe to ship to centralized logging systems for analysis/retention.
- The server supports an `opts.cwd` when created programmatically; this controls where the session and audit files get written (useful for tests or isolated runs).

