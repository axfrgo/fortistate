# External App Integration Implementation Guide

## Overview
This guide explains how to implement real API calls for external providers in the Visual Studio execution engine. The framework is already in place—this document shows where to add the actual API logic.

## Architecture

### Execution Flow
1. User creates nodes and attaches integration bindings
2. User launches universe via Go-Live orchestration
3. Execution engine (`ontogenesisEngine.ts`) processes nodes in topological order
4. For each node, engine resolves bindings and calls `executeNodeBindings()`
5. Bindings are sorted by priority and executed sequentially
6. Each binding calls `callExternalAPI()` which routes to provider-specific handlers
7. Results are captured in `externalCalls` array and logged to narrative

### Key Files
- **`packages/visual-studio/src/ontogenesisEngine.ts`** - Execution engine with external app calls
- **`packages/visual-studio/src/integrations/integrationStore.ts`** - Provider/account/binding state
- **`packages/visual-studio/src/integrations/types.ts`** - Type definitions
- **`packages/visual-studio/src/components/NodeEditor.tsx`** - UI for binding configuration

## Provider-Specific Implementation

### 1. OpenAI Integration

**Location:** `ontogenesisEngine.ts` → `callOpenAI()`

**Current State:** Mock implementation  
**Required:** Actual API call to OpenAI

```typescript
private async callOpenAI(
  capabilityId: string,
  settings: Record<string, unknown>,
  account: IntegrationAccount,
  node: Node
): Promise<any> {
  // Capability routing
  switch (capabilityId) {
    case 'chat-completion':
      return await this.openaiChatCompletion(settings, account, node)
    case 'embedding':
      return await this.openaiEmbedding(settings, account, node)
    case 'image-generation':
      return await this.openaiImageGeneration(settings, account, node)
    default:
      throw new Error(`Unknown OpenAI capability: ${capabilityId}`)
  }
}

private async openaiChatCompletion(
  settings: Record<string, unknown>,
  account: IntegrationAccount,
  node: Node
): Promise<any> {
  const prompt = (settings.promptTemplate as string) || node.data.narrative || 'Hello!'
  const model = (settings.model as string) || 'gpt-4'
  const maxTokens = (settings.maxTokens as number) || 150

  // Get API key from account (stored securely)
  const apiKey = account.credentials?.apiKey as string
  if (!apiKey) {
    throw new Error('OpenAI API key not found in account')
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`)
  }

  return await response.json()
}
```

**Required Settings:**
- `promptTemplate`: Template string (can reference node.data fields)
- `model`: `gpt-4`, `gpt-4-turbo`, `gpt-3.5-turbo`
- `maxTokens`: Number (default 150)
- `temperature`: Number 0-2 (default 1)

**Account Credentials:**
- `apiKey`: OpenAI API key

---

### 2. Anthropic (Claude) Integration

**Location:** `ontogenesisEngine.ts` → `callAnthropic()`

```typescript
private async callAnthropic(
  capabilityId: string,
  settings: Record<string, unknown>,
  account: IntegrationAccount,
  node: Node
): Promise<any> {
  switch (capabilityId) {
    case 'chat':
      return await this.anthropicChat(settings, account, node)
    default:
      throw new Error(`Unknown Anthropic capability: ${capabilityId}`)
  }
}

private async anthropicChat(
  settings: Record<string, unknown>,
  account: IntegrationAccount,
  node: Node
): Promise<any> {
  const prompt = (settings.promptTemplate as string) || node.data.narrative || 'Hello!'
  const model = (settings.model as string) || 'claude-3-sonnet-20240229'
  const maxTokens = (settings.maxTokens as number) || 1024

  const apiKey = account.credentials?.apiKey as string
  if (!apiKey) {
    throw new Error('Anthropic API key not found')
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Anthropic API error: ${error.error?.message || response.statusText}`)
  }

  return await response.json()
}
```

**Required Settings:**
- `promptTemplate`: Template string
- `model`: `claude-3-opus`, `claude-3-sonnet`, `claude-3-haiku`
- `maxTokens`: Number (default 1024)

**Account Credentials:**
- `apiKey`: Anthropic API key

---

### 3. Slack Integration

**Location:** `ontogenesisEngine.ts` → `callSlack()`

```typescript
private async callSlack(
  capabilityId: string,
  settings: Record<string, unknown>,
  account: IntegrationAccount,
  node: Node
): Promise<any> {
  switch (capabilityId) {
    case 'post-message':
      return await this.slackPostMessage(settings, account, node)
    case 'schedule-message':
      return await this.slackScheduleMessage(settings, account, node)
    default:
      throw new Error(`Unknown Slack capability: ${capabilityId}`)
  }
}

private async slackPostMessage(
  settings: Record<string, unknown>,
  account: IntegrationAccount,
  node: Node
): Promise<any> {
  const channel = settings.channel as string
  const message = (settings.messageTemplate as string) || node.data.narrative || 'Hello from Fortistate!'

  const accessToken = account.credentials?.accessToken as string
  if (!accessToken) {
    throw new Error('Slack access token not found')
  }

  if (!channel) {
    throw new Error('Slack channel ID required')
  }

  const response = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      channel,
      text: message,
      mrkdwn: true,
    }),
  })

  const result = await response.json()
  
  if (!result.ok) {
    throw new Error(`Slack API error: ${result.error}`)
  }

  return result
}
```

**Required Settings:**
- `channel`: Slack channel ID (e.g., `C01234ABCDE`)
- `messageTemplate`: Message text (supports Slack markdown)

**Account Credentials:**
- `accessToken`: OAuth access token (from OAuth flow)
- `teamId`: Slack workspace ID

**Token Refresh:**
Slack tokens don't expire, but check `account.tokenExpiresAt` for other providers

---

### 4. Twitter/X Integration

**Location:** `ontogenesisEngine.ts` → `callTwitter()`

```typescript
private async callTwitter(
  capabilityId: string,
  settings: Record<string, unknown>,
  account: IntegrationAccount,
  node: Node
): Promise<any> {
  switch (capabilityId) {
    case 'post-tweet':
      return await this.twitterPostTweet(settings, account, node)
    case 'schedule-tweet':
      return await this.twitterScheduleTweet(settings, account, node)
    default:
      throw new Error(`Unknown Twitter capability: ${capabilityId}`)
  }
}

private async twitterPostTweet(
  settings: Record<string, unknown>,
  account: IntegrationAccount,
  node: Node
): Promise<any> {
  const tweetText = (settings.tweetTemplate as string) || node.data.narrative || 'Hello from Fortistate!'

  const accessToken = account.credentials?.accessToken as string
  const accessSecret = account.credentials?.accessTokenSecret as string

  if (!accessToken || !accessSecret) {
    throw new Error('Twitter OAuth credentials not found')
  }

  // Twitter uses OAuth 1.0a, so you'll need to sign the request
  // Consider using a library like `oauth-1.0a` or `twitter-api-v2`
  
  const response = await fetch('https://api.twitter.com/2/tweets', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`, // Simplified; OAuth 1.0a signing required
    },
    body: JSON.stringify({
      text: tweetText,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Twitter API error: ${error.detail || response.statusText}`)
  }

  return await response.json()
}
```

**Required Settings:**
- `tweetTemplate`: Tweet text (max 280 characters)
- `mediaUrls`: Optional array of image/video URLs

**Account Credentials:**
- `accessToken`: OAuth 1.0a access token
- `accessTokenSecret`: OAuth 1.0a secret
- `userId`: Twitter user ID

**Note:** Twitter API requires OAuth 1.0a signing. Consider using `twitter-api-v2` npm package.

---

### 5. Instagram Integration

**Location:** `ontogenesisEngine.ts` → `callInstagram()`

```typescript
private async callInstagram(
  capabilityId: string,
  settings: Record<string, unknown>,
  account: IntegrationAccount,
  node: Node
): Promise<any> {
  switch (capabilityId) {
    case 'post-media':
      return await this.instagramPostMedia(settings, account, node)
    case 'post-story':
      return await this.instagramPostStory(settings, account, node)
    default:
      throw new Error(`Unknown Instagram capability: ${capabilityId}`)
  }
}

private async instagramPostMedia(
  settings: Record<string, unknown>,
  account: IntegrationAccount,
  node: Node
): Promise<any> {
  const caption = (settings.captionTemplate as string) || node.data.narrative
  const imageUrl = settings.imageUrl as string

  const accessToken = account.credentials?.accessToken as string
  const igUserId = account.credentials?.igUserId as string

  if (!accessToken || !igUserId) {
    throw new Error('Instagram access token or user ID not found')
  }

  if (!imageUrl) {
    throw new Error('Instagram image URL required')
  }

  // Step 1: Create media container
  const containerResponse = await fetch(
    `https://graph.facebook.com/v18.0/${igUserId}/media`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_url: imageUrl,
        caption,
        access_token: accessToken,
      }),
    }
  )

  const containerResult = await containerResponse.json()
  
  if (containerResult.error) {
    throw new Error(`Instagram API error: ${containerResult.error.message}`)
  }

  const creationId = containerResult.id

  // Step 2: Publish the media
  const publishResponse = await fetch(
    `https://graph.facebook.com/v18.0/${igUserId}/media_publish`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creation_id: creationId,
        access_token: accessToken,
      }),
    }
  )

  const publishResult = await publishResponse.json()

  if (publishResult.error) {
    throw new Error(`Instagram publish error: ${publishResult.error.message}`)
  }

  return publishResult
}
```

**Required Settings:**
- `captionTemplate`: Post caption text
- `imageUrl`: Publicly accessible image URL
- `videoUrl`: Publicly accessible video URL (for video posts)

**Account Credentials:**
- `accessToken`: Facebook/Instagram OAuth token
- `igUserId`: Instagram Business Account ID
- `fbPageId`: Connected Facebook Page ID

**Token Refresh:**
Instagram tokens expire. Check `account.tokenExpiresAt` and refresh if needed.

---

## OAuth Token Refresh

Add token refresh logic to handle expired credentials:

```typescript
private async refreshTokenIfNeeded(account: IntegrationAccount): Promise<IntegrationAccount> {
  if (!account.tokenExpiresAt) {
    return account // Token doesn't expire
  }

  const expiresAt = new Date(account.tokenExpiresAt).getTime()
  const now = Date.now()
  const bufferMs = 5 * 60 * 1000 // Refresh 5 minutes before expiry

  if (now < expiresAt - bufferMs) {
    return account // Token still valid
  }

  // Call refresh endpoint
  const refreshToken = account.credentials?.refreshToken as string
  if (!refreshToken) {
    throw new Error('Refresh token not available')
  }

  // Provider-specific refresh logic
  switch (account.providerId) {
    case 'openai':
      // OpenAI keys don't expire
      return account
    
    case 'slack':
      // Slack tokens don't expire
      return account
    
    case 'instagram':
      return await this.refreshFacebookToken(account, refreshToken)
    
    default:
      throw new Error(`Token refresh not implemented for ${account.providerId}`)
  }
}

private async refreshFacebookToken(
  account: IntegrationAccount,
  refreshToken: string
): Promise<IntegrationAccount> {
  // Call your backend refresh endpoint
  const response = await fetch('/api/integrations/refresh-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      accountId: account.id,
      refreshToken,
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to refresh token')
  }

  const refreshed = await response.json()
  
  // Update account in store
  await integrationActions.updateAccount(account.id, {
    credentials: {
      ...account.credentials,
      accessToken: refreshed.accessToken,
    },
    tokenExpiresAt: refreshed.expiresAt,
  })

  return integrationSelectors.getAccount(account.id)!
}
```

---

## Template Variable Substitution

Enhance prompt/message templates with variable substitution:

```typescript
private substituteVariables(template: string, node: Node, context: Record<string, any>): string {
  let result = template

  // Replace {{node.field}} variables
  result = result.replace(/\{\{node\.(\w+)\}\}/g, (match, field) => {
    return node.data[field] ?? match
  })

  // Replace {{context.field}} variables
  result = result.replace(/\{\{context\.(\w+)\}\}/g, (match, field) => {
    return context[field] ?? match
  })

  // Replace {{env.VAR}} environment variables
  result = result.replace(/\{\{env\.(\w+)\}\}/g, (match, varName) => {
    return import.meta.env[`VITE_${varName}`] ?? match
  })

  return result
}

// Usage in API calls:
const prompt = this.substituteVariables(
  settings.promptTemplate as string,
  node,
  { timestamp: new Date().toISOString(), universeId: this.universeId }
)
```

---

## Error Handling & Retries

Add retry logic for transient failures:

```typescript
private async callWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | undefined

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      
      // Don't retry on auth errors
      if (lastError.message.includes('401') || lastError.message.includes('403')) {
        throw lastError
      }

      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delayMs * attempt))
      }
    }
  }

  throw lastError!
}

// Usage:
const response = await this.callWithRetry(() => 
  this.openaiChatCompletion(settings, account, node)
)
```

---

## Rate Limiting

Implement rate limiting to respect API quotas:

```typescript
private rateLimiters = new Map<string, {
  tokens: number
  lastRefill: number
  maxTokens: number
  refillRate: number // tokens per second
}>()

private async waitForRateLimit(providerId: string): Promise<void> {
  if (!this.rateLimiters.has(providerId)) {
    // Initialize rate limiter (example: 10 requests per second)
    this.rateLimiters.set(providerId, {
      tokens: 10,
      lastRefill: Date.now(),
      maxTokens: 10,
      refillRate: 10,
    })
  }

  const limiter = this.rateLimiters.get(providerId)!
  const now = Date.now()
  const elapsed = (now - limiter.lastRefill) / 1000

  // Refill tokens
  limiter.tokens = Math.min(
    limiter.maxTokens,
    limiter.tokens + elapsed * limiter.refillRate
  )
  limiter.lastRefill = now

  // Wait if no tokens available
  if (limiter.tokens < 1) {
    const waitMs = ((1 - limiter.tokens) / limiter.refillRate) * 1000
    await new Promise(resolve => setTimeout(resolve, waitMs))
    limiter.tokens = 1
  }

  limiter.tokens -= 1
}

// Usage in callExternalAPI:
await this.waitForRateLimit(provider.id)
const response = await this.callOpenAI(...)
```

---

## Testing

Test each provider integration independently:

```typescript
// Create a test file: ontogenesisEngine.test.ts
import { describe, it, expect } from 'vitest'
import { VisualStudioExecutionEngine } from './ontogenesisEngine'

describe('External App Integration', () => {
  it('should call OpenAI successfully', async () => {
    const engine = new VisualStudioExecutionEngine()
    const nodes = [{
      id: 'test-node',
      type: 'begin',
      data: { entity: 'test', narrative: 'Generate a greeting' },
      position: { x: 0, y: 0 }
    }]
    
    // Mock integration store to return test binding
    const result = await engine.execute(nodes, [])
    
    expect(result.externalCalls).toHaveLength(1)
    expect(result.externalCalls[0].status).toBe('success')
  })
})
```

---

## Deployment Checklist

Before going live:
- [ ] Add all provider API keys to environment variables
- [ ] Implement OAuth token refresh logic
- [ ] Add rate limiting for each provider
- [ ] Implement retry logic with exponential backoff
- [ ] Add comprehensive error logging
- [ ] Test each provider integration end-to-end
- [ ] Add monitoring/alerting for failed calls
- [ ] Document rate limits and quotas for each provider
- [ ] Implement cost tracking for paid APIs
- [ ] Add user-facing error messages

---

## Next Steps

1. **Choose a provider to start with** (recommend Slack for simplicity)
2. **Implement the real API call** in the provider-specific method
3. **Test with a real account** connected via Connection Center
4. **Add error handling** specific to that provider's API
5. **Repeat for other providers**

The framework is ready—just replace the mock responses with real API calls!
