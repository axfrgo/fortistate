# Clerk Authentication Integration

Fortistate Visual Studio can now authenticate end users with [Clerk](https://clerk.com) and optionally bridge their Clerk sessions to Fortistate Inspector sessions for runtime access.

## Environment variables

Configure the following values in your `.env` (or `.env.local`) file before running the Visual Studio dev server:

| Variable | Required | Description |
| --- | --- | --- |
| `VITE_CLERK_PUBLISHABLE_KEY` | ✅ | Front-end publishable key from the Clerk dashboard. Used by `ClerkProvider` in `src/main.tsx`. |
| `VITE_FORTISTATE_AUTH_BRIDGE_URL` | ➖ | Optional HTTPS endpoint that exchanges a Clerk token for a Fortistate Inspector session token. Required if you want Visual Studio to talk to a protected inspector instance. |

Restart the dev server after updating environment variables.

## Session bridge contract

When `VITE_FORTISTATE_AUTH_BRIDGE_URL` is set, the app will issue a `POST` request with the user's Clerk session token in the `Authorization` header:

```
POST {VITE_FORTISTATE_AUTH_BRIDGE_URL}
Authorization: Bearer <clerk-session-token>
Content-Type: application/json
{}
```

Your service should validate the token with Clerk (typically using the [Clerk backend SDK](https://clerk.com/docs/reference/backend-api)) and return a JSON payload that includes at least a `token` property referencing a Fortistate Inspector session token:

```json
{
  "token": "fortistate-session-token",
  "expiresAt": "2025-10-04T12:34:56.000Z",
  "userId": "clerk_user_id"
}
```

Additional properties are ignored but can be useful for logging or auditing. The helper at `src/auth/fortistateSessionBridge.ts` accepts either camelCase or snake_case for timestamp fields.

If the bridge URL is omitted, Visual Studio will still sign users in with Clerk, but the inspector remains unauthenticated. This is useful for local development.

## Components and hooks

- `ClerkProvider` is registered in `src/main.tsx` using the publishable key.
- `FortistateAuthProvider` (see `src/auth/AuthContext.tsx`) tracks Clerk sign-in state and manages the optional Fortistate session exchange.
- `useFortistateAuth()` exposes the combined auth state, current Clerk user, bridge status, and a `refresh()` helper to re-run the exchange.

## Local development checklist

1. Install dependencies if you have not already:
   ```powershell
   npm install
   ```
2. Create `.env.local` in `packages/visual-studio` with:
   ```bash
   VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
   # Optional bridge for Fortistate Inspector
   # VITE_FORTISTATE_AUTH_BRIDGE_URL=https://your-api.example.com/fortistate/session
   ```
3. Restart the dev server (`npm run dev`). The UI will display a configuration message until the publishable key is available.
4. Implement the session bridge endpoint if you need authenticated access to Fortistate Inspector APIs.

For advanced usage (role mapping, audit logging, etc.), combine Clerk backend webhooks with the Fortistate session management APIs described in `docs/AUTHENTICATION.md`.
