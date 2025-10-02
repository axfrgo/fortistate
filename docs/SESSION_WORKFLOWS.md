# Session Management Workflows

This guide demonstrates common session management patterns for Fortistate inspector servers.

---

## Workflow 1: Bootstrap first admin session

**Scenario:** Starting a fresh inspector with session auth enabled.

### Step 1: Start inspector with session requirement

```bash
FORTISTATE_REQUIRE_SESSIONS=1 fortistate inspect --port 4000
```

### Step 2: Create first admin session (no auth required for bootstrap)

```bash
curl -X POST http://localhost:4000/session/create \
  -H "Content-Type: application/json" \
  -d '{"role":"admin","label":"Bootstrap admin","expiresIn":"7d"}'
```

**Response:**
```json
{
  "session": {
    "id": "sess_abc123",
    "role": "admin",
    "createdAt": "2025-10-01T12:00:00.000Z",
    "expiresAt": "2025-10-08T12:00:00.000Z",
    "label": "Bootstrap admin"
  },
  "token": "eyJhbGc...",
  "tokenType": "Bearer"
}
```

### Step 3: Save token securely

```bash
# Store in environment or secrets manager
export FORTISTATE_ADMIN_TOKEN="eyJhbGc..."
```

---

## Workflow 2: Create editor sessions for team members

**Scenario:** Admin wants to issue tokens for developers who need to mutate state.

### Using CLI

```bash
fortistate session create \
  --role editor \
  --label "Alice - frontend dev" \
  --ttl 24h \
  --token $FORTISTATE_ADMIN_TOKEN
```

### Using HTTP

```bash
curl -X POST http://localhost:4000/session/create \
  -H "Content-Type: application/json" \
  -H "x-fortistate-token: $FORTISTATE_ADMIN_TOKEN" \
  -d '{"role":"editor","label":"Alice - frontend dev","expiresIn":"24h"}'
```

**Response includes new editor token:**
```json
{
  "session": { "id": "sess_xyz789", "role": "editor", ... },
  "token": "eyJhbGc...",
  "tokenType": "Bearer"
}
```

Share the `token` value with the team member securely (never via unencrypted channels).

---

## Workflow 3: List active sessions

**Scenario:** Audit who currently has access.

### Using CLI

```bash
fortistate session list --port 4000 --token $FORTISTATE_ADMIN_TOKEN
```

### Using HTTP

```bash
curl http://localhost:4000/session/list \
  -H "x-fortistate-token: $FORTISTATE_ADMIN_TOKEN"
```

**Response:**
```json
{
  "sessions": [
    {
      "id": "sess_abc123",
      "role": "admin",
      "label": "Bootstrap admin",
      "createdAt": "2025-10-01T12:00:00.000Z",
      "expiresAt": "2025-10-08T12:00:00.000Z",
      "issuedBy": null
    },
    {
      "id": "sess_xyz789",
      "role": "editor",
      "label": "Alice - frontend dev",
      "createdAt": "2025-10-01T13:00:00.000Z",
      "expiresAt": "2025-10-02T13:00:00.000Z",
      "issuedBy": "sess_abc123"
    }
  ]
}
```

---

## Workflow 4: Revoke a compromised session

**Scenario:** A token is accidentally exposed or a team member leaves.

### Revoke by session ID (using CLI)

```bash
fortistate session revoke sess_xyz789 --token $FORTISTATE_ADMIN_TOKEN
```

### Revoke by token (using HTTP)

```bash
curl -X POST http://localhost:4000/session/revoke \
  -H "Content-Type: application/json" \
  -H "x-fortistate-token: $FORTISTATE_ADMIN_TOKEN" \
  -d '{"token":"eyJhbGc..."}'
```

**Response:**
```json
{
  "revoked": true,
  "sessionId": "sess_xyz789"
}
```

After revocation, the token immediately becomes invalid across all endpoints and WebSocket connections.

---

## Workflow 5: Rotate admin token

**Scenario:** Periodic security maintenance or suspected compromise.

### Step 1: Create new admin session

```bash
curl -X POST http://localhost:4000/session/create \
  -H "Content-Type: application/json" \
  -H "x-fortistate-token: $FORTISTATE_ADMIN_TOKEN" \
  -d '{"role":"admin","label":"Rotated admin","expiresIn":"7d"}'
```

Save the new token: `NEW_ADMIN_TOKEN="eyJhbGc..."`

### Step 2: Verify new token works

```bash
curl http://localhost:4000/session/list \
  -H "x-fortistate-token: $NEW_ADMIN_TOKEN"
```

### Step 3: Revoke old token

```bash
curl -X POST http://localhost:4000/session/revoke \
  -H "Content-Type: application/json" \
  -H "x-fortistate-token: $NEW_ADMIN_TOKEN" \
  -d '{"sessionId":"sess_abc123"}'
```

### Step 4: Update environment

```bash
export FORTISTATE_ADMIN_TOKEN="$NEW_ADMIN_TOKEN"
unset NEW_ADMIN_TOKEN
```

---

## Workflow 6: Allow anonymous observers

**Scenario:** Enable read-only public access for demos or internal dashboards.

### Start inspector with anon sessions

```bash
FORTISTATE_REQUIRE_SESSIONS=1 \
FORTISTATE_ALLOW_ANON_SESSIONS=1 \
fortistate inspect
```

Now anyone can:
- `GET /session/current` (see they have no session)
- `GET /remote-stores` (read state)
- Connect via WebSocket (receive snapshots)

But cannot:
- `POST /register` (requires `editor`)
- `POST /change` (requires `editor`)
- `POST /session/create` (requires `admin` unless bootstrap)

---

## Workflow 7: Persistent tokens across restarts

**Scenario:** Avoid re-bootstrapping after inspector restarts.

### Set JWT signing secret

```bash
export FORTISTATE_SESSION_SECRET="$(openssl rand -base64 32)"
```

Store this value in your secrets manager or `.env` file (never commit to git).

### Start inspector

```bash
FORTISTATE_REQUIRE_SESSIONS=1 \
FORTISTATE_SESSION_SECRET=$FORTISTATE_SESSION_SECRET \
fortistate inspect
```

Now tokens issued remain valid after restart, as long as:
1. They haven't expired (`expiresAt`)
2. They haven't been revoked
3. The same `FORTISTATE_SESSION_SECRET` is used

---

## Workflow 8: Audit trail review

**Scenario:** Investigate suspicious activity or generate compliance reports.

### Fetch recent audit log

```bash
curl "http://localhost:4000/audit/log?limit=100" \
  -H "x-fortistate-token: $FORTISTATE_ADMIN_TOKEN"
```

**Response:**
```json
{
  "entries": [
    {
      "action": "session:create",
      "sessionId": "sess_abc123",
      "role": "admin",
      "time": "2025-10-01T12:00:00.000Z",
      "details": { "createdSessionId": "sess_xyz789", "role": "editor" }
    },
    {
      "action": "store:register",
      "sessionId": "sess_xyz789",
      "role": "editor",
      "time": "2025-10-01T13:15:00.000Z",
      "details": { "key": "counter", "hasInitial": true }
    },
    {
      "action": "session:revoke",
      "sessionId": "sess_abc123",
      "role": "admin",
      "time": "2025-10-01T14:00:00.000Z",
      "details": { "success": true, "sessionId": "sess_xyz789", "viaToken": false }
    }
  ],
  "totalLines": 47,
  "returned": 100,
  "limit": 100
}
```

### Export for compliance

Audit log is stored in `.fortistate-audit.log` (JSON Lines format):

```bash
# Export last 7 days to CSV
grep "$(date -d '7 days ago' +%Y-%m-%d)" .fortistate-audit.log | \
  jq -r '[.time,.action,.sessionId,.role] | @csv' > audit-report.csv
```

---

## Best practices summary

1. **Always set `FORTISTATE_SESSION_SECRET` in production** to persist tokens.
2. **Rotate admin tokens regularly** (monthly or quarterly).
3. **Use short TTLs for editor sessions** (24h or less) to limit exposure.
4. **Revoke sessions immediately when team members leave.**
5. **Review audit logs weekly** for anomalies.
6. **Never commit tokens to git** — use environment variables or secrets managers.
7. **Enable TLS when exposing inspector outside localhost.**

---

For more details, see:
- `docs/AUTHENTICATION.md` — Comprehensive auth reference
- `fortistate help` — CLI command reference
- `test/session.test.ts` — Integration test examples
