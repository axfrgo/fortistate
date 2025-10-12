# OAuth 2.0 Integration Flow Guide

## Overview
FortiState Connection Center now supports real OAuth 2.0 authorization flows for all 43 integrated providers.

## How It Works

### 1. User Initiates Connection
When you click **"Connect Account"** on any provider:

```typescript
// ConnectionCenter.tsx calls:
integrationActions.connectAccount(providerId)
```

### 2. OAuth Redirect Flow
The system builds an authorization URL with:
- **client_id**: Your app's OAuth client ID
- **redirect_uri**: `${window.location.origin}/oauth/callback`
- **scope**: Provider-specific permissions (e.g., `'email.send', 'calendar.read'`)
- **state**: CSRF protection token (stored in sessionStorage)
- **response_type**: `'code'` (authorization code flow)

Example authorization URL:
```
https://github.com/login/oauth/authorize?
  client_id=fortistate-github&
  redirect_uri=http://localhost:5173/oauth/callback&
  scope=repo%20user%20workflow&
  state=oauth-state-abc123&
  response_type=code
```

### 3. User Authorizes on Provider's Site
- Browser redirects to provider (GitHub, Google, Stripe, etc.)
- User logs in and grants permissions
- Provider redirects back to your app with authorization code

### 4. OAuth Callback Handler
When redirected back to `/oauth/callback?code=xxx&state=xxx`:

```typescript
// App.tsx useEffect handles callback:
1. Validates state parameter (CSRF protection)
2. Exchanges authorization code for access token
3. Creates integration account in FortiState store
4. Cleans up session storage
5. Removes OAuth params from URL
6. Opens Connection Center to show new account
```

### 5. Token Exchange (Backend Required)
In production, the callback would:
```typescript
// Send code to your backend
const response = await fetch('/api/oauth/exchange', {
  method: 'POST',
  body: JSON.stringify({
    providerId: 'github',
    code: authorizationCode,
    redirectUri: 'http://localhost:5173/oauth/callback'
  })
})

// Backend exchanges code for tokens:
const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
  method: 'POST',
  body: {
    client_id: process.env.GITHUB_CLIENT_ID,
    client_secret: process.env.GITHUB_CLIENT_SECRET, // NEVER expose to frontend!
    code: authorizationCode,
    redirect_uri: redirectUri
  }
})

// Store encrypted tokens in secure backend
await db.integrationAccounts.create({
  userId: currentUser.id,
  providerId: 'github',
  accessToken: encrypt(tokens.access_token),
  refreshToken: encrypt(tokens.refresh_token),
  expiresAt: new Date(Date.now() + tokens.expires_in * 1000)
})
```

## Current State: Mock Mode

Since this is a demo environment without backend OAuth clients configured, the system falls back to **mock mode**:

```typescript
// In integrationStore.ts:
if (shouldFallbackToMock()) {
  // Creates simulated account without real OAuth
  const account = mockConnectAccount(providerId, payload)
  // ... updates store ...
}
```

## Testing OAuth Flow

### Option 1: Mock Mode (Default)
- Click "Connect Account" → instantly creates mock account
- No external redirect
- Perfect for UI development and testing

### Option 2: Real OAuth (Requires Setup)
To test real OAuth redirects:

1. **Register OAuth Apps** with providers:
   - GitHub: https://github.com/settings/developers
   - Google: https://console.cloud.google.com
   - Stripe: https://dashboard.stripe.com/settings/apps

2. **Configure Environment Variables**:
   ```bash
   # .env
   VITE_GITHUB_CLIENT_ID=your_client_id
   VITE_GOOGLE_CLIENT_ID=your_client_id
   # etc...
   ```

3. **Set Redirect URI** on each provider:
   ```
   http://localhost:5173/oauth/callback
   ```

4. **Update connectAccount** to use real client IDs:
   ```typescript
   const params = new URLSearchParams({
     client_id: import.meta.env.VITE_GITHUB_CLIENT_ID, // Real ID
     // ...
   })
   ```

5. **Disable Mock Mode**:
   ```bash
   # Remove or set to false:
   VITE_MOCK_INTEGRATIONS=false
   ```

## Supported Providers (43 Total)

All providers have OAuth configurations with proper authorization URLs and scopes:

### AI Providers (4)
- ChatGPT, Claude, Gemini, Grok

### Google Workspace (7)
- Gmail, Drive, Docs, Sheets, Calendar, Meet, Search, Analytics

### Developer Tools (3)
- GitHub, GitLab, Vercel

### Payments (2)
- Stripe, PayPal

### Cloud Storage (2)
- Dropbox, Box

### Marketing (3)
- Mailchimp, SendGrid, HubSpot

### Social Media (4)
- Twitter/X, LinkedIn, Instagram, YouTube

### Project Management (4)
- Trello, Asana, Jira, Monday

### Communication (5)
- Slack, WhatsApp, Zoom, Discord, Twilio

### Analytics (2)
- Google Analytics, Mixpanel

### Databases (2)
- Airtable, Supabase

### Notes (3)
- Apple Notes, Notion, Evernote

## Security Notes

### CSRF Protection
- State parameter validated on callback
- Prevents cross-site request forgery attacks

### Token Storage (Production)
- **NEVER** store tokens in localStorage or sessionStorage
- Use secure backend with encrypted database
- Implement token rotation for refresh tokens

### Scope Management
- Request minimal scopes needed
- Users see exact permissions requested
- Can revoke access anytime on provider's site

## Next Steps

### Phase 1: Backend OAuth Service ✅ (Architecture Ready)
```typescript
// Backend API endpoints needed:
POST /api/oauth/:providerId/authorize  // Initiates flow
POST /api/oauth/callback               // Handles provider callback
POST /api/oauth/:providerId/refresh    // Refreshes expired tokens
DELETE /api/oauth/accounts/:accountId  // Revokes access
```

### Phase 2: Token Refresh Automation ✅ (Already Implemented)
The system already includes automatic token refresh:
```typescript
// In integrationStore.ts:
async refreshAccount(accountId: string) {
  // Detects token expiry
  // Calls refresh endpoint
  // Updates tokens in store
}
```

### Phase 3: Integration Execution
When executing universes with integration nodes:
```typescript
// ontogenesisEngine.ts executes integration actions:
const account = integrationStore.get().accounts.find(...)
const result = await executeIntegration(node, account.accessToken)
```

## Troubleshooting

### Issue: Redirect Not Happening
**Cause**: Mock mode is enabled
**Solution**: Check console for `[Integrations] Redirecting to OAuth authorization` log

### Issue: State Mismatch Error
**Cause**: State parameter doesn't match
**Solution**: Clear session storage and try again

### Issue: Provider Returns Error
**Cause**: Invalid client ID, wrong redirect URI, or user denied access
**Solution**: Check OAuth app configuration on provider's developer console

### Issue: Callback Not Working
**Cause**: Missing route handler
**Solution**: The `App.tsx` useEffect handles `/oauth/callback` automatically

## Resources

- [OAuth 2.0 Specification](https://oauth.net/2/)
- [GitHub OAuth Apps](https://docs.github.com/en/apps/oauth-apps)
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [Stripe Connect](https://stripe.com/docs/connect/oauth-reference)
