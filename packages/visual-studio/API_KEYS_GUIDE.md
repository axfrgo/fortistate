# API Keys & Environment Variables Guide

## Quick Answer: **You're Good! 🎉**

The OAuth integration system is currently running in **mock mode** and doesn't require any API keys to function. However, here's what you need to know for different scenarios:

---

## Current Setup (Mock Mode - No API Keys Needed)

### ✅ What Works Now
- All 43 OAuth integrations display in Connection Center
- "Connect Account" creates mock accounts instantly
- No external API calls (everything simulated)
- Perfect for UI development and testing

### How It Works
```typescript
// integrationStore.ts automatically enables mock mode
const FORCE_MOCK = VITE_MOCK_API === 'true' || VITE_MOCK_INTEGRATIONS === 'true'
```

**Default behavior:** If no environment variables are set, the system automatically falls back to mock mode when API calls fail.

---

## Required API Key (Currently Missing)

### 🔴 VITE_CLERK_PUBLISHABLE_KEY (Authentication)

**Status:** Required but not set  
**Impact:** App will throw error on startup  
**Current behavior:** Shows error in console

```typescript
// main.tsx line 13
if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key")
}
```

#### How to Fix:

1. **Sign up for Clerk** (free tier available)
   - Go to https://clerk.com
   - Create an account
   - Create a new application

2. **Get your Publishable Key**
   - In Clerk Dashboard → API Keys
   - Copy the "Publishable Key" (starts with `pk_test_...` or `pk_live_...`)

3. **Create `.env` file** in `packages/visual-studio/`:
   ```bash
   VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
   ```

4. **Restart dev server**
   ```bash
   npm run dev
   ```

---

## Optional Environment Variables

### 🟡 OAuth Provider Integrations (Optional)

**Status:** Not needed for mock mode  
**When needed:** Only if you want to test real OAuth flows

#### To Enable Real OAuth:

Create `.env` file with provider client IDs:

```bash
# packages/visual-studio/.env

# GitHub OAuth App
VITE_GITHUB_CLIENT_ID=your_github_client_id

# Google OAuth App
VITE_GOOGLE_CLIENT_ID=your_google_client_id

# Stripe Connect
VITE_STRIPE_CLIENT_ID=your_stripe_client_id

# ... etc for each provider you want to test
```

**Note:** You'll also need to register OAuth apps with each provider:
- GitHub: https://github.com/settings/developers
- Google: https://console.cloud.google.com
- Stripe: https://dashboard.stripe.com/settings/apps

### 🟢 Backend API URLs (Optional)

```bash
# Backend integration API (if you build one)
VITE_FORTISTATE_API_URL=http://localhost:3000/api

# Real-time collaboration WebSocket
VITE_FORTISTATE_COLLAB_WS_URL=ws://localhost:3001

# Auth bridge for session sync
VITE_FORTISTATE_AUTH_BRIDGE_URL=http://localhost:3000/auth
```

**Current behavior:** If not set, features gracefully degrade to local-only mode.

---

## Complete Environment Variables Reference

### Required ✅
```bash
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...     # Clerk authentication
```

### Optional - OAuth Providers 🔌
```bash
# Only needed if testing real OAuth flows (not mock mode)
VITE_OPENAI_CLIENT_ID=...
VITE_ANTHROPIC_CLIENT_ID=...
VITE_GITHUB_CLIENT_ID=...
VITE_GOOGLE_CLIENT_ID=...
VITE_SLACK_CLIENT_ID=...
VITE_STRIPE_CLIENT_ID=...
VITE_DROPBOX_CLIENT_ID=...
# ... (37 more providers)
```

### Optional - Mock Mode Control 🎭
```bash
VITE_MOCK_API=true                         # Force all APIs to mock mode
VITE_MOCK_INTEGRATIONS=true                # Force integrations to mock mode
VITE_MOCK_UNIVERSES=true                   # Force universes to mock mode
```

### Optional - Backend Services 🌐
```bash
VITE_FORTISTATE_API_URL=...                # Integration API backend
VITE_FORTISTATE_COLLAB_WS_URL=...          # Real-time collaboration
VITE_FORTISTATE_AUTH_BRIDGE_URL=...        # Session synchronization
```

---

## What Happens Without API Keys?

### Clerk Key Missing
```
❌ Error: "Missing Publishable Key"
→ App won't start
```

**Fix:** Add `VITE_CLERK_PUBLISHABLE_KEY` to `.env`

### OAuth Provider Keys Missing
```
✅ App works fine (uses mock mode)
→ Connections create simulated accounts
→ No real API calls made
```

**Result:** Everything works, just simulated

### Backend URLs Missing
```
✅ App works fine (local-only mode)
→ Data stored in browser
→ No server synchronization
→ Collaboration disabled
```

**Result:** Single-user local experience

---

## Development Workflow

### Scenario 1: Just Want to See the UI
```bash
# .env (minimal setup)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_key
```

**Result:** Full UI, mock data, no real API calls ✅

### Scenario 2: Test Real OAuth Flows
```bash
# .env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_key
VITE_GITHUB_CLIENT_ID=your_github_client_id
VITE_GOOGLE_CLIENT_ID=your_google_client_id
# ... register OAuth apps for providers you want to test
```

**Result:** Real OAuth redirects to GitHub/Google/etc ✅

### Scenario 3: Full Production Setup
```bash
# .env
VITE_CLERK_PUBLISHABLE_KEY=pk_live_your_key
VITE_FORTISTATE_API_URL=https://api.yourapp.com
VITE_FORTISTATE_COLLAB_WS_URL=wss://ws.yourapp.com

# All 43 provider OAuth client IDs
VITE_OPENAI_CLIENT_ID=...
VITE_GITHUB_CLIENT_ID=...
# ... etc
```

**Result:** Full production experience ✅

---

## FAQ

### Q: Do I need API keys for the 43 integrations?
**A:** Not for mock mode! The system automatically simulates connections. You only need provider API keys if you want to test real OAuth flows.

### Q: Will "Connect Account" work without keys?
**A:** Yes! It creates mock accounts instantly. The OAuth redirect code is in place but falls back to mock mode when no real client IDs are configured.

### Q: What about user API keys (like their OpenAI key)?
**A:** Users provide their own API keys when connecting accounts via OAuth. Your app doesn't need shared API keys because each user uses their own credentials.

### Q: Can I run the app right now without any setup?
**A:** Almost! You just need Clerk authentication (`VITE_CLERK_PUBLISHABLE_KEY`). Everything else is optional.

---

## Security Notes

### ⚠️ Never Commit API Keys to Git

Create `.gitignore` entry:
```
# packages/visual-studio/.gitignore
.env
.env.local
.env.*.local
```

### ✅ Client IDs Are Safe
OAuth **client IDs** (not secrets) can be public:
- `VITE_GITHUB_CLIENT_ID` - safe to expose
- `VITE_GOOGLE_CLIENT_ID` - safe to expose

### 🔒 Client Secrets Stay on Backend
Never put these in frontend:
- ❌ `GITHUB_CLIENT_SECRET`
- ❌ `GOOGLE_CLIENT_SECRET`
- ❌ User access tokens

Backend handles token exchange using client secrets securely.

---

## Example `.env` File

```bash
# packages/visual-studio/.env

# ========================================
# REQUIRED - Clerk Authentication
# ========================================
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxx

# ========================================
# OPTIONAL - Mock Mode Control
# ========================================
# Uncomment to force mock mode even with backend URLs set
# VITE_MOCK_API=true
# VITE_MOCK_INTEGRATIONS=true

# ========================================
# OPTIONAL - Backend Services
# ========================================
# VITE_FORTISTATE_API_URL=http://localhost:3000/api
# VITE_FORTISTATE_COLLAB_WS_URL=ws://localhost:3001
# VITE_FORTISTATE_AUTH_BRIDGE_URL=http://localhost:3000/auth

# ========================================
# OPTIONAL - OAuth Provider Client IDs
# ========================================
# Only needed if testing real OAuth flows
# Register apps at each provider's developer console

# VITE_GITHUB_CLIENT_ID=your_github_client_id
# VITE_GOOGLE_CLIENT_ID=your_google_client_id
# VITE_SLACK_CLIENT_ID=your_slack_client_id
# VITE_STRIPE_CLIENT_ID=your_stripe_client_id
# ... (40 more providers as needed)
```

---

## Next Steps

1. **Get Clerk key** (5 minutes)
   - Sign up at https://clerk.com
   - Copy publishable key
   - Add to `.env`

2. **Run the app** (instant)
   ```bash
   npm run dev
   ```

3. **Optional: Test real OAuth** (per provider)
   - Register OAuth app with provider
   - Add client ID to `.env`
   - Test connection flow

---

## Summary: You're Good! ✅

**Bottom line:** Just add the Clerk key and you're ready to go. Everything else works in mock mode automatically!

```bash
# Minimum viable .env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
```

Happy coding! 🚀
