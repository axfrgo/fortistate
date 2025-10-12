import type { Node, Edge } from 'reactflow'
import { 
  BEGIN, 
  BECOME, 
  CEASE, 
  TRANSCEND,
  createFabric,
  type OntogeneticOp,
  type EntityState
} from '../../../src/ontogenesis/index.js'
import { integrationSelectors } from './integrations/integrationStore'
import type { IntegrationBinding, IntegrationAccount, IntegrationProviderMeta } from './integrations/types'

export interface ExecutionResult {
  narrative: string[]
  finalStates: Map<string, EntityState>
  paradoxes: Array<{ entity: string, violation: string }>
  performance: {
    duration: number
    operatorCount: number
  }
  externalCalls: Array<{
    nodeId: string
    providerId: string
    capabilityId: string
    status: 'success' | 'error'
    response?: any
    error?: string
  }>
}

export interface ExecutionProgress {
  nodeId: string
  status: 'executing' | 'complete' | 'error'
  result?: any
  error?: string
  timestamp: number
}

/**
 * Rate limiter state for token bucket algorithm
 * Applies cosmogenesis constraint-based execution: API limits as cosmic constraints
 */
interface RateLimiter {
  tokens: number
  lastRefill: number
  maxTokens: number
  refillRate: number // tokens per second
}

/**
 * 🎬 Visual Studio Execution Engine
 * 
 * Converts visual nodes to ontogenetic operators and executes them
 * using the Law Fabric Engine.
 * 
 * 🌌 Cosmogenesis Principles:
 * - Self-organizing auth state (OAuth tokens refresh automatically)
 * - Constraint-based execution (rate limits as universal laws)
 * - Resilient emergence (retry logic for system stability)
 */
export class VisualStudioExecutionEngine {
  private fabric = createFabric()
  private onProgress?: (progress: ExecutionProgress) => void
  private universeId?: string
  private externalCalls: Array<{
    nodeId: string
    providerId: string
    capabilityId: string
    status: 'success' | 'error'
    response?: any
    error?: string
  }> = []
  
  // 🌊 Rate limiters: Self-regulating flow constraints (cosmogenesis)
  private rateLimiters = new Map<string, RateLimiter>()
  
  // 🔄 Token refresh buffer: 5 minutes before expiry (autogenic self-maintenance)
  private readonly TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000

  constructor(onProgress?: (progress: ExecutionProgress) => void, universeId?: string) {
    this.onProgress = onProgress
    this.universeId = universeId
    this.initializeRateLimiters()
  }
  
  /**
   * 🌊 Initialize rate limiters for all providers
   * Cosmogenesis principle: Each provider has its own constraint boundary
   */
  private initializeRateLimiters(): void {
    // OpenAI: 10 req/sec, burst up to 10
    this.rateLimiters.set('openai-chatgpt', {
      tokens: 10,
      lastRefill: Date.now(),
      maxTokens: 10,
      refillRate: 10,
    })
    
    // Anthropic: 5 req/sec
    this.rateLimiters.set('anthropic-claude', {
      tokens: 5,
      lastRefill: Date.now(),
      maxTokens: 5,
      refillRate: 5,
    })
    
    // Slack: 1 req/sec
    this.rateLimiters.set('slack', {
      tokens: 1,
      lastRefill: Date.now(),
      maxTokens: 1,
      refillRate: 1,
    })
    
    // Twitter: 300 req per 15 min = 0.33 req/sec
    this.rateLimiters.set('twitter-x', {
      tokens: 5,
      lastRefill: Date.now(),
      maxTokens: 5,
      refillRate: 0.33,
    })
    
    // Instagram (Facebook Graph): 200 req/hour = 0.055 req/sec
    this.rateLimiters.set('instagram-business', {
      tokens: 3,
      lastRefill: Date.now(),
      maxTokens: 3,
      refillRate: 0.055,
    })
  }
  
  /**
   * 🔄 Ensure account has valid OAuth token
   * Autogenic principle: Self-maintaining authentication state
   * 
   * @param account - Integration account that may need token refresh
   * @returns Updated account with fresh token
   */
  private async ensureValidToken(account: IntegrationAccount): Promise<IntegrationAccount> {
    // API keys don't expire
    if (account.credentials?.apiKey) {
      return account
    }
    
    // Check if token is expired or about to expire
    if (!account.tokenExpiresAt) {
      return account
    }
    
    const expiresAt = new Date(account.tokenExpiresAt).getTime()
    const now = Date.now()
    
    // Refresh if token expires within buffer window (5 minutes)
    if (now < expiresAt - this.TOKEN_REFRESH_BUFFER_MS) {
      return account // Token still valid
    }
    
    // 🌱 Emergent behavior: System self-heals by refreshing token
    console.log(`[Ontogenesis] Token expiring soon for account ${account.id}, refreshing...`)
    
    try {
      // Use fortistate integrationActions to refresh
      const { integrationActions } = await import('./integrations/integrationStore')
      const refreshedAccount = await integrationActions.refreshAccount(account.id)
      
      console.log(`[Ontogenesis] ✅ Token refreshed successfully for ${account.displayName}`)
      return refreshedAccount
    } catch (error) {
      console.error(`[Ontogenesis] ❌ Token refresh failed for ${account.id}:`, error)
      throw new Error(`Failed to refresh OAuth token: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
  
  /**
   * 🌊 Wait for rate limit allowance (token bucket algorithm)
   * Cosmogenesis principle: Respect API constraints as universal laws
   * 
   * @param providerId - Provider to check rate limit for
   */
  private async waitForRateLimit(providerId: string): Promise<void> {
    const limiter = this.rateLimiters.get(providerId)
    if (!limiter) {
      return // No rate limit configured
    }
    
    const now = Date.now()
    const timeSinceRefill = (now - limiter.lastRefill) / 1000 // seconds
    
    // Refill tokens based on time elapsed
    const tokensToAdd = timeSinceRefill * limiter.refillRate
    limiter.tokens = Math.min(limiter.maxTokens, limiter.tokens + tokensToAdd)
    limiter.lastRefill = now
    
    // If we have tokens, consume one and proceed
    if (limiter.tokens >= 1) {
      limiter.tokens -= 1
      return
    }
    
    // Need to wait for next token
    const waitTime = (1 - limiter.tokens) / limiter.refillRate * 1000 // milliseconds
    console.log(`[Ontogenesis] 🌊 Rate limit reached for ${providerId}, waiting ${Math.ceil(waitTime)}ms...`)
    
    await new Promise(resolve => setTimeout(resolve, waitTime))
    
    // After waiting, we should have a token
    limiter.tokens = 0
    limiter.lastRefill = Date.now()
  }
  
  /**
   * 🔄 Retry API call with exponential backoff
   * Ontogenesis principle: System resilience through adaptive retry
   * 
   * @param fn - Function to retry
   * @param maxRetries - Maximum number of retry attempts
   * @param initialDelayMs - Initial delay before first retry
   */
  private async callWithRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    initialDelayMs: number = 1000
  ): Promise<T> {
    let lastError: Error | undefined
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        
        // Don't retry on auth errors (4xx)
        if (lastError.message.includes('401') || lastError.message.includes('403')) {
          throw lastError
        }
        
        if (attempt < maxRetries) {
          const delayMs = initialDelayMs * Math.pow(2, attempt)
          console.log(`[Ontogenesis] 🔄 Attempt ${attempt + 1} failed, retrying in ${delayMs}ms...`)
          await new Promise(resolve => setTimeout(resolve, delayMs))
        }
      }
    }
    
    throw lastError
  }

  /**
   * Execute a visual graph as ontogenetic operators
   */
  async execute(nodes: Node[], edges: Edge[]): Promise<ExecutionResult> {
    const startTime = performance.now()
    const narrative: string[] = []
    const operators: OntogeneticOp[] = []
    this.externalCalls = []

    // Sort nodes in execution order (topological sort based on edges)
    const sortedNodes = this.topologicalSort(nodes, edges)

    // Convert each node to an operator
    for (const node of sortedNodes) {
      this.reportProgress(node.id, 'executing')

      try {
        // Execute external app bindings for this node
        await this.executeNodeBindings(node, narrative)

        const op = this.nodeToOperator(node)
        if (op) {
          operators.push(op)
          narrative.push(node.data.narrative || `${node.type} ${node.data.entity}`)
          this.reportProgress(node.id, 'complete', op)
        }
      } catch (error) {
        this.reportProgress(node.id, 'error', undefined, String(error))
        narrative.push(`❌ Error: ${error}`)
      }

      // Small delay for visual feedback
      await new Promise(resolve => setTimeout(resolve, 150))
    }

    // Execute all operators through the fabric
    this.fabric.clear().addMany(operators)
    const result = this.fabric.execute()
    const duration = performance.now() - startTime

    return {
      narrative,
      finalStates: result.reality.entities,
      paradoxes: result.paradoxes.map(p => ({
        entity: p.entity,
        violation: p.violation
      })),
      performance: {
        duration,
        operatorCount: operators.length
      },
      externalCalls: this.externalCalls
    }
  }

  /**
   * Execute external app bindings for a specific node
   */
  private async executeNodeBindings(node: Node, narrative: string[]): Promise<void> {
    const state = integrationSelectors.getState()
    const bindings = state.bindings.filter(
      b => b.nodeId === node.id && (b.universeId === this.universeId || b.scope === 'node')
    )

    if (bindings.length === 0) {
      return
    }

    // Sort by priority
    const sortedBindings = [...bindings].sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999))

    for (const binding of sortedBindings) {
      try {
        const account = state.accounts.find(a => a.id === binding.accountId)
        const provider = state.providers.find(p => p.id === binding.providerId)

        if (!account || !provider) {
          narrative.push(`⚠️ Skipping binding ${binding.id}: missing account or provider`)
          continue
        }

        narrative.push(`🔌 Calling ${provider.name} (${binding.config.capabilityId})...`)

        const response = await this.callExternalAPI(binding, account, provider, node)

        this.externalCalls.push({
          nodeId: node.id,
          providerId: binding.providerId,
          capabilityId: binding.config.capabilityId,
          status: 'success',
          response
        })

        narrative.push(`✅ ${provider.name} responded successfully`)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        
        this.externalCalls.push({
          nodeId: node.id,
          providerId: binding.providerId,
          capabilityId: binding.config.capabilityId,
          status: 'error',
          error: errorMessage
        })

        narrative.push(`❌ ${binding.providerId} failed: ${errorMessage}`)
      }
    }
  }

  /**
   * Make actual API call to external provider
   * 🌌 Applies all cosmogenesis principles:
   * - Token refresh (autogenic self-maintenance)
   * - Rate limiting (constraint-based execution)
   * - Retry logic (resilient emergence)
   */
  private async callExternalAPI(
    binding: IntegrationBinding,
    account: IntegrationAccount,
    provider: IntegrationProviderMeta,
    node: Node
  ): Promise<any> {
    const { capabilityId, settings } = binding.config

    // 🔄 Step 1: Ensure token is valid (autogenic principle)
    const validAccount = await this.ensureValidToken(account)
    
    // 🌊 Step 2: Wait for rate limit allowance (constraint principle)
    await this.waitForRateLimit(provider.id)
    
    // 🔄 Step 3: Execute with retry logic (resilience principle)
    return await this.callWithRetry(async () => {
      // Build request based on provider and capability
      switch (provider.id) {
        case 'openai-chatgpt':
          return await this.callOpenAI(capabilityId, settings, validAccount, node)
        
        case 'anthropic-claude':
          return await this.callAnthropic(capabilityId, settings, validAccount, node)
        
        case 'slack':
          return await this.callSlack(capabilityId, settings, validAccount, node)
        
        case 'twitter-x':
          return await this.callTwitter(capabilityId, settings, validAccount, node)
        
        case 'instagram-business':
          return await this.callInstagram(capabilityId, settings, validAccount, node)
        
        default:
          throw new Error(`Provider ${provider.id} not yet implemented`)
      }
    }, 3, 1000) // 3 retries, 1 second initial delay
  }

  private async callOpenAI(
    capabilityId: string,
    settings: Record<string, unknown>,
    account: IntegrationAccount,
    node: Node
  ): Promise<any> {
    const apiKey = account.credentials?.apiKey as string
    if (!apiKey) {
      throw new Error('OpenAI API key not found in account credentials')
    }

    switch (capabilityId) {
      case 'chat-completion':
        return await this.openaiChatCompletion(settings, account, node, apiKey)
      case 'embedding':
        return await this.openaiEmbedding(settings, account, node, apiKey)
      case 'image-generation':
        return await this.openaiImageGeneration(settings, account, node, apiKey)
      default:
        throw new Error(`Unknown OpenAI capability: ${capabilityId}`)
    }
  }

  private async openaiChatCompletion(
    settings: Record<string, unknown>,
    _account: IntegrationAccount,
    node: Node,
    apiKey: string
  ): Promise<any> {
    const prompt = (settings.promptTemplate as string) || node.data.narrative || 'Hello!'
    const model = (settings.model as string) || 'gpt-4'
    const maxTokens = (settings.maxTokens as number) || 150
    const temperature = (settings.temperature as number) ?? 1

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
        temperature,
      }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: response.statusText } }))
      throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`)
    }

    return await response.json()
  }

  private async openaiEmbedding(
    settings: Record<string, unknown>,
    _account: IntegrationAccount,
    node: Node,
    apiKey: string
  ): Promise<any> {
    const input = (settings.input as string) || node.data.entity || ''
    const model = (settings.model as string) || 'text-embedding-ada-002'

    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        input,
      }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: response.statusText } }))
      throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`)
    }

    return await response.json()
  }

  private async openaiImageGeneration(
    settings: Record<string, unknown>,
    _account: IntegrationAccount,
    node: Node,
    apiKey: string
  ): Promise<any> {
    const prompt = (settings.promptTemplate as string) || node.data.narrative || 'A beautiful landscape'
    const size = (settings.size as string) || '1024x1024'
    const n = (settings.n as number) || 1

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        prompt,
        n,
        size,
      }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: response.statusText } }))
      throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`)
    }

    return await response.json()
  }

  private async callAnthropic(
    capabilityId: string,
    settings: Record<string, unknown>,
    account: IntegrationAccount,
    node: Node
  ): Promise<any> {
    const apiKey = account.credentials?.apiKey as string
    if (!apiKey) {
      throw new Error('Anthropic API key not found in account credentials')
    }

    switch (capabilityId) {
      case 'chat':
        return await this.anthropicChat(settings, node, apiKey)
      default:
        throw new Error(`Unknown Anthropic capability: ${capabilityId}`)
    }
  }

  private async anthropicChat(
    settings: Record<string, unknown>,
    node: Node,
    apiKey: string
  ): Promise<any> {
    const prompt = (settings.promptTemplate as string) || node.data.narrative || 'Hello!'
    const model = (settings.model as string) || 'claude-3-sonnet-20240229'
    const maxTokens = (settings.maxTokens as number) || 1024

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
      const error = await response.json().catch(() => ({ error: { message: response.statusText } }))
      throw new Error(`Anthropic API error: ${error.error?.message || response.statusText}`)
    }

    return await response.json()
  }

  private async callSlack(
    capabilityId: string,
    settings: Record<string, unknown>,
    account: IntegrationAccount,
    node: Node
  ): Promise<any> {
    const accessToken = account.credentials?.accessToken as string
    if (!accessToken) {
      throw new Error('Slack access token not found in account credentials')
    }

    switch (capabilityId) {
      case 'post-message':
        return await this.slackPostMessage(settings, node, accessToken)
      case 'schedule-message':
        return await this.slackScheduleMessage(settings, node, accessToken)
      default:
        throw new Error(`Unknown Slack capability: ${capabilityId}`)
    }
  }

  private async slackPostMessage(
    settings: Record<string, unknown>,
    node: Node,
    accessToken: string
  ): Promise<any> {
    const channel = settings.channel as string
    const message = (settings.messageTemplate as string) || node.data.narrative || 'Hello from Fortistate!'

    if (!channel) {
      throw new Error('Slack channel ID required in settings')
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

  private async slackScheduleMessage(
    settings: Record<string, unknown>,
    node: Node,
    accessToken: string
  ): Promise<any> {
    const channel = settings.channel as string
    const message = (settings.messageTemplate as string) || node.data.narrative || 'Hello from Fortistate!'
    const postAt = settings.postAt as number || Math.floor(Date.now() / 1000) + 60

    if (!channel) {
      throw new Error('Slack channel ID required in settings')
    }

    const response = await fetch('https://slack.com/api/chat.scheduleMessage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        channel,
        text: message,
        post_at: postAt,
      }),
    })

    const result = await response.json()
    
    if (!result.ok) {
      throw new Error(`Slack API error: ${result.error}`)
    }

    return result
  }

  private async callTwitter(
    capabilityId: string,
    settings: Record<string, unknown>,
    account: IntegrationAccount,
    node: Node
  ): Promise<any> {
    const accessToken = account.credentials?.accessToken as string
    if (!accessToken) {
      throw new Error('Twitter access token not found in account credentials')
    }

    switch (capabilityId) {
      case 'post-tweet':
        return await this.twitterPostTweet(settings, node, accessToken)
      default:
        throw new Error(`Unknown Twitter capability: ${capabilityId}`)
    }
  }

  private async twitterPostTweet(
    settings: Record<string, unknown>,
    node: Node,
    accessToken: string
  ): Promise<any> {
    const tweetText = (settings.tweetTemplate as string) || node.data.narrative || 'Hello from Fortistate!'

    if (tweetText.length > 280) {
      throw new Error('Tweet text exceeds 280 characters')
    }

    const response = await fetch('https://api.twitter.com/2/tweets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        text: tweetText,
      }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: response.statusText }))
      throw new Error(`Twitter API error: ${error.detail || response.statusText}`)
    }

    return await response.json()
  }

  private async callInstagram(
    capabilityId: string,
    settings: Record<string, unknown>,
    account: IntegrationAccount,
    node: Node
  ): Promise<any> {
    const accessToken = account.credentials?.accessToken as string
    const igUserId = account.metadata.igUserId as string

    if (!accessToken || !igUserId) {
      throw new Error('Instagram access token or user ID not found in account')
    }

    switch (capabilityId) {
      case 'post-media':
        return await this.instagramPostMedia(settings, node, accessToken, igUserId)
      case 'post-story':
        return await this.instagramPostStory(settings, node, accessToken, igUserId)
      default:
        throw new Error(`Unknown Instagram capability: ${capabilityId}`)
    }
  }

  private async instagramPostMedia(
    settings: Record<string, unknown>,
    node: Node,
    accessToken: string,
    igUserId: string
  ): Promise<any> {
    const caption = (settings.captionTemplate as string) || node.data.narrative
    const imageUrl = settings.imageUrl as string

    if (!imageUrl) {
      throw new Error('Instagram image URL required in settings')
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

  private async instagramPostStory(
    settings: Record<string, unknown>,
    _node: Node,
    accessToken: string,
    igUserId: string
  ): Promise<any> {
    const imageUrl = settings.imageUrl as string

    if (!imageUrl) {
      throw new Error('Instagram image URL required for story')
    }

    // Step 1: Create story container
    const containerResponse = await fetch(
      `https://graph.facebook.com/v18.0/${igUserId}/media`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: imageUrl,
          media_type: 'STORIES',
          access_token: accessToken,
        }),
      }
    )

    const containerResult = await containerResponse.json()
    
    if (containerResult.error) {
      throw new Error(`Instagram API error: ${containerResult.error.message}`)
    }

    const creationId = containerResult.id

    // Step 2: Publish the story
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

  /**
   * Convert a visual node to an ontogenetic operator
   */
  private nodeToOperator(node: Node): OntogeneticOp | null {
    switch (node.type) {
      case 'begin':
        return BEGIN(
          node.data.entity,
          node.data.properties || {}
        )

      case 'become':
        return BECOME(
          node.data.entity,
          this.parseTransform(node.data.transform),
          node.data.trigger ? this.parseTrigger(node.data.trigger) : undefined
        )

      case 'cease':
        return CEASE(
          node.data.entity,
          this.parseCondition(node.data.condition),
          node.data.action || 'terminate'
        )

      case 'transcend':
        return TRANSCEND(
          node.data.entity,
          node.data.portal || 'universe:unknown',
          node.data.condition ? this.parseCondition(node.data.condition) : () => true
        )

      default:
        return null
    }
  }

  /**
   * Parse transform string to function
   */
  private parseTransform(transformStr: string): (state: EntityState) => EntityState {
    // Safety: Only allow simple arithmetic expressions
    const sanitized = transformStr.replace(/[^0-9+\-*/().a-zA-Z_\s]/g, '')
    
    return (state: EntityState) => {
      try {
        // Access properties from state
        const balance = (state.properties.balance as number) || 0
        
        // Evaluate the transform
        // eslint-disable-next-line no-eval
        const result = eval(sanitized)
        
        return {
          ...state,
          properties: {
            ...state.properties,
            balance: typeof result === 'number' ? result : balance
          },
          updatedAt: Date.now()
        }
      } catch {
        return state
      }
    }
  }

  /**
   * Parse condition string to predicate
   */
  private parseCondition(conditionStr: string): (state: EntityState) => boolean {
    // Safety: Only allow simple comparison expressions
    const sanitized = conditionStr.replace(/[^0-9<>=!&|().a-zA-Z_\s]/g, '')
    
    return (state: EntityState) => {
      try {
        // @ts-expect-error - Variables used in eval context
        const balance = (state.properties.balance as number) || 0
        // @ts-expect-error - Variables used in eval context
        const tier = (state.properties.tier as string) || 'basic'
        
        // eslint-disable-next-line no-eval
        return eval(sanitized) as boolean
      } catch {
        return false
      }
    }
  }

  /**
   * Parse trigger string to predicate
   */
  private parseTrigger(_triggerStr: string): (state: EntityState) => boolean {
    // For now, triggers are always true when the node is reached
    return () => true
  }

  /**
   * Topological sort of nodes based on edges
   */
  private topologicalSort(nodes: Node[], edges: Edge[]): Node[] {
    const adjList = new Map<string, string[]>()
    const inDegree = new Map<string, number>()

    // Initialize
    nodes.forEach(node => {
      adjList.set(node.id, [])
      inDegree.set(node.id, 0)
    })

    // Build adjacency list and in-degree map
    edges.forEach(edge => {
      adjList.get(edge.source)?.push(edge.target)
      inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1)
    })

    // Find nodes with no incoming edges
    const queue: Node[] = nodes.filter(node => (inDegree.get(node.id) || 0) === 0)
    const sorted: Node[] = []

    while (queue.length > 0) {
      const node = queue.shift()!
      sorted.push(node)

      const neighbors = adjList.get(node.id) || []
      neighbors.forEach(neighborId => {
        const newDegree = (inDegree.get(neighborId) || 0) - 1
        inDegree.set(neighborId, newDegree)

        if (newDegree === 0) {
          const neighborNode = nodes.find(n => n.id === neighborId)
          if (neighborNode) queue.push(neighborNode)
        }
      })
    }

    return sorted
  }

  /**
   * Report execution progress
   */
  private reportProgress(
    nodeId: string, 
    status: 'executing' | 'complete' | 'error',
    result?: any,
    error?: string
  ) {
    if (this.onProgress) {
      this.onProgress({
        nodeId,
        status,
        result,
        error,
        timestamp: Date.now()
      })
    }
  }
}

/**
 * Create a new execution engine instance
 */
export function createExecutionEngine(
  onProgress?: (progress: ExecutionProgress) => void,
  universeId?: string
): VisualStudioExecutionEngine {
  return new VisualStudioExecutionEngine(onProgress, universeId)
}
