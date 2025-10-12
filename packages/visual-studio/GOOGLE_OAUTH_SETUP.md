# Google OAuth Setup - Quick Guide

## What You're Seeing

When you click "Connect" on Gmail (or any Google service) **without a client ID configured**, the system automatically creates a **demo/mock account** so you can test the UI.

**To enable REAL Gmail OAuth** where it redirects you to Google's authorization page, follow these steps:

---

## 🚀 Quick Setup (10 minutes)

### Step 1: Go to Google Cloud Console

Visit: **https://console.cloud.google.com**

### Step 2: Create a Project (or select existing)

1. Click the project dropdown at the top
2. Click "New Project"
3. Name it: `FortiState` (or any name you like)
4. Click "Create"

### Step 3: Enable Gmail API

1. Go to **"APIs & Services"** → **"Library"**
2. Search for: `Gmail API`
3. Click on it and click **"Enable"**
4. While you're here, also enable:
   - Google Drive API
   - Google Calendar API
   - Google Docs API
   - Google Sheets API
   (You can do this now or later - they all use the same OAuth client)

### Step 4: Configure OAuth Consent Screen

1. Go to **"APIs & Services"** → **"OAuth consent screen"**
2. Choose **"External"** (allows any Google account to connect)
3. Fill in required fields:
   - **App name**: `FortiState Visual Studio`
   - **User support email**: Your email
   - **Developer contact email**: Your email
4. Click **"Save and Continue"**
5. **Scopes** - Add these scopes:
   - `https://www.googleapis.com/auth/gmail.send`
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/drive.file`
   - `https://www.googleapis.com/auth/calendar`
   - (Or click "Add or Remove Scopes" and search for Gmail, Drive, Calendar)
6. Click **"Save and Continue"**
7. **Test users** - Add your Gmail address for testing
8. Click **"Save and Continue"**

### Step 5: Create OAuth Client ID

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"+ Create Credentials"** → **"OAuth client ID"**
3. Application type: **Web application**
4. Name: `FortiState Visual Studio`
5. **Authorized redirect URIs** - Click **"+ Add URI"** and add:
   ```
   http://localhost:5173/oauth/callback
   ```
6. Click **"Create"**

### Step 6: Copy Your Client ID

You'll see a popup with:
- **Client ID**: `1234567890-abcdefghijk.apps.googleusercontent.com`
- **Client Secret**: (you don't need this for frontend)

**Copy the Client ID!**

### Step 7: Add to Your `.env` File

Open `packages/visual-studio/.env` and paste your Client ID:

```bash
# Google OAuth - Use the SAME client ID for all Google services
VITE_GMAIL_CLIENT_ID=1234567890-abcdefghijk.apps.googleusercontent.com
VITE_GOOGLE_DRIVE_CLIENT_ID=1234567890-abcdefghijk.apps.googleusercontent.com
VITE_GOOGLE_CALENDAR_CLIENT_ID=1234567890-abcdefghijk.apps.googleusercontent.com
VITE_GOOGLE_DOCS_CLIENT_ID=1234567890-abcdefghijk.apps.googleusercontent.com
VITE_GOOGLE_SHEETS_CLIENT_ID=1234567890-abcdefghijk.apps.googleusercontent.com
```

**Note:** You can use the same client ID for all Google services!

### Step 8: Restart Dev Server

```bash
# Stop the current server (Ctrl+C)
npm run dev
```

### Step 9: Test Real OAuth!

1. Open Visual Studio in browser
2. Click 🔌 Connection Center
3. Click **"Connect account"** on Gmail
4. **You should now be redirected to Google's authorization page!** ✅
5. Log in with your Google account
6. Approve the permissions
7. You'll be redirected back to FortiState
8. Success! Real Gmail account connected! 🎉

---

## 🔍 How to Tell If It's Working

### Demo Mode (No Client ID) ❌
```
Console shows:
[Integrations] ⚠️ No OAuth client ID found for gmail
[Integrations] Set VITE_GMAIL_CLIENT_ID in .env to enable real OAuth
[Integrations] Falling back to mock account creation

→ Account created instantly (no redirect)
→ Account notice: "Demo mode: Set VITE_GMAIL_CLIENT_ID for real OAuth"
```

### Real OAuth Mode (Client ID Configured) ✅
```
Console shows:
[Integrations] 🚀 Initiating real OAuth flow for: Gmail
[Integrations] Authorization URL: https://accounts.google.com/o/oauth2/v2/auth?...
[Integrations] Client ID: 1234567890-abc...apps.googleusercontent.com
[Integrations] Redirect URI: http://localhost:5173/oauth/callback

→ Browser redirects to Google's login page
→ You log in with YOUR Google credentials
→ Google asks you to authorize FortiState
→ You approve and get redirected back
→ Real account created with authorization code
```

---

## 🐛 Troubleshooting

### Issue: "Redirect URI Mismatch"

**Cause:** The callback URL doesn't match what you configured in Google Console

**Fix:**
1. Go to Google Cloud Console → Credentials → Your OAuth Client
2. Make sure Authorized redirect URIs includes **exactly**:
   ```
   http://localhost:5173/oauth/callback
   ```
3. No trailing slashes, must match exactly

### Issue: "App is not verified"

**Cause:** Your app is in testing mode

**Fix:** This is normal for development! Just click "Advanced" → "Go to FortiState (unsafe)" during testing.

For production, you'll need to submit for Google verification.

### Issue: "Access blocked: This app's request is invalid"

**Cause:** Missing required fields in OAuth consent screen or scopes

**Fix:**
1. Check OAuth consent screen has all required fields
2. Make sure you added Gmail API scopes
3. Add yourself as a test user

### Issue: Still creating mock accounts

**Cause:** Client ID not loaded or dev server not restarted

**Fix:**
1. Check `.env` file has the client ID
2. Make sure variable name is exactly: `VITE_GMAIL_CLIENT_ID`
3. Restart dev server: `npm run dev`
4. Hard refresh browser: `Ctrl+Shift+R`

---

## 📊 What You Get With Real OAuth

### Before (Demo Mode)
- ❌ Instant connection (no authorization)
- ❌ No real credentials
- ❌ Can't actually send emails
- ❌ Mock data only

### After (Real OAuth) ✅
- ✅ Redirects to Google's authorization page
- ✅ User logs in with their Google account
- ✅ User explicitly authorizes FortiState
- ✅ Real OAuth authorization code received
- ✅ Can actually use Gmail API (after backend token exchange)
- ✅ Each user uses their own Gmail account

---

## 🎯 Quick Reference

```bash
# Your .env file should look like this:

VITE_CLERK_PUBLISHABLE_KEY=pk_test_bWludC1uZXd0LTI5LmNsZXJrLmFjY291bnRzLmRldiQ

VITE_GITHUB_CLIENT_ID=Ov23li1234567890

# All Google services use the SAME client ID
VITE_GMAIL_CLIENT_ID=1234567890-abc...apps.googleusercontent.com
VITE_GOOGLE_DRIVE_CLIENT_ID=1234567890-abc...apps.googleusercontent.com
VITE_GOOGLE_CALENDAR_CLIENT_ID=1234567890-abc...apps.googleusercontent.com
VITE_GOOGLE_DOCS_CLIENT_ID=1234567890-abc...apps.googleusercontent.com
VITE_GOOGLE_SHEETS_CLIENT_ID=1234567890-abc...apps.googleusercontent.com
```

Then restart: `npm run dev`

---

## 🔗 Useful Links

- **Google Cloud Console**: https://console.cloud.google.com
- **OAuth Consent Screen**: https://console.cloud.google.com/apis/credentials/consent
- **Credentials**: https://console.cloud.google.com/apis/credentials
- **API Library**: https://console.cloud.google.com/apis/library

---

## ✨ Pro Tip

The **same OAuth client** works for all Google services (Gmail, Drive, Calendar, Docs, Sheets, etc.). You only need to:
1. Create ONE OAuth client
2. Enable the APIs you want to use
3. Use the same client ID for all `VITE_GOOGLE_*` variables

This saves time and keeps things simple!

---

## 🎉 You're Almost There!

Just follow the steps above, get your Google Client ID, add it to `.env`, restart the server, and you'll have real Google OAuth working in minutes!

**The system is designed to work seamlessly in both modes:**
- **No client ID?** → Demo mode (great for UI testing)
- **Client ID configured?** → Real OAuth (production-ready)

Choose what works best for your current needs! 🚀
