import type { Node, Edge } from 'reactflow'

/**
 * Canonical list of first-party supported integration providers. Additional providers
 * can be registered at runtime through the IntegrationCatalog service.
 */
export type IntegrationProviderId =
  // AI Providers
  | 'openai-chatgpt'
  | 'anthropic-claude'
  | 'google-gemini'
  | 'xai-grok'
  // Google Workspace
  | 'google-calendar'
  | 'gmail'
  | 'google-drive'
  | 'google-docs'
  | 'google-sheets'
  | 'google-meet'
  | 'google-search'
  | 'google-analytics'
  // Microsoft 365
  | 'microsoft-outlook'
  | 'microsoft-teams'
  // Communication
  | 'slack'
  | 'whatsapp-business'
  | 'discord'
  | 'twilio'
  | 'zoom'
  // Email Marketing
  | 'sendgrid'
  | 'mailchimp'
  // Notes & Productivity
  | 'notion'
  | 'apple-notes'
  | 'evernote'
  // Project Management
  | 'asana'
  | 'jira'
  | 'trello'
  | 'monday'
  // CRM & Marketing
  | 'hubspot'
  | 'salesforce'
  // Payment Processors
  | 'stripe'
  | 'paypal'
  // Cloud Storage
  | 'dropbox'
  | 'box'
  // Automation
  | 'zapier'
  | 'make-com'
  // Social Media
  | 'twitter-x'
  | 'linkedin'
  | 'instagram-business'
  | 'youtube'
  | 'facebook-pages'
  // Developer Tools
  | 'github'
  | 'gitlab'
  | 'vercel'
  // Analytics
  | 'mixpanel'
  // Database
  | 'airtable'
  | 'supabase'
  // Custom
  | 'webhook-custom'
  | 'custom-runtime'
  | `custom-${string}`

export type IntegrationAccountStatus =
  | 'connected'
  | 'pending'
  | 'expired'
  | 'error'
  | 'disabled'

export type IntegrationSecurityTier = 'production' | 'sandbox'

/**
 * Capabilities represent discrete actions or resources a provider exposes. They are mapped
 * onto nodes (or entire universes) so execution engines understand what to invoke.
 */
export type IntegrationCapabilityId =
  // AI Capabilities
  | 'generate-content'
  | 'summarize-content'
  | 'analyze-text'
  | 'generate-response'
  | 'generate-multimodal'
  | 'real-time-query'
  // Email Capabilities
  | 'send-email'
  | 'read-email'
  | 'read-inbox'
  // Calendar Capabilities
  | 'schedule-event'
  | 'update-calendar'
  | 'sync-availability'
  | 'create-meeting'
  // Messaging Capabilities
  | 'send-message'
  | 'read-channels'
  | 'send-sms'
  // Social Media Capabilities
  | 'post-social'
  | 'post-tweet'
  | 'read-timeline'
  | 'post-content'
  | 'upload-video'
  | 'manage-posts'
  // Task/Project Management
  | 'create-task'
  | 'update-task'
  | 'create-issue'
  | 'update-issue'
  | 'create-card'
  | 'update-card'
  | 'create-item'
  // File/Document Management
  | 'upload-file'
  | 'list-files'
  | 'create-document'
  | 'update-sheet'
  | 'create-page'
  | 'query-database'
  | 'create-note'
  // Developer Capabilities
  | 'trigger-workflow'
  | 'read-repo'
  | 'trigger-pipeline'
  | 'deploy-project'
  // CRM Capabilities
  | 'update-crm-record'
  | 'read-crm-record'
  | 'create-contact'
  | 'manage-audience'
  // Payment Capabilities
  | 'create-payment'
  | 'read-payment'
  | 'manage-subscription'
  // Analytics Capabilities
  | 'track-event'
  | 'read-analytics'
  // Database Capabilities
  | 'create-record'
  | 'read-records'
  // Marketing Capabilities
  | 'send-campaign'
  // Search Capabilities
  | 'web-search'
  // Custom/Generic
  | 'trigger-webhook'
  | 'execute-script'
  | 'custom'

export interface IntegrationCapabilitySpec {
  id: IntegrationCapabilityId
  label: string
  description: string
  /**
   * Whether the capability requires elevated scopes (e.g. send email vs read-only).
   */
  requiresWriteScope: boolean
  /**
   * Optional schema describing payload shape so the UI can render smart editors.
   */
  inputSchema?: Record<string, unknown>
  outputSchema?: Record<string, unknown>
}

export interface IntegrationProviderMeta {
  id: IntegrationProviderId
  name: string
  description: string
  category:
    | 'ai'
    | 'calendar'
    | 'email'
    | 'collaboration'
    | 'crm'
    | 'project-management'
    | 'communication'
    | 'automation'
    | 'files'
    | 'storage'
    | 'productivity'
    | 'notes'
    | 'developer'
    | 'search'
    | 'payments'
    | 'social'
    | 'marketing'
    | 'analytics'
    | 'database'
    | 'custom'
  icon?: string
  docsUrl?: string
  oauth?: {
    authorizationUrl: string
    tokenUrl: string
    scopes: string[]
  }
  capabilities: IntegrationCapabilitySpec[]
  defaultSecurityTier: IntegrationSecurityTier
  marketTags: string[]
}

export interface IntegrationAccountMetadata {
  tenantId?: string
  organizationName?: string
  email?: string
  workspaceName?: string
  region?: string
  /** Provider-specific metadata blob */
  [key: string]: unknown
}

export interface IntegrationAccount {
  id: string
  providerId: IntegrationProviderId
  providerName: string
  status: IntegrationAccountStatus
  lastCheckedAt: string | null
  connectedAt: string
  displayName: string
  scopes: string[]
  securityTier: IntegrationSecurityTier
  metadata: IntegrationAccountMetadata
  /** True if the account is usable for production go-live runs */
  isVerified: boolean
  /** Additional notes or warnings to show in the UI */
  notices?: string[]
  /** Encrypted credentials (API keys, tokens) - stored securely, never in localStorage */
  credentials?: {
    apiKey?: string
    accessToken?: string
    refreshToken?: string
    accessTokenSecret?: string
    [key: string]: unknown
  }
  /** OAuth token expiration timestamp */
  tokenExpiresAt?: string
}

export type IntegrationBindingScope = 'node' | 'universe'

export interface IntegrationBindingConfig {
  /** ID of the capability provided by the integration */
  capabilityId: IntegrationCapabilityId
  /** Arbitrary configuration for the invocation (prompt template, payload mapping, etc.) */
  settings: Record<string, unknown>
  /** Optional human friendly summary to show in the canvas */
  summary?: string
}

export interface IntegrationBinding {
  id: string
  scope: IntegrationBindingScope
  universeId: string
  nodeId?: string
  accountId: string
  providerId: IntegrationProviderId
  config: IntegrationBindingConfig
  createdAt: string
  updatedAt: string
  environment: IntegrationSecurityTier
  /** Execution order for multi-step bindings */
  priority: number
  /** Runtime flags (e.g. dry-run, logging level) */
  runtimeOptions?: Record<string, unknown>
}

export interface SavedUniverseVersion {
  id: string
  label: string
  description?: string
  createdAt: string
  createdBy: string
  /**
   * Frozen copy of the canvas at the time of save. The live canvas can differ after edits; versions
   * allow rollbacks and reproducibility.
   */
  canvasState: {
    nodes: Node[]
    edges: Edge[]
    viewport: { x: number; y: number; zoom: number }
  }
  bindings: IntegrationBinding[]
  /** Preview metrics captured during last run (if any). */
  lastRunSummary?: {
    status: 'success' | 'warning' | 'error'
    completedAt: string
    durationMs: number
  }
}

export interface SavedUniverseSummary {
  id: string
  label: string
  description?: string
  icon?: string
  createdAt: string
  updatedAt: string
  ownerId: string
  marketTags: string[]
  /** Default version that should be launched when user clicks go-live */
  activeVersionId: string | null
  /** IDs of versions available inside this universe */
  versionIds: string[]
  /** Quick glance integration info for the gallery */
  integrationCounts: Record<IntegrationProviderId, number>
  /** Data classification (helps with compliance prompts) */
  dataSensitivity?: 'public' | 'internal' | 'confidential' | 'regulated'
  /** Current deployment status */
  deploymentStatus?: 'draft' | 'live' | 'paused' | 'archived'
  /** Most recent launch timestamp */
  lastLaunchedAt?: string
  /** ID of the currently running launch */
  activeLaunchId?: string
}

export interface UniverseRuntimeConfig {
  universeId: string
  versionId: string
  entryNodeId: string | null
  dryRun: boolean
  /**
   * For live launches we may override certain bindings (e.g. swap sandbox account with prod).
   */
  bindingOverrides?: Array<{
    bindingId: string
    accountId: string
  }>
  telemetryLevel: 'minimal' | 'standard' | 'verbose'
  notifyOnCompletion: boolean
  completionChannels: Array<{
    type: 'email' | 'slack' | 'teams' | 'webhook' | 'in-app'
    target: string
  }>
}

export interface IntegrationDraft {
  tempId: string
  bindingId?: string
  providerId: IntegrationProviderId | null
  capabilityId: IntegrationCapabilityId | null
  accountId: string | null
  scope: IntegrationBindingScope
  nodeId?: string
  configuration: Record<string, unknown>
  validationErrors: string[]
}

export interface UniverseDraftMetadata {
  label: string
  description?: string
  icon?: string
  marketTags: string[]
  targetLaunchDate?: string
}

export interface IntegrationStateSnapshot {
  accounts: IntegrationAccount[]
  bindings: IntegrationBinding[]
  drafts: IntegrationDraft[]
  providers: IntegrationProviderMeta[]
  lastSyncedAt: string | null
  syncing: boolean
  error?: string
}

export interface UniverseRegistrySnapshot {
  universes: SavedUniverseSummary[]
  versions: Record<string, SavedUniverseVersion>
  drafts: Record<string, UniverseDraftMetadata>
  recentUniverseIds: string[]
  lastViewedUniverseId: string | null
  loading: boolean
  launching: boolean
  error?: string
}
