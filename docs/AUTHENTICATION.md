# Fortistate Inspector Authentication

This document explains how Fortistate's inspector server authenticates requests, enforces role-based access control (RBAC), and manages sessions.

## Overview

The inspector server supports **two authentication modes**:

1. **Legacy token** — A single static token set via `--token` CLI flag or `.fortistate-inspector-token` file.
2. **Session-based** — JWT tokens issued via `/session/create`, with configurable roles (`observer`, `editor`, `admin`).

Session-based auth is **recommended for production** or multi-user environments; legacy tokens exist for backward compatibility and local dev.

---

## Role hierarchy

Roles follow a strict hierarchy:

- **observer** — Read-only access (GET endpoints, WebSocket snapshots).
- **editor** — Mutate state, apply presets, register stores.
- **admin** — Full control (create/revoke sessions, rotate tokens, access audit logs).

A user with `editor` can perform any `observer` action; `admin` can perform any `editor` or `observer` action.

---

## Environment configuration

### `FORTISTATE_REQUIRE_SESSIONS=1`

When enabled, all requests **must** present a valid session token (unless explicitly marked optional). Legacy token is rejected unless `allowLegacy: true` is set at the endpoint level.

### `FORTISTATE_ALLOW_ANON_SESSIONS=1`

Permits unauthenticated requests to optional endpoints even when sessions are required.

### `FORTISTATE_SESSION_SECRET`

Custom JWT signing key for session tokens. If unset, an ephemeral secret is generated on startup (tokens expire on restart).

### `FORTISTATE_SESSION_TTL`

Default session lifespan. Supports formats like `1h`, `7d`, `3600s`, or raw milliseconds.

### `FORTISTATE_SESSION_MAX`

Maximum number of concurrent active sessions.

### `FORTISTATE_DEBUG=1`

Logs detailed auth decisions and session events to console for troubleshooting.

---

## HTTP endpoints

### Session management

#### `POST /session/create`

**Body:**
```json
{
  "role": "observer" | "editor" | "admin",
  "expiresIn": "1h",  // optional
  "label": "My session"  // optional
}
```

**Auth required:** 
- First session creation (when no sessions exist) is allowed without auth.
- Subsequent sessions require `admin` or higher role.
- Requested role cannot exceed the caller's role.

**Response:**
```json
{
  "session": { "id": "...", "role": "editor", ... },
  "token": "...",
  "tokenType": "Bearer"
}
```

#### `GET /session/current`

Returns the current session info for the authenticated user. Optional endpoint (can be called without auth to check server config).

#### `GET /session/list`

Lists all active sessions. Requires `admin` role.

#### `POST /session/revoke`

**Body:**
```json
{
  "sessionId": "...",  // or
  "token": "..."
}
```

Revokes a session by ID or token. Requires `admin` role.

---

## WebSocket authentication

WebSocket connections authenticate using the same token mechanisms:

1. **Header-based:** `x-fortistate-token` or `Authorization: Bearer <token>`
2. **Query parameter:** `?token=...`, `?sessionToken=...`, or `?accessToken=...`

When `FORTISTATE_REQUIRE_SESSIONS=1`, unauthenticated WebSocket connections are rejected with close code `4401`.

Origin validation follows the same CORS rules as HTTP requests.

---

## Role enforcement APIs

### `createRoleEnforcer(options)`

Low-level enforcer for validating tokens and checking roles.

**Options:**
- `sessionStore`: SessionStore instance
- `requireSessions`: boolean
- `allowAnonSessions`: boolean
- `getLegacyToken`: () => string | undefined
- `debug`: boolean

**Methods:**
- `resolve(headers, explicitToken?)` — Extract and validate token from headers
- `enforceHttp(req, res, requiredRole, options?)` — Enforce role on HTTP request (writes 401/403 on denial)
- `check(auth, requiredRole, options?)` — Pure decision function (no side effects)

### `createRoleMiddleware(enforcer)`

High-level HTTP guards wrapping the enforcer.

**Methods:**
- `http.observer(req, res, options?)` — Require observer role
- `http.editor(req, res, options?)` — Require editor role
- `http.admin(req, res, options?)` — Require admin role
- `enforce(role, req, res, options?)` — Dynamic role enforcement
- `check(auth, role, options?)` — Delegate to enforcer check

**Options:**
- `optional`: Allow unauthenticated access
- `allowLegacy`: Accept legacy token (default: `true`)
- `requireSession`: Override session requirement
- `description`: Audit log label

---

## Usage example

```typescript
import { createRoleEnforcer, createRoleMiddleware } from './inspectorAuth.js'

const roleEnforcer = createRoleEnforcer({
  sessionStore,
  requireSessions: process.env.FORTISTATE_REQUIRE_SESSIONS === '1',
  allowAnonSessions: process.env.FORTISTATE_ALLOW_ANON_SESSIONS === '1',
  getLegacyToken: () => legacyToken,
  debug: process.env.FORTISTATE_DEBUG === '1',
})

const roleMiddleware = createRoleMiddleware(roleEnforcer)

// In HTTP handler:
const auth = roleMiddleware.http.editor(req, res)
if (!auth) return // Already sent 401/403

// Proceed with editor-level operation
mutateStore(auth)
```

---

## CLI commands

### Create a session

```bash
fortistate session create --role editor --label "My session" --ttl 24h
```

### List active sessions (requires admin token)

```bash
fortistate session list --port 4000 --token <admin-token>
```

### Revoke a session

```bash
fortistate session revoke <session-id> --token <admin-token>
```

For comprehensive workflow examples, see `docs/SESSION_WORKFLOWS.md`.

---

## Security best practices

1. **Set `FORTISTATE_SESSION_SECRET`** to a strong random value in production (use a secrets manager).
2. **Enable `FORTISTATE_REQUIRE_SESSIONS=1`** to disable legacy token fallback.
3. **Rotate tokens regularly** using `/session/revoke` and re-issue via `/session/create`.
4. **Monitor `/audit/log`** for suspicious auth attempts.
5. **Use TLS** when exposing the inspector server outside localhost.
6. **Limit `FORTISTATE_SESSION_MAX`** to prevent session exhaustion attacks.

---

## Audit logging

All auth decisions are logged to `.fortistate-audit.log` in the project root:

```json
{
  "action": "session:create",
  "sessionId": "...",
  "role": "editor",
  "time": "2025-10-01T12:34:56.789Z",
  "details": { "createdSessionId": "...", "role": "editor" }
}
```

### Retrieving audit logs

Admin sessions can retrieve recent entries via `GET /audit/log?limit=<n>&format=<format>`:

```bash
# JSON format (default) - structured response with metadata
curl -H "Authorization: Bearer <admin-token>" \
  "http://localhost:4000/audit/log?limit=100"

# CSV format - downloadable spreadsheet with headers
curl -H "Authorization: Bearer <admin-token>" \
  "http://localhost:4000/audit/log?limit=100&format=csv" > audit.csv

# Plain text format - tab-separated for grep/awk
curl -H "Authorization: Bearer <admin-token>" \
  "http://localhost:4000/audit/log?format=plain" | grep "session:create"
```

### Log rotation

Logs automatically rotate when either threshold is exceeded:

- **Size-based**: Set `FORTISTATE_AUDIT_MAX_SIZE` (bytes, default: 1048576 = 1 MB)
- **Age-based**: Set `FORTISTATE_AUDIT_ROTATE_DAYS` (days, default: 30)

Rotated files are timestamped: `.fortistate-audit-2025-10-01T12-34-56-789Z.log`

```bash
# Example: Rotate at 10 MB or 7 days
FORTISTATE_AUDIT_MAX_SIZE=10485760 \
FORTISTATE_AUDIT_ROTATE_DAYS=7 \
npm run inspect
```

---

## Troubleshooting

### "unauthorized" on every request

- Check if `FORTISTATE_REQUIRE_SESSIONS=1` is set and you're not providing a token.
- Verify the token hasn't expired (check `expiresIn` on creation).
- Ensure `FORTISTATE_SESSION_SECRET` is stable across restarts.

### "forbidden" when creating admin session

- You need an existing `admin` session to create another `admin` session.
- The first session can be created without auth; use that to bootstrap.

### "legacy-token-required"

- A legacy token is configured but your endpoint requires `allowLegacy: false`.
- Switch to session-based auth or remove the legacy token.

### WebSocket closes with 4401

- Missing or invalid token on WebSocket connection.
- Add `?token=...` query param or `x-fortistate-token` header.

---

For more details, see:
- `src/inspectorAuth.ts` — Auth enforcement implementation
- `src/sessionStore.ts` — Session lifecycle management
- `test/inspectorAuth.test.ts` — Auth behavior test suite
- `docs/SESSION_WORKFLOWS.md` — Common session management workflows
- `fortistate help` — CLI usage and examples
