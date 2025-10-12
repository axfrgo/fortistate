# 🔐 User Authentication Flow - Visual Guide

## Quick Answer: YES ✅

**Each user signs in with their OWN account credentials to each external app (OpenAI, Slack, Twitter, etc.)**

---

## 🎬 Visual Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│                           👤 Alice (User 1)                            │
│                     Using FortiState Visual Studio                      │
│                                                                         │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 │ Clicks 🔗 "Connect Account"
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        Connection Center Modal                          │
│                                                                         │
│  Available Providers:                                                   │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │ 🤖 OpenAI ChatGPT          [Connect Account] ← Alice clicks     │   │
│  │ 💬 Slack                   [Connect Account]                    │   │
│  │ 🐦 Twitter/X               [Connect Account]                    │   │
│  │ 📸 Instagram               [Connect Account]                    │   │
│  └────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 │ System initiates OAuth flow
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         🌐 OpenAI Login Page                           │
│                    (Opens in new window/tab)                            │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │  Email:    [alice@company.com]                                 │   │
│  │  Password: [••••••••••••••]                                    │   │
│  │                                                                 │   │
│  │  ⚠️ Alice enters HER OpenAI credentials                        │   │
│  │  ⚠️ NOT a shared account                                       │   │
│  │  ⚠️ NOT fortistate's API key                                   │   │
│  │                                                                 │   │
│  │            [Sign In]                                            │   │
│  └───────────────────────────────────────────────────────────────┘   │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 │ Alice authenticated
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      OpenAI Authorization Page                          │
│                                                                         │
│  FortiState is requesting access to:                                    │
│                                                                         │
│  ✓ Read your AI models                                                 │
│  ✓ Generate content on your behalf                                     │
│  ✓ Use your API quota                                                  │
│                                                                         │
│  ⚠️ This will use ALICE'S OpenAI account                               │
│  ⚠️ Usage charged to ALICE'S payment method                            │
│  ⚠️ API calls count against ALICE'S quota                              │
│                                                                         │
│              [Deny]    [Authorize] ← Alice clicks                       │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 │ OpenAI issues Alice's tokens
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    Tokens Returned to FortiState                        │
│                                                                         │
│  {                                                                      │
│    accessToken: "ya29.a0AfB_ALICE_TOKEN_XYZ",                          │
│    refreshToken: "1//09ALICE_REFRESH_ABC",                             │
│    expiresIn: 3600,                                                     │
│    scope: "models.read responses.write",                               │
│    userId: "alice@company.com"  ← Identifies Alice                     │
│  }                                                                      │
│                                                                         │
│  ⚠️ These tokens belong to ALICE                                       │
│  ⚠️ Only Alice can use them                                            │
│  ⚠️ Other users cannot access them                                     │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 │ Tokens stored in Alice's account
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                   IntegrationAccount Created                            │
│                    (Stored in FortiState)                               │
│                                                                         │
│  {                                                                      │
│    id: "acct-alice-openai-001",                                        │
│    userId: "user-alice-123",  ← Links to Alice                         │
│    providerId: "openai-chatgpt",                                       │
│    displayName: "Alice's OpenAI",                                      │
│    status: "connected",                                                 │
│    credentials: {                                                       │
│      accessToken: "ya29.a0AfB_ALICE_TOKEN_XYZ",                        │
│      refreshToken: "1//09ALICE_REFRESH_ABC",                           │
│      tokenExpiresAt: "2025-10-11T11:30:00Z"                            │
│    },                                                                   │
│    scopes: ["models.read", "responses.write"],                         │
│    connectedAt: "2025-10-11T10:30:00Z"                                 │
│  }                                                                      │
│                                                                         │
│  ✅ Account connected to Alice                                         │
│  ✅ Credentials isolated to Alice                                      │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 │ Alice binds account to nodes
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        Universe Execution                               │
│                                                                         │
│  Node: "Generate Blog Post"                                            │
│  Binding: Use "Alice's OpenAI" account                                 │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────┐     │
│  │  const account = getAccount("acct-alice-openai-001")         │     │
│  │  const token = account.credentials.accessToken               │     │
│  │                                                               │     │
│  │  fetch('https://api.openai.com/v1/chat/completions', {       │     │
│  │    headers: {                                                 │     │
│  │      'Authorization': `Bearer ${token}`  ← Alice's token     │     │
│  │    },                                                         │     │
│  │    body: JSON.stringify({ prompt: "..." })                   │     │
│  │  })                                                           │     │
│  └──────────────────────────────────────────────────────────────┘     │
│                                                                         │
│  ⚠️ API call made AS Alice                                             │
│  ⚠️ OpenAI sees: alice@company.com                                     │
│  ⚠️ Usage deducted from Alice's quota                                  │
│  ⚠️ Billing charged to Alice's payment method                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 👥 Multi-User Example

### Scenario: Alice, Bob, and Carol all use FortiState

```
┌───────────────────────────────────────────────────────────────────────┐
│                                                                       │
│  👤 Alice                    👤 Bob                    👤 Carol       │
│  ├─ OpenAI Account          ├─ OpenAI Account         ├─ OpenAI      │
│  │  alice@company.com       │  bob@freelance.com      │  carol@co.uk │
│  │  Token: AAA...           │  Token: BBB...          │  Token: CCC.. │
│  │                          │                         │               │
│  ├─ Slack Account           ├─ Slack Account          └─ Slack        │
│  │  alice-workspace         │  bob-team                  carol-ws     │
│  │  Token: AAA-slack...     │  Token: BBB-slack...       Token: CCC-s │
│  │                          │                                         │
│  └─ Twitter Account         └─ Twitter Account                        │
│     @alice_writes              @bob_codes                             │
│     Token: AAA-tw...           Token: BBB-tw...                       │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘

When executing universes:

Alice's universe → Uses AAA tokens (her accounts)
  ↓
  API calls to OpenAI: alice@company.com
  API calls to Slack: alice-workspace
  API calls to Twitter: @alice_writes

Bob's universe → Uses BBB tokens (his accounts)
  ↓
  API calls to OpenAI: bob@freelance.com
  API calls to Slack: bob-team
  API calls to Twitter: @bob_codes

Carol's universe → Uses CCC tokens (her accounts)
  ↓
  API calls to OpenAI: carol@co.uk
  API calls to Slack: carol-ws
```

**Result:**
- ✅ Alice pays for her OpenAI usage
- ✅ Bob pays for his OpenAI usage
- ✅ Carol pays for her OpenAI usage
- ✅ No cross-user credential access
- ✅ Complete isolation and privacy

---

## 🔒 What This Means for Security

### ✅ Secure (User-Specific Authentication):
```
User → OAuth → Provider → User's Token → Stored with UserId
```

Each user's credentials are:
- **Isolated:** Only accessible to that user
- **Attributable:** API calls traceable to the user
- **Billable:** Charges go to the user's payment method
- **Revocable:** User can disconnect anytime

### ❌ Insecure (Would be Shared Key - NOT WHAT WE DO):
```
FortiState → Single API Key → Used by All Users
```

This would mean:
- ❌ All users share one account
- ❌ Usage pooled together
- ❌ No user attribution
- ❌ FortiState pays for everything
- ❌ Security nightmare

**⚠️ We DO NOT do this! Each user authenticates individually.**

---

## 🎯 How It Works in Code

### 1. User Connects Account

```typescript
// ConnectionCenter.tsx
const handleConnectAccount = async (provider: IntegrationProviderMeta) => {
  // Initiates OAuth flow specific to THIS USER
  await integrationActions.connectAccount(provider.id)
  
  // Under the hood:
  // 1. Opens provider's login page
  // 2. User enters THEIR credentials
  // 3. Provider returns THEIR tokens
  // 4. Tokens stored with userId
}
```

### 2. Account Stored Per User

```typescript
// integrationStore.ts
const account: IntegrationAccount = {
  id: "acct-123",
  userId: currentUser.id,  // ← Links to specific user
  providerId: "openai-chatgpt",
  credentials: {
    accessToken: "USER_SPECIFIC_TOKEN",  // ← Belongs to this user
    refreshToken: "USER_REFRESH_TOKEN"
  }
}
```

### 3. API Calls Use User's Token

```typescript
// ontogenesisEngine.ts
private async callOpenAI(settings, account, node, apiKey) {
  // apiKey comes from account.credentials
  // This is the USER'S API key, not a shared one
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    headers: {
      'Authorization': `Bearer ${apiKey}`  // ← User's token
      //                         ↑ From their OAuth flow
    }
  })
  
  // OpenAI sees this request as coming from the USER
  // Billing goes to the USER's account
  // Rate limits apply to the USER
}
```

### 4. Token Refresh Uses User's Refresh Token

```typescript
// ontogenesisEngine.ts
private async ensureValidToken(account: IntegrationAccount) {
  if (tokenExpiringSoon) {
    // Use the USER'S refresh token to get new access token
    const refreshed = await integrationActions.refreshAccount(account.id)
    
    // Backend calls provider:
    // POST provider.com/oauth/token
    // {
    //   refresh_token: "USER_REFRESH_TOKEN",  ← Their token
    //   grant_type: "refresh_token"
    // }
    
    return refreshed  // New tokens still belong to this user
  }
}
```

---

## ✅ Verification Points

### How to Confirm User-Specific Auth:

1. **Check Connection Center UI:**
   - Each user sees their own "Connected Accounts" list
   - No shared "System Account"

2. **Inspect IntegrationAccount Objects:**
   - Each has `userId` field linking to specific user
   - Credentials stored per account, not globally

3. **Monitor API Calls:**
   - Each call includes user-specific Bearer token
   - Provider logs show different user identities

4. **Check Billing:**
   - Each external provider bills the token owner
   - Alice's OpenAI bill ≠ Bob's OpenAI bill

5. **Test Token Refresh:**
   - Refresh uses individual user's refresh token
   - New token still belongs to same user

---

## 🎉 Summary

### **YES - Users Sign In With Their Own Accounts**

✅ **Each user authenticates individually:**
- Alice logs into OpenAI with alice@company.com
- Bob logs into OpenAI with bob@freelance.com
- Carol logs into OpenAI with carol@co.uk

✅ **Tokens are user-specific:**
- Alice's tokens stored in Alice's IntegrationAccount
- Bob's tokens stored in Bob's IntegrationAccount
- No credential sharing

✅ **API calls attributed to user:**
- Alice's universe makes calls as Alice
- Bob's universe makes calls as Bob
- Provider sees individual user identity

✅ **Billing separated:**
- Alice pays for her usage
- Bob pays for his usage
- FortiState doesn't pay for user API calls

✅ **Security guaranteed:**
- Complete user isolation
- No cross-user access
- OAuth 2.0 standard compliance

---

**Authentication Model:** ✅ User-Specific OAuth  
**Credential Isolation:** ✅ Per-User Storage  
**API Attribution:** ✅ Traceable to User  
**Billing Model:** ✅ User Pays Their Own Usage

**Last Updated:** October 11, 2025  
**Status:** Production Ready with Proper User Authentication
