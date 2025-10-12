# Real OAuth Setup Guide - Connect Your Actual Accounts!

## Overview

This guide shows you how to enable **real OAuth authentication** so users can connect their actual GitHub, Google, Stripe, etc. accounts in FortiState Visual Studio and use them in their workflows.

---

## 🚀 Quick Start

### Step 1: Choose Providers to Enable

You don't need to set up all 43 providers! Start with the ones you need:

**Popular choices:**
- 🐙 **GitHub** - Code repositories, issues, workflows
- 📧 **Gmail** - Email automation
- 💳 **Stripe** - Payments and subscriptions
- 💬 **Slack** - Team notifications
- 📅 **Google Calendar** - Schedule events

### Step 2: Register OAuth Apps

For each provider, you'll register an OAuth application and get a **Client ID** (public) and **Client Secret** (keep private).

### Step 3: Add Client IDs to `.env`

```bash
# packages/visual-studio/.env

# Clerk (Required for authentication)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_key

# OAuth Providers (Add as needed)
VITE_GITHUB_CLIENT_ID=your_github_client_id
VITE_GMAIL_CLIENT_ID=your_google_client_id
VITE_STRIPE_CLIENT_ID=your_stripe_client_id
```

### Step 4: Restart Dev Server

```bash
npm run dev
```

**Done!** Users can now connect their real accounts! 🎉

---

## 📋 Provider-Specific Setup Guides

### 1. GitHub OAuth App Setup

**Use case:** Access repos, create issues, trigger workflows

**Steps:**

1. **Go to GitHub Developer Settings**
   - Visit: https://github.com/settings/developers
   - Click "New OAuth App"

2. **Fill in Application Details**
   ```
   Application name: FortiState Visual Studio
   Homepage URL: http://localhost:5173
   Authorization callback URL: http://localhost:5173/oauth/callback
   ```

3. **Get Your Credentials**
   - After creating, you'll see:
     - **Client ID** (public, safe to expose): `Ov23li...`
     - **Client Secret** (keep private!): Click "Generate a new client secret"

4. **Add to `.env`**
   ```bash
   VITE_GITHUB_CLIENT_ID=Ov23li1234567890abcdef
   ```

5. **For Production**
   - Update Homepage URL to your domain
   - Update Callback URL to `https://yourdomain.com/oauth/callback`

**Scopes granted:** `repo`, `user`, `workflow`

---

### 2. Google OAuth Setup (Gmail, Calendar, Drive, etc.)

**Use case:** Gmail, Calendar, Drive, Docs, Sheets integration

**Steps:**

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com
   - Create a new project or select existing

2. **Enable APIs**
   - Go to "APIs & Services" → "Library"
   - Enable the APIs you need:
     - Gmail API
     - Google Calendar API
     - Google Drive API
     - Google Docs API
     - Google Sheets API

3. **Create OAuth Consent Screen**
   - Go to "APIs & Services" → "OAuth consent screen"
   - Choose "External" (for testing with any Google account)
   - Fill in app name, support email, developer email
   - Add scopes you need (e.g., Gmail, Calendar)

4. **Create OAuth Client ID**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: **Web application**
   - Name: `FortiState Visual Studio`
   - Authorized redirect URIs: `http://localhost:5173/oauth/callback`

5. **Get Your Credentials**
   - **Client ID**: `1234567890-abc...apps.googleusercontent.com`
   - **Client Secret**: Keep this secret!

6. **Add to `.env`**
   ```bash
   # Use the same client ID for all Google services
   VITE_GMAIL_CLIENT_ID=1234567890-abc...apps.googleusercontent.com
   VITE_GOOGLE_DRIVE_CLIENT_ID=1234567890-abc...apps.googleusercontent.com
   VITE_GOOGLE_CALENDAR_CLIENT_ID=1234567890-abc...apps.googleusercontent.com
   VITE_GOOGLE_DOCS_CLIENT_ID=1234567890-abc...apps.googleusercontent.com
   VITE_GOOGLE_SHEETS_CLIENT_ID=1234567890-abc...apps.googleusercontent.com
   ```

**Scopes configured in provider:**
- Gmail: `https://www.googleapis.com/auth/gmail.send`, `https://www.googleapis.com/auth/gmail.readonly`
- Calendar: `https://www.googleapis.com/auth/calendar`, `https://www.googleapis.com/auth/calendar.events`
- Drive: `https://www.googleapis.com/auth/drive.file`, `https://www.googleapis.com/auth/drive.readonly`

---

### 3. Slack OAuth App Setup

**Use case:** Send messages, post to channels, read workspace data

**Steps:**

1. **Go to Slack API**
   - Visit: https://api.slack.com/apps
   - Click "Create New App"
   - Choose "From scratch"

2. **Fill in App Details**
   ```
   App Name: FortiState
   Workspace: Select your workspace
   ```

3. **Configure OAuth & Permissions**
   - Go to "OAuth & Permissions"
   - Add Redirect URL: `http://localhost:5173/oauth/callback`
   - Add Bot Token Scopes:
     - `chat:write`
     - `channels:read`
     - `users:read`

4. **Get Your Credentials**
   - **Client ID**: Found in "App Credentials"
   - **Client Secret**: Also in "App Credentials"

5. **Add to `.env`**
   ```bash
   VITE_SLACK_CLIENT_ID=1234567890.1234567890
   ```

**Scopes:** `chat:write`, `channels:read`, `users:read`

---

### 4. Stripe Connect Setup

**Use case:** Process payments, manage subscriptions, payouts

**Steps:**

1. **Go to Stripe Dashboard**
   - Visit: https://dashboard.stripe.com
   - Go to "Settings" → "Connect"

2. **Enable Stripe Connect**
   - Click "Get started with Connect"
   - Choose "Standard" for basic OAuth

3. **Configure OAuth Settings**
   - Integration name: `FortiState`
   - Redirect URI: `http://localhost:5173/oauth/callback`

4. **Get Your Credentials**
   - **Client ID**: Found in Connect settings (starts with `ca_`)

5. **Add to `.env`**
   ```bash
   VITE_STRIPE_CLIENT_ID=ca_1234567890abcdef
   ```

**Scopes:** `read_write` (full access to connected account)

---

### 5. Twitter/X OAuth Setup

**Use case:** Post tweets, read timeline, manage profile

**Steps:**

1. **Go to Twitter Developer Portal**
   - Visit: https://developer.twitter.com/en/portal/dashboard
   - Create a new app

2. **Configure App Settings**
   - App name: `FortiState`
   - Callback URL: `http://localhost:5173/oauth/callback`
   - Website: `http://localhost:5173`

3. **Enable OAuth 2.0**
   - Go to "User authentication settings"
   - Enable OAuth 2.0
   - Type: Web App
   - Add scopes: `tweet.read`, `tweet.write`, `users.read`

4. **Get Your Credentials**
   - **Client ID**: In app settings

5. **Add to `.env`**
   ```bash
   VITE_TWITTER_X_CLIENT_ID=your_twitter_client_id
   ```

---

### Quick Reference: All Provider Client ID Environment Variables

```bash
# AI Providers
VITE_OPENAI_CHATGPT_CLIENT_ID=
VITE_ANTHROPIC_CLAUDE_CLIENT_ID=
VITE_GOOGLE_GEMINI_CLIENT_ID=
VITE_XAI_GROK_CLIENT_ID=

# Google Workspace (use same Client ID for all)
VITE_GMAIL_CLIENT_ID=
VITE_GOOGLE_DRIVE_CLIENT_ID=
VITE_GOOGLE_DOCS_CLIENT_ID=
VITE_GOOGLE_SHEETS_CLIENT_ID=
VITE_GOOGLE_CALENDAR_CLIENT_ID=
VITE_GOOGLE_MEET_CLIENT_ID=
VITE_GOOGLE_SEARCH_CLIENT_ID=
VITE_GOOGLE_ANALYTICS_CLIENT_ID=

# Developer Tools
VITE_GITHUB_CLIENT_ID=
VITE_GITLAB_CLIENT_ID=
VITE_VERCEL_CLIENT_ID=

# Payments
VITE_STRIPE_CLIENT_ID=
VITE_PAYPAL_CLIENT_ID=

# Cloud Storage
VITE_DROPBOX_CLIENT_ID=
VITE_BOX_CLIENT_ID=

# Marketing
VITE_MAILCHIMP_CLIENT_ID=
VITE_SENDGRID_CLIENT_ID=
VITE_HUBSPOT_CLIENT_ID=

# Social Media
VITE_TWITTER_X_CLIENT_ID=
VITE_LINKEDIN_CLIENT_ID=
VITE_INSTAGRAM_BUSINESS_CLIENT_ID=
VITE_YOUTUBE_CLIENT_ID=

# Project Management
VITE_TRELLO_CLIENT_ID=
VITE_ASANA_CLIENT_ID=
VITE_JIRA_CLIENT_ID=
VITE_MONDAY_CLIENT_ID=

# Communication
VITE_SLACK_CLIENT_ID=
VITE_WHATSAPP_BUSINESS_CLIENT_ID=
VITE_ZOOM_CLIENT_ID=
VITE_DISCORD_CLIENT_ID=
VITE_TWILIO_CLIENT_ID=

# Analytics
VITE_MIXPANEL_CLIENT_ID=

# Databases
VITE_AIRTABLE_CLIENT_ID=
VITE_SUPABASE_CLIENT_ID=

# Notes
VITE_APPLE_NOTES_CLIENT_ID=
VITE_NOTION_CLIENT_ID=
VITE_EVERNOTE_CLIENT_ID=
```

---

## 🔐 Security Best Practices

### Client IDs vs Client Secrets

**Client IDs (VITE_* variables):**
- ✅ Safe to expose in frontend code
- ✅ Commit to public repos (if needed)
- ✅ Stored in `.env` for convenience

**Client Secrets:**
- ❌ NEVER expose in frontend
- ❌ NEVER commit to version control
- ✅ Only used on backend servers
- ✅ Stored in secure backend `.env`

### Why We Only Need Client IDs (For Now)

The current implementation:
1. ✅ User clicks "Connect Account"
2. ✅ Redirects to provider (GitHub, Google, etc.)
3. ✅ User logs in with THEIR credentials
4. ✅ Provider redirects back with authorization code
5. ✅ Code stored in FortiState account
6. ⏳ **Next step:** Backend exchanges code for tokens using Client Secret

### Setting Up Backend Token Exchange (Coming Soon)

When you're ready for full production:

```typescript
// Backend API endpoint (Node.js example)
app.post('/api/oauth/exchange', async (req, res) => {
  const { providerId, code, redirectUri } = req.body
  
  // Get provider config
  const provider = providers[providerId]
  
  // Exchange code for tokens using CLIENT SECRET (secure!)
  const tokenResponse = await fetch(provider.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env[`${providerId}_CLIENT_ID`],
      client_secret: process.env[`${providerId}_CLIENT_SECRET`], // Secret!
      code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    })
  })
  
  const tokens = await tokenResponse.json()
  
  // Store encrypted tokens in database
  await db.integrationAccounts.create({
    userId: req.user.id,
    providerId,
    accessToken: encrypt(tokens.access_token),
    refreshToken: encrypt(tokens.refresh_token),
    expiresAt: new Date(Date.now() + tokens.expires_in * 1000)
  })
  
  res.json({ success: true })
})
```

---

## 🧪 Testing Your OAuth Setup

### 1. Check Environment Variables

```bash
# List all VITE_ variables
npx cross-env-shell "node -e \"console.log(Object.keys(process.env).filter(k => k.startsWith('VITE_')))\""
```

### 2. Test OAuth Flow

1. Start dev server: `npm run dev`
2. Open Connection Center (🔌 icon)
3. Click "Connect account" on a provider you configured
4. Check browser console for logs:
   ```
   [Integrations] 🚀 Initiating real OAuth flow for: GitHub
   [Integrations] Authorization URL: https://github.com/login/oauth/authorize?...
   [Integrations] Client ID: Ov23li1234567890
   ```
5. You should be redirected to provider's login page
6. After authorizing, you'll be redirected back with a success message

### 3. Verify Connected Account

- Open Connection Center
- Should see your connected account with green "connected" status
- Account will have notice: "✅ Real OAuth connection established"

---

## 🐛 Troubleshooting

### Issue: "No OAuth client ID found for [provider]"

**Cause:** Client ID not set in `.env`

**Fix:**
```bash
# Add to .env
VITE_GITHUB_CLIENT_ID=your_actual_client_id
```

Then restart: `npm run dev`

### Issue: "State mismatch - possible CSRF attack"

**Cause:** Browser cache or multiple OAuth attempts

**Fix:**
1. Clear browser session storage
2. Try connecting again
3. Make sure you complete the OAuth flow (don't go back)

### Issue: Provider shows "Application not authorized"

**Cause:** Redirect URI mismatch

**Fix:**
- In provider's OAuth settings, ensure callback URL is **exactly**: `http://localhost:5173/oauth/callback`
- No trailing slashes
- Match protocol (http vs https)
- Match port number

### Issue: "Invalid client ID"

**Cause:** Wrong client ID format or expired app

**Fix:**
- Double-check client ID (copy/paste carefully)
- Ensure OAuth app still exists in provider dashboard
- Check for typos in `.env`

### Issue: Account connects but can't use API

**Cause:** Backend token exchange not implemented yet

**Fix:**
- Current implementation stores authorization code only
- Full API access requires backend to exchange code for access tokens
- See "Setting Up Backend Token Exchange" section above

---

## 📊 What You Get With Real OAuth

### Current Features ✅

- Real OAuth authorization flow
- CSRF protection (state parameter)
- Authorization codes stored securely
- User sees provider's actual consent screen
- Scopes properly requested
- Connected accounts displayed in Connection Center

### Coming Soon 🚧

- Backend token exchange
- Encrypted token storage
- Automatic token refresh
- Full API access in universe executions
- Rate limiting per user account
- Token revocation

---

## 🎯 Recommended Setup Order

**Start with these 3:**

1. **GitHub** - Easiest to set up, great for testing
2. **Gmail** - Common use case, one client ID for all Google services
3. **Slack** - Simple OAuth flow, useful for notifications

**Then add as needed:**

4. Stripe (if handling payments)
5. Twitter/X (if social media automation)
6. Others based on your users' needs

---

## 💡 Pro Tips

1. **Use Test/Development Apps First**
   - Most providers support separate dev/production apps
   - Test with dev credentials before going live

2. **Request Minimum Scopes**
   - Only request OAuth scopes you actually need
   - Users more likely to approve minimal permissions

3. **Set Up Verification**
   - For production, complete provider verification processes
   - Required for public apps (especially Google, Twitter)

4. **Monitor OAuth Logs**
   - Check browser console for detailed OAuth flow logs
   - All steps logged with emojis for easy debugging

5. **Update Redirect URIs for Production**
   - Remember to update callback URLs when deploying
   - `http://localhost:5173/oauth/callback` → `https://yourdomain.com/oauth/callback`

---

## 🚀 Ready to Go!

Once you've set up even ONE provider, users can:

1. Click "Connect Account" in Connection Center
2. Be redirected to the actual provider (GitHub, Google, etc.)
3. Log in with their real credentials
4. Authorize FortiState to access their data
5. Get redirected back with a real, working connection

**No more mock data - real OAuth, real accounts, real power!** ⚡

---

## Need Help?

- Check provider's OAuth documentation
- Look for "OAuth", "API Access", or "Developers" sections
- Most providers have detailed OAuth setup guides
- Feel free to start with just one provider and expand later!
