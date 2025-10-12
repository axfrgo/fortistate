import { createStore } from '../../../../src/storeFactory'
import { sessionActions } from '../session/sessionPersistence'
import { runtimeConfig } from '../runtimeConfig'
import {
  type IntegrationAccount,
  type IntegrationBinding,
  type IntegrationDraft,
  type IntegrationProviderMeta,
  type IntegrationStateSnapshot,
  type IntegrationProviderId,
} from './types'

const API_BASE = runtimeConfig.integrationsBaseUrl

const initialState: IntegrationStateSnapshot = {
  accounts: [],
  bindings: [],
  drafts: [],
  providers: [],
  lastSyncedAt: null,
  syncing: false,
}

function generateId(prefix: string) {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

const { VITE_MOCK_API, VITE_MOCK_INTEGRATIONS } = import.meta.env as {
  VITE_MOCK_API?: string
  VITE_MOCK_INTEGRATIONS?: string
}

const FORCE_MOCK = VITE_MOCK_API === 'true' || VITE_MOCK_INTEGRATIONS === 'true'

const mockProviders: IntegrationProviderMeta[] = [
  // AI Providers
  {
    id: 'openai-chatgpt',
    name: 'ChatGPT',
    description: 'OpenAI ChatGPT for conversational AI, content generation and code assistance.',
    category: 'ai',
    icon: '🤖',
    docsUrl: 'https://platform.openai.com/docs',
    oauth: {
      authorizationUrl: 'https://platform.openai.com/oauth/authorize',
      tokenUrl: 'https://platform.openai.com/oauth/token',
      scopes: ['models.read', 'responses.write', 'api.completions'],
    },
    capabilities: [
      {
        id: 'generate-content',
        label: 'Generate Content',
        description: 'Use GPT models to create dynamic content and copy.',
        requiresWriteScope: true,
      },
      {
        id: 'analyze-text',
        label: 'Analyze Text',
        description: 'Analyze and extract insights from text content.',
        requiresWriteScope: false,
      },
    ],
    defaultSecurityTier: 'sandbox',
    marketTags: ['ai', 'llm', 'chatgpt', 'openai'],
  },
  {
    id: 'anthropic-claude',
    name: 'Claude',
    description: 'Anthropic Claude AI for advanced reasoning and analysis.',
    category: 'ai',
    icon: '🧠',
    docsUrl: 'https://docs.anthropic.com',
    oauth: {
      authorizationUrl: 'https://console.anthropic.com/oauth/authorize',
      tokenUrl: 'https://api.anthropic.com/oauth/token',
      scopes: ['api.read', 'api.write'],
    },
    capabilities: [
      {
        id: 'generate-response',
        label: 'Generate Response',
        description: 'Generate intelligent responses with Claude AI.',
        requiresWriteScope: true,
      },
    ],
    defaultSecurityTier: 'sandbox',
    marketTags: ['ai', 'llm', 'claude', 'anthropic'],
  },
  {
    id: 'google-gemini',
    name: 'Google Gemini',
    description: 'Google Gemini multimodal AI for text, code, and image generation.',
    category: 'ai',
    icon: '✨',
    docsUrl: 'https://ai.google.dev/docs',
    oauth: {
      authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      scopes: ['https://www.googleapis.com/auth/generative-language'],
    },
    capabilities: [
      {
        id: 'generate-multimodal',
        label: 'Multimodal Generation',
        description: 'Generate text and analyze images with Gemini.',
        requiresWriteScope: true,
      },
    ],
    defaultSecurityTier: 'sandbox',
    marketTags: ['ai', 'llm', 'gemini', 'google', 'multimodal'],
  },
  {
    id: 'xai-grok',
    name: 'Grok',
    description: 'xAI Grok for real-time AI with web access and humor.',
    category: 'ai',
    icon: '🚀',
    docsUrl: 'https://docs.x.ai',
    oauth: {
      authorizationUrl: 'https://x.ai/oauth/authorize',
      tokenUrl: 'https://api.x.ai/oauth/token',
      scopes: ['api.read', 'api.write'],
    },
    capabilities: [
      {
        id: 'real-time-query',
        label: 'Real-Time Query',
        description: 'Query Grok with real-time web access.',
        requiresWriteScope: true,
      },
    ],
    defaultSecurityTier: 'sandbox',
    marketTags: ['ai', 'llm', 'grok', 'xai'],
  },

  // Google Workspace
  {
    id: 'gmail',
    name: 'Gmail',
    description: 'Send emails, manage inbox, and automate email workflows.',
    category: 'email',
    icon: '�',
    docsUrl: 'https://developers.google.com/gmail/api',
    oauth: {
      authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      scopes: [
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.modify',
      ],
    },
    capabilities: [
      {
        id: 'send-email',
        label: 'Send Email',
        description: 'Send automated emails from your Gmail account.',
        requiresWriteScope: true,
      },
      {
        id: 'read-inbox',
        label: 'Read Inbox',
        description: 'Read and process incoming emails.',
        requiresWriteScope: false,
      },
    ],
    defaultSecurityTier: 'production',
    marketTags: ['email', 'google', 'gmail', 'workspace'],
  },
  {
    id: 'google-drive',
    name: 'Google Drive',
    description: 'Store, organize, and share files in Google Drive.',
    category: 'storage',
    icon: '📁',
    docsUrl: 'https://developers.google.com/drive/api',
    oauth: {
      authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      scopes: [
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/drive.readonly',
      ],
    },
    capabilities: [
      {
        id: 'upload-file',
        label: 'Upload File',
        description: 'Upload and manage files in Google Drive.',
        requiresWriteScope: true,
      },
      {
        id: 'list-files',
        label: 'List Files',
        description: 'Browse and search files in Drive.',
        requiresWriteScope: false,
      },
    ],
    defaultSecurityTier: 'sandbox',
    marketTags: ['storage', 'google', 'drive', 'workspace'],
  },
  {
    id: 'google-docs',
    name: 'Google Docs',
    description: 'Create and edit documents collaboratively.',
    category: 'productivity',
    icon: '📝',
    docsUrl: 'https://developers.google.com/docs/api',
    oauth: {
      authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      scopes: [
        'https://www.googleapis.com/auth/documents',
        'https://www.googleapis.com/auth/documents.readonly',
      ],
    },
    capabilities: [
      {
        id: 'create-document',
        label: 'Create Document',
        description: 'Create and edit Google Docs documents.',
        requiresWriteScope: true,
      },
    ],
    defaultSecurityTier: 'sandbox',
    marketTags: ['docs', 'google', 'workspace', 'documents'],
  },
  {
    id: 'google-sheets',
    name: 'Google Sheets',
    description: 'Manage spreadsheets and automate data workflows.',
    category: 'productivity',
    icon: '📊',
    docsUrl: 'https://developers.google.com/sheets/api',
    oauth: {
      authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/spreadsheets.readonly',
      ],
    },
    capabilities: [
      {
        id: 'update-sheet',
        label: 'Update Sheet',
        description: 'Read and write data to Google Sheets.',
        requiresWriteScope: true,
      },
    ],
    defaultSecurityTier: 'sandbox',
    marketTags: ['sheets', 'google', 'workspace', 'spreadsheets'],
  },
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    description: 'Manage calendar events and availability.',
    category: 'calendar',
    icon: '🗓️',
    docsUrl: 'https://developers.google.com/calendar',
    oauth: {
      authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      scopes: [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events',
      ],
    },
    capabilities: [
      {
        id: 'schedule-event',
        label: 'Schedule Event',
        description: 'Create or update events on connected calendars.',
        requiresWriteScope: true,
      },
      {
        id: 'sync-availability',
        label: 'Sync Availability',
        description: 'Keep availability windows in sync with team calendars.',
        requiresWriteScope: false,
      },
    ],
    defaultSecurityTier: 'sandbox',
    marketTags: ['calendar', 'google', 'workspace', 'productivity'],
  },
  {
    id: 'google-meet',
    name: 'Google Meet',
    description: 'Create and manage video conference meetings.',
    category: 'communication',
    icon: '📹',
    docsUrl: 'https://developers.google.com/meet',
    oauth: {
      authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      scopes: ['https://www.googleapis.com/auth/meetings'],
    },
    capabilities: [
      {
        id: 'create-meeting',
        label: 'Create Meeting',
        description: 'Schedule Google Meet video conferences.',
        requiresWriteScope: true,
      },
    ],
    defaultSecurityTier: 'sandbox',
    marketTags: ['video', 'google', 'workspace', 'meetings'],
  },
  {
    id: 'google-search',
    name: 'Google Search',
    description: 'Perform web searches and retrieve search results.',
    category: 'search',
    icon: '🔍',
    docsUrl: 'https://developers.google.com/custom-search',
    oauth: {
      authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      scopes: ['https://www.googleapis.com/auth/customsearch'],
    },
    capabilities: [
      {
        id: 'web-search',
        label: 'Web Search',
        description: 'Execute Google searches programmatically.',
        requiresWriteScope: false,
      },
    ],
    defaultSecurityTier: 'sandbox',
    marketTags: ['search', 'google', 'web'],
  },

  // Communication & Collaboration
  {
    id: 'slack',
    name: 'Slack',
    description: 'Send messages, notifications, and updates to Slack channels.',
    category: 'communication',
    icon: '💬',
    docsUrl: 'https://api.slack.com',
    oauth: {
      authorizationUrl: 'https://slack.com/oauth/v2/authorize',
      tokenUrl: 'https://slack.com/api/oauth.v2.access',
      scopes: ['chat:write', 'channels:read', 'users:read'],
    },
    capabilities: [
      {
        id: 'send-message',
        label: 'Send Message',
        description: 'Deliver rich-text notifications to Slack channels or DMs.',
        requiresWriteScope: true,
      },
      {
        id: 'read-channels',
        label: 'Read Channels',
        description: 'Read discussion threads to power automations.',
        requiresWriteScope: false,
      },
    ],
    defaultSecurityTier: 'production',
    marketTags: ['chatops', 'notifications', 'slack', 'communication'],
  },
  {
    id: 'whatsapp-business',
    name: 'WhatsApp Business',
    description: 'Send automated messages via WhatsApp Business API.',
    category: 'communication',
    icon: '💚',
    docsUrl: 'https://developers.facebook.com/docs/whatsapp',
    oauth: {
      authorizationUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
      tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
      scopes: ['whatsapp_business_messaging', 'whatsapp_business_management'],
    },
    capabilities: [
      {
        id: 'send-message',
        label: 'Send Message',
        description: 'Send WhatsApp messages to customers.',
        requiresWriteScope: true,
      },
    ],
    defaultSecurityTier: 'production',
    marketTags: ['messaging', 'whatsapp', 'communication'],
  },

  // Developer Tools
  {
    id: 'github',
    name: 'GitHub',
    description: 'Manage repositories, issues, pull requests and CI/CD workflows.',
    category: 'developer',
    icon: '🐙',
    docsUrl: 'https://docs.github.com/rest',
    oauth: {
      authorizationUrl: 'https://github.com/login/oauth/authorize',
      tokenUrl: 'https://github.com/login/oauth/access_token',
      scopes: ['repo', 'workflow', 'read:user', 'read:org'],
    },
    capabilities: [
      {
        id: 'create-issue',
        label: 'Create Issue',
        description: 'Create and manage GitHub issues.',
        requiresWriteScope: true,
      },
      {
        id: 'trigger-workflow',
        label: 'Trigger Workflow',
        description: 'Trigger GitHub Actions workflows.',
        requiresWriteScope: true,
      },
      {
        id: 'read-repo',
        label: 'Read Repository',
        description: 'Access repository contents and metadata.',
        requiresWriteScope: false,
      },
    ],
    defaultSecurityTier: 'sandbox',
    marketTags: ['git', 'github', 'developer', 'cicd'],
  },
  {
    id: 'gitlab',
    name: 'GitLab',
    description: 'Manage GitLab projects, merge requests, and CI/CD pipelines.',
    category: 'developer',
    icon: '🦊',
    docsUrl: 'https://docs.gitlab.com/ee/api/',
    oauth: {
      authorizationUrl: 'https://gitlab.com/oauth/authorize',
      tokenUrl: 'https://gitlab.com/oauth/token',
      scopes: ['api', 'read_user', 'read_repository'],
    },
    capabilities: [
      {
        id: 'create-issue',
        label: 'Create Issue',
        description: 'Create and manage GitLab issues.',
        requiresWriteScope: true,
      },
      {
        id: 'trigger-pipeline',
        label: 'Trigger Pipeline',
        description: 'Trigger GitLab CI/CD pipelines.',
        requiresWriteScope: true,
      },
    ],
    defaultSecurityTier: 'sandbox',
    marketTags: ['git', 'gitlab', 'developer', 'cicd'],
  },
  {
    id: 'vercel',
    name: 'Vercel',
    description: 'Deploy and manage web applications on Vercel platform.',
    category: 'developer',
    icon: '▲',
    docsUrl: 'https://vercel.com/docs/rest-api',
    oauth: {
      authorizationUrl: 'https://vercel.com/oauth/authorize',
      tokenUrl: 'https://api.vercel.com/v2/oauth/access_token',
      scopes: ['deployments', 'projects'],
    },
    capabilities: [
      {
        id: 'deploy-project',
        label: 'Deploy Project',
        description: 'Deploy applications to Vercel.',
        requiresWriteScope: true,
      },
    ],
    defaultSecurityTier: 'production',
    marketTags: ['hosting', 'deployment', 'vercel', 'developer'],
  },

  // Payment Processors
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Process payments, manage subscriptions and handle financial transactions.',
    category: 'payments',
    icon: '💳',
    docsUrl: 'https://stripe.com/docs/api',
    oauth: {
      authorizationUrl: 'https://connect.stripe.com/oauth/authorize',
      tokenUrl: 'https://connect.stripe.com/oauth/token',
      scopes: ['read_write'],
    },
    capabilities: [
      {
        id: 'create-payment',
        label: 'Create Payment',
        description: 'Process customer payments.',
        requiresWriteScope: true,
      },
      {
        id: 'manage-subscription',
        label: 'Manage Subscription',
        description: 'Create and manage recurring subscriptions.',
        requiresWriteScope: true,
      },
      {
        id: 'read-payment',
        label: 'Read Payment',
        description: 'Retrieve payment and customer information.',
        requiresWriteScope: false,
      },
    ],
    defaultSecurityTier: 'production',
    marketTags: ['payments', 'stripe', 'ecommerce', 'subscriptions'],
  },
  {
    id: 'paypal',
    name: 'PayPal',
    description: 'Accept PayPal payments and manage transactions.',
    category: 'payments',
    icon: '🅿️',
    docsUrl: 'https://developer.paypal.com/docs/api',
    oauth: {
      authorizationUrl: 'https://www.paypal.com/signin/authorize',
      tokenUrl: 'https://api.paypal.com/v1/oauth2/token',
      scopes: ['openid', 'profile', 'email'],
    },
    capabilities: [
      {
        id: 'create-payment',
        label: 'Create Payment',
        description: 'Process PayPal payments.',
        requiresWriteScope: true,
      },
    ],
    defaultSecurityTier: 'production',
    marketTags: ['payments', 'paypal', 'ecommerce'],
  },

  // Cloud Storage
  {
    id: 'dropbox',
    name: 'Dropbox',
    description: 'Store and share files with Dropbox cloud storage.',
    category: 'storage',
    icon: '📦',
    docsUrl: 'https://www.dropbox.com/developers/documentation',
    oauth: {
      authorizationUrl: 'https://www.dropbox.com/oauth2/authorize',
      tokenUrl: 'https://api.dropboxapi.com/oauth2/token',
      scopes: ['files.content.write', 'files.content.read'],
    },
    capabilities: [
      {
        id: 'upload-file',
        label: 'Upload File',
        description: 'Upload files to Dropbox.',
        requiresWriteScope: true,
      },
      {
        id: 'list-files',
        label: 'List Files',
        description: 'Browse Dropbox files.',
        requiresWriteScope: false,
      },
    ],
    defaultSecurityTier: 'sandbox',
    marketTags: ['storage', 'dropbox', 'files'],
  },
  {
    id: 'box',
    name: 'Box',
    description: 'Enterprise file storage and collaboration platform.',
    category: 'storage',
    icon: '📮',
    docsUrl: 'https://developer.box.com',
    oauth: {
      authorizationUrl: 'https://account.box.com/api/oauth2/authorize',
      tokenUrl: 'https://api.box.com/oauth2/token',
      scopes: ['root_readwrite'],
    },
    capabilities: [
      {
        id: 'upload-file',
        label: 'Upload File',
        description: 'Upload files to Box.',
        requiresWriteScope: true,
      },
    ],
    defaultSecurityTier: 'sandbox',
    marketTags: ['storage', 'box', 'enterprise', 'files'],
  },

  // Marketing & Email
  {
    id: 'mailchimp',
    name: 'Mailchimp',
    description: 'Email marketing campaigns and audience management.',
    category: 'marketing',
    icon: '🐵',
    docsUrl: 'https://mailchimp.com/developer/',
    oauth: {
      authorizationUrl: 'https://login.mailchimp.com/oauth2/authorize',
      tokenUrl: 'https://login.mailchimp.com/oauth2/token',
      scopes: ['campaigns:write', 'audiences:write'],
    },
    capabilities: [
      {
        id: 'send-campaign',
        label: 'Send Campaign',
        description: 'Create and send email campaigns.',
        requiresWriteScope: true,
      },
      {
        id: 'manage-audience',
        label: 'Manage Audience',
        description: 'Add and manage email subscribers.',
        requiresWriteScope: true,
      },
    ],
    defaultSecurityTier: 'production',
    marketTags: ['email', 'marketing', 'mailchimp', 'campaigns'],
  },
  {
    id: 'sendgrid',
    name: 'SendGrid',
    description: 'Transactional email delivery and management.',
    category: 'email',
    icon: '✉️',
    docsUrl: 'https://docs.sendgrid.com',
    oauth: {
      authorizationUrl: 'https://api.sendgrid.com/oauth/authorize',
      tokenUrl: 'https://api.sendgrid.com/oauth/token',
      scopes: ['mail.send', 'mail.batch.send'],
    },
    capabilities: [
      {
        id: 'send-email',
        label: 'Send Email',
        description: 'Send transactional emails.',
        requiresWriteScope: true,
      },
    ],
    defaultSecurityTier: 'production',
    marketTags: ['email', 'sendgrid', 'transactional'],
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    description: 'CRM, marketing automation, and customer engagement platform.',
    category: 'crm',
    icon: '🎯',
    docsUrl: 'https://developers.hubspot.com',
    oauth: {
      authorizationUrl: 'https://app.hubspot.com/oauth/authorize',
      tokenUrl: 'https://api.hubapi.com/oauth/v1/token',
      scopes: ['contacts', 'crm.objects.contacts.write'],
    },
    capabilities: [
      {
        id: 'create-contact',
        label: 'Create Contact',
        description: 'Add contacts to HubSpot CRM.',
        requiresWriteScope: true,
      },
      {
        id: 'update-crm-record',
        label: 'Update CRM Record',
        description: 'Update contact and company records.',
        requiresWriteScope: true,
      },
    ],
    defaultSecurityTier: 'production',
    marketTags: ['crm', 'hubspot', 'marketing', 'sales'],
  },

  // Social Media
  {
    id: 'twitter-x',
    name: 'Twitter / X',
    description: 'Post tweets, read timelines, and manage social presence.',
    category: 'social',
    icon: '𝕏',
    docsUrl: 'https://developer.twitter.com',
    oauth: {
      authorizationUrl: 'https://twitter.com/i/oauth2/authorize',
      tokenUrl: 'https://api.twitter.com/2/oauth2/token',
      scopes: ['tweet.read', 'tweet.write', 'users.read'],
    },
    capabilities: [
      {
        id: 'post-tweet',
        label: 'Post Tweet',
        description: 'Share content on Twitter/X.',
        requiresWriteScope: true,
      },
      {
        id: 'read-timeline',
        label: 'Read Timeline',
        description: 'Read tweets and timeline data.',
        requiresWriteScope: false,
      },
    ],
    defaultSecurityTier: 'production',
    marketTags: ['social', 'twitter', 'x', 'social-media'],
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    description: 'Professional networking, content sharing, and lead generation.',
    category: 'social',
    icon: '💼',
    docsUrl: 'https://docs.microsoft.com/en-us/linkedin/',
    oauth: {
      authorizationUrl: 'https://www.linkedin.com/oauth/v2/authorization',
      tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
      scopes: ['w_member_social', 'r_basicprofile'],
    },
    capabilities: [
      {
        id: 'post-content',
        label: 'Post Content',
        description: 'Share professional content on LinkedIn.',
        requiresWriteScope: true,
      },
    ],
    defaultSecurityTier: 'production',
    marketTags: ['social', 'linkedin', 'professional', 'networking'],
  },
  {
    id: 'instagram-business',
    name: 'Instagram Business',
    description: 'Manage Instagram business accounts and post content.',
    category: 'social',
    icon: '📸',
    docsUrl: 'https://developers.facebook.com/docs/instagram-api',
    oauth: {
      authorizationUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
      tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
      scopes: ['instagram_basic', 'instagram_content_publish'],
    },
    capabilities: [
      {
        id: 'post-content',
        label: 'Post Content',
        description: 'Publish photos and videos to Instagram.',
        requiresWriteScope: true,
      },
    ],
    defaultSecurityTier: 'production',
    marketTags: ['social', 'instagram', 'visual', 'social-media'],
  },
  {
    id: 'youtube',
    name: 'YouTube',
    description: 'Upload videos, manage channels, and access analytics.',
    category: 'social',
    icon: '📺',
    docsUrl: 'https://developers.google.com/youtube',
    oauth: {
      authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      scopes: ['https://www.googleapis.com/auth/youtube.upload'],
    },
    capabilities: [
      {
        id: 'upload-video',
        label: 'Upload Video',
        description: 'Upload videos to YouTube.',
        requiresWriteScope: true,
      },
    ],
    defaultSecurityTier: 'production',
    marketTags: ['video', 'youtube', 'social', 'content'],
  },

  // Project Management & Collaboration
  {
    id: 'trello',
    name: 'Trello',
    description: 'Visual project management with boards, lists, and cards.',
    category: 'project-management',
    icon: '📋',
    docsUrl: 'https://developer.atlassian.com/cloud/trello/',
    oauth: {
      authorizationUrl: 'https://trello.com/1/authorize',
      tokenUrl: 'https://trello.com/1/OAuthGetAccessToken',
      scopes: ['read', 'write'],
    },
    capabilities: [
      {
        id: 'create-card',
        label: 'Create Card',
        description: 'Create Trello cards for tasks.',
        requiresWriteScope: true,
      },
      {
        id: 'update-card',
        label: 'Update Card',
        description: 'Move and update Trello cards.',
        requiresWriteScope: true,
      },
    ],
    defaultSecurityTier: 'sandbox',
    marketTags: ['project-management', 'trello', 'tasks', 'kanban'],
  },
  {
    id: 'asana',
    name: 'Asana',
    description: 'Work management platform for teams to organize and track work.',
    category: 'project-management',
    icon: '✓',
    docsUrl: 'https://developers.asana.com',
    oauth: {
      authorizationUrl: 'https://app.asana.com/-/oauth_authorize',
      tokenUrl: 'https://app.asana.com/-/oauth_token',
      scopes: ['default'],
    },
    capabilities: [
      {
        id: 'create-task',
        label: 'Create Task',
        description: 'Create tasks in Asana projects.',
        requiresWriteScope: true,
      },
      {
        id: 'update-task',
        label: 'Update Task',
        description: 'Update task status and details.',
        requiresWriteScope: true,
      },
    ],
    defaultSecurityTier: 'sandbox',
    marketTags: ['project-management', 'asana', 'tasks', 'productivity'],
  },
  {
    id: 'jira',
    name: 'Jira',
    description: 'Issue tracking and agile project management.',
    category: 'project-management',
    icon: '🎫',
    docsUrl: 'https://developer.atlassian.com/cloud/jira/',
    oauth: {
      authorizationUrl: 'https://auth.atlassian.com/authorize',
      tokenUrl: 'https://auth.atlassian.com/oauth/token',
      scopes: ['read:jira-work', 'write:jira-work'],
    },
    capabilities: [
      {
        id: 'create-issue',
        label: 'Create Issue',
        description: 'Create Jira issues and tickets.',
        requiresWriteScope: true,
      },
      {
        id: 'update-issue',
        label: 'Update Issue',
        description: 'Update issue status and fields.',
        requiresWriteScope: true,
      },
    ],
    defaultSecurityTier: 'sandbox',
    marketTags: ['project-management', 'jira', 'agile', 'tickets'],
  },
  {
    id: 'monday',
    name: 'Monday.com',
    description: 'Work operating system for managing projects and workflows.',
    category: 'project-management',
    icon: '🔴',
    docsUrl: 'https://developer.monday.com',
    oauth: {
      authorizationUrl: 'https://auth.monday.com/oauth2/authorize',
      tokenUrl: 'https://auth.monday.com/oauth2/token',
      scopes: ['boards:read', 'boards:write'],
    },
    capabilities: [
      {
        id: 'create-item',
        label: 'Create Item',
        description: 'Create items on Monday boards.',
        requiresWriteScope: true,
      },
    ],
    defaultSecurityTier: 'sandbox',
    marketTags: ['project-management', 'monday', 'workflow', 'collaboration'],
  },

  // Communication & Video
  {
    id: 'zoom',
    name: 'Zoom',
    description: 'Video conferencing, webinars, and meeting scheduling.',
    category: 'communication',
    icon: '🎥',
    docsUrl: 'https://marketplace.zoom.us/docs/api-reference',
    oauth: {
      authorizationUrl: 'https://zoom.us/oauth/authorize',
      tokenUrl: 'https://zoom.us/oauth/token',
      scopes: ['meeting:write', 'meeting:read'],
    },
    capabilities: [
      {
        id: 'create-meeting',
        label: 'Create Meeting',
        description: 'Schedule Zoom meetings.',
        requiresWriteScope: true,
      },
    ],
    defaultSecurityTier: 'sandbox',
    marketTags: ['video', 'zoom', 'meetings', 'communication'],
  },
  {
    id: 'discord',
    name: 'Discord',
    description: 'Community platform for voice, video, and text communication.',
    category: 'communication',
    icon: '🎮',
    docsUrl: 'https://discord.com/developers/docs',
    oauth: {
      authorizationUrl: 'https://discord.com/api/oauth2/authorize',
      tokenUrl: 'https://discord.com/api/oauth2/token',
      scopes: ['bot', 'messages.read', 'messages.write'],
    },
    capabilities: [
      {
        id: 'send-message',
        label: 'Send Message',
        description: 'Send messages to Discord channels.',
        requiresWriteScope: true,
      },
    ],
    defaultSecurityTier: 'sandbox',
    marketTags: ['gaming', 'discord', 'community', 'communication'],
  },
  {
    id: 'twilio',
    name: 'Twilio',
    description: 'SMS, voice calls, and programmable communications.',
    category: 'communication',
    icon: '📱',
    docsUrl: 'https://www.twilio.com/docs',
    oauth: {
      authorizationUrl: 'https://www.twilio.com/authorize',
      tokenUrl: 'https://api.twilio.com/oauth/token',
      scopes: ['messaging'],
    },
    capabilities: [
      {
        id: 'send-sms',
        label: 'Send SMS',
        description: 'Send SMS text messages.',
        requiresWriteScope: true,
      },
    ],
    defaultSecurityTier: 'production',
    marketTags: ['sms', 'twilio', 'messaging', 'communication'],
  },

  // Analytics & Monitoring
  {
    id: 'google-analytics',
    name: 'Google Analytics',
    description: 'Web analytics and user behavior tracking.',
    category: 'analytics',
    icon: '📈',
    docsUrl: 'https://developers.google.com/analytics',
    oauth: {
      authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
    },
    capabilities: [
      {
        id: 'read-analytics',
        label: 'Read Analytics',
        description: 'Access website analytics data.',
        requiresWriteScope: false,
      },
    ],
    defaultSecurityTier: 'sandbox',
    marketTags: ['analytics', 'google', 'tracking', 'metrics'],
  },
  {
    id: 'mixpanel',
    name: 'Mixpanel',
    description: 'Product analytics and user engagement tracking.',
    category: 'analytics',
    icon: '📊',
    docsUrl: 'https://developer.mixpanel.com',
    oauth: {
      authorizationUrl: 'https://mixpanel.com/oauth/authorize',
      tokenUrl: 'https://api.mixpanel.com/oauth/access_token',
      scopes: ['read', 'write'],
    },
    capabilities: [
      {
        id: 'track-event',
        label: 'Track Event',
        description: 'Track user events and behaviors.',
        requiresWriteScope: true,
      },
    ],
    defaultSecurityTier: 'production',
    marketTags: ['analytics', 'mixpanel', 'product', 'tracking'],
  },

  // Databases & Backend
  {
    id: 'airtable',
    name: 'Airtable',
    description: 'Flexible database and spreadsheet hybrid platform.',
    category: 'database',
    icon: '🗄️',
    docsUrl: 'https://airtable.com/developers',
    oauth: {
      authorizationUrl: 'https://airtable.com/oauth2/v1/authorize',
      tokenUrl: 'https://airtable.com/oauth2/v1/token',
      scopes: ['data.records:read', 'data.records:write'],
    },
    capabilities: [
      {
        id: 'create-record',
        label: 'Create Record',
        description: 'Add records to Airtable bases.',
        requiresWriteScope: true,
      },
      {
        id: 'read-records',
        label: 'Read Records',
        description: 'Query Airtable data.',
        requiresWriteScope: false,
      },
    ],
    defaultSecurityTier: 'sandbox',
    marketTags: ['database', 'airtable', 'data', 'spreadsheet'],
  },
  {
    id: 'supabase',
    name: 'Supabase',
    description: 'Open source Firebase alternative with PostgreSQL database.',
    category: 'database',
    icon: '⚡',
    docsUrl: 'https://supabase.com/docs',
    oauth: {
      authorizationUrl: 'https://app.supabase.com/oauth/authorize',
      tokenUrl: 'https://api.supabase.com/oauth/token',
      scopes: ['all'],
    },
    capabilities: [
      {
        id: 'query-database',
        label: 'Query Database',
        description: 'Execute database queries.',
        requiresWriteScope: false,
      },
    ],
    defaultSecurityTier: 'sandbox',
    marketTags: ['database', 'supabase', 'postgres', 'backend'],
  },

  // Productivity & Notes (already added earlier, keeping existing ones)
  {
    id: 'apple-notes',
    name: 'Apple Notes',
    description: 'Create and manage notes with Apple Notes.',
    category: 'notes',
    icon: '📔',
    docsUrl: 'https://developer.apple.com/documentation/notesapp',
    oauth: {
      authorizationUrl: 'https://appleid.apple.com/auth/authorize',
      tokenUrl: 'https://appleid.apple.com/auth/token',
      scopes: ['notes.read', 'notes.write'],
    },
    capabilities: [
      {
        id: 'create-note',
        label: 'Create Note',
        description: 'Create and update notes.',
        requiresWriteScope: true,
      },
    ],
    defaultSecurityTier: 'sandbox',
    marketTags: ['notes', 'apple', 'productivity'],
  },
  {
    id: 'notion',
    name: 'Notion',
    description: 'Create pages, databases, and manage workspace content.',
    category: 'notes',
    icon: '📓',
    docsUrl: 'https://developers.notion.com',
    oauth: {
      authorizationUrl: 'https://api.notion.com/v1/oauth/authorize',
      tokenUrl: 'https://api.notion.com/v1/oauth/token',
      scopes: ['read', 'write'],
    },
    capabilities: [
      {
        id: 'create-page',
        label: 'Create Page',
        description: 'Create and update Notion pages.',
        requiresWriteScope: true,
      },
      {
        id: 'query-database',
        label: 'Query Database',
        description: 'Query and filter Notion databases.',
        requiresWriteScope: false,
      },
    ],
    defaultSecurityTier: 'sandbox',
    marketTags: ['notes', 'notion', 'productivity', 'workspace'],
  },
  {
    id: 'evernote',
    name: 'Evernote',
    description: 'Note-taking and organization platform.',
    category: 'notes',
    icon: '🐘',
    docsUrl: 'https://dev.evernote.com',
    oauth: {
      authorizationUrl: 'https://www.evernote.com/OAuth.action',
      tokenUrl: 'https://www.evernote.com/oauth',
      scopes: ['basic'],
    },
    capabilities: [
      {
        id: 'create-note',
        label: 'Create Note',
        description: 'Create notes in Evernote.',
        requiresWriteScope: true,
      },
    ],
    defaultSecurityTier: 'sandbox',
    marketTags: ['notes', 'evernote', 'productivity'],
  },
]

const initialMockAccounts: IntegrationAccount[] = []

const initialMockBindings: IntegrationBinding[] = []

let mockData = {
  providers: mockProviders,
  accounts: [...initialMockAccounts],
  bindings: [...initialMockBindings],
}

type CustomProviderOptions = {
  displayName?: string
  icon?: string
  category?: IntegrationProviderMeta['category']
  scopes?: string[]
}

type CustomConnectionOptions = CustomProviderOptions & {
  accountName?: string
  metadata?: Record<string, unknown>
  credentials?: Record<string, unknown>
  connectionId?: string
}

function normalizeAppUrl(appUrl: string): URL {
  let candidate = appUrl.trim()
  if (!candidate) {
    throw new Error('App URL is required')
  }
  if (!/^https?:\/\//i.test(candidate)) {
    candidate = `https://${candidate}`
  }
  try {
    return new URL(candidate)
  } catch (error) {
    throw new Error('Invalid app URL')
  }
}

function slugifyHost(host: string): string {
  return host
    .toLowerCase()
    .replace(/^www\./, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function createCustomProviderMeta(url: URL, options: CustomProviderOptions = {}): IntegrationProviderMeta {
  const host = url.hostname.replace(/^www\./, '')
  const providerId = `custom-${slugifyHost(url.hostname)}` as IntegrationProviderId
  const name = options.displayName?.trim() || `${host.charAt(0).toUpperCase()}${host.slice(1)} App`
  const authorizationUrl = url.origin
  const tokenUrl = `${url.origin.replace(/\/$/, '')}/oauth/token`
  const scopes = options.scopes && options.scopes.length > 0 ? options.scopes : ['offline_access', 'custom:read', 'custom:write']

  return {
    id: providerId,
    name,
    description: `Custom connector for ${host}`,
    category: options.category ?? 'custom',
    icon: options.icon,
    docsUrl: url.origin,
    oauth: {
      authorizationUrl,
      tokenUrl,
      scopes,
    },
    capabilities: [
      {
        id: 'custom',
        label: 'Custom Actions',
        description: 'User-defined integration actions exposed by the connected app.',
        requiresWriteScope: true,
      },
    ],
    defaultSecurityTier: 'sandbox',
    marketTags: Array.from(new Set(['custom', host])),
  }
}

function upsertMockProvider(provider: IntegrationProviderMeta) {
  const exists = mockData.providers.some(item => item.id === provider.id)
  mockData = {
    ...mockData,
    providers: exists
      ? mockData.providers.map(item => (item.id === provider.id ? provider : item))
      : [...mockData.providers, provider],
  }
}

function upsertMockAccount(account: IntegrationAccount) {
  const exists = mockData.accounts.some(item => item.id === account.id)
  mockData = {
    ...mockData,
    accounts: exists
      ? mockData.accounts.map(item => (item.id === account.id ? cloneAccount(account) : item))
      : [...mockData.accounts, cloneAccount(account)],
  }
}

function cloneAccount(account: IntegrationAccount): IntegrationAccount {
  return {
    ...account,
    metadata: { ...account.metadata },
    notices: account.notices ? [...account.notices] : undefined,
    scopes: [...account.scopes],
  }
}

function cloneBinding(binding: IntegrationBinding): IntegrationBinding {
  return {
    ...binding,
    config: {
      ...binding.config,
      settings: { ...binding.config.settings },
      summary: binding.config.summary,
    },
    runtimeOptions: binding.runtimeOptions ? { ...binding.runtimeOptions } : undefined,
  }
}

function cloneProviders(providers: IntegrationProviderMeta[]): IntegrationProviderMeta[] {
  return providers.map(provider => ({
    ...provider,
    capabilities: provider.capabilities.map(capability => ({ ...capability })),
    oauth: provider.oauth
      ? {
          ...provider.oauth,
          scopes: [...provider.oauth.scopes],
        }
      : undefined,
    marketTags: [...provider.marketTags],
  }))
}

function shouldFallbackToMock(error?: unknown): boolean {
  if (FORCE_MOCK) return true
  if (!error) return false
  return (
    error instanceof Error &&
    (error.message.includes('API endpoint not available') || error.message.includes('Unable to connect to API server'))
  )
}

function getMockProviders(): IntegrationProviderMeta[] {
  return cloneProviders(mockData.providers)
}

function getMockAccounts(): IntegrationAccount[] {
  return mockData.accounts.map(cloneAccount)
}

function getMockBindings(): IntegrationBinding[] {
  return mockData.bindings.map(cloneBinding)
}

function mockConnectAccount(providerId: IntegrationProviderId, payload: Record<string, unknown>): IntegrationAccount {
  const provider = mockData.providers.find(p => p.id === providerId)
  const payloadMetadata =
    payload && typeof payload === 'object' && 'metadata' in payload
      ? ((payload as { metadata?: Record<string, unknown> }).metadata ?? {})
      : {}

  const account: IntegrationAccount = {
    id: generateId('acct'),
    providerId,
    providerName: provider?.name ?? providerId,
    status: 'connected',
    lastCheckedAt: new Date().toISOString(),
    connectedAt: new Date().toISOString(),
    displayName: String(
      (payload && typeof payload === 'object' && 'displayName' in payload
        ? (payload as { displayName?: unknown }).displayName
        : provider?.name ?? 'New Integration Account')
    ),
    scopes:
      provider?.capabilities.map(cap =>
        cap.requiresWriteScope ? `${cap.id}:write` : `${cap.id}:read`
      ) ?? ['default:read'],
    securityTier: provider?.defaultSecurityTier ?? 'sandbox',
    metadata: {
      workspaceName: provider?.name ? `${provider.name} Workspace` : 'Workspace',
      region: 'us-east-1',
      ...payloadMetadata,
    },
    isVerified: provider?.defaultSecurityTier === 'production',
    notices:
      provider?.defaultSecurityTier === 'sandbox'
        ? ['Mock connection using sandbox scopes']
        : undefined,
  }

  mockData = {
    ...mockData,
    accounts: [...mockData.accounts.filter(acc => acc.id !== account.id), account],
  }
  return cloneAccount(account)
}

function mockRefreshAccount(accountId: string): IntegrationAccount | null {
  const existing = mockData.accounts.find(account => account.id === accountId)
  if (!existing) return null
  const updated: IntegrationAccount = {
    ...existing,
    status: 'connected',
    lastCheckedAt: new Date().toISOString(),
    notices: existing.notices?.filter(note => !note.includes('Awaiting')), // clear pending notice
  }
  mockData = {
    ...mockData,
    accounts: mockData.accounts.map(account => (account.id === accountId ? updated : account)),
  }
  return cloneAccount(updated)
}

function mockDisconnectAccount(accountId: string) {
  mockData = {
    ...mockData,
    accounts: mockData.accounts.filter(account => account.id !== accountId),
    bindings: mockData.bindings.filter(binding => binding.accountId !== accountId),
  }
}

function mockUpsertBinding(binding: IntegrationBinding): IntegrationBinding {
  const id = binding.id ?? generateId('binding')
  const base: IntegrationBinding = {
    ...binding,
    id,
    createdAt: binding.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    config: {
      ...binding.config,
      settings: { ...binding.config.settings },
      summary: binding.config.summary,
    },
  }

  const exists = mockData.bindings.some(b => b.id === id)
  mockData = {
    ...mockData,
    bindings: exists
      ? mockData.bindings.map(b => (b.id === id ? base : b))
      : [...mockData.bindings, base],
  }
  return cloneBinding(base)
}

function mockDeleteBinding(bindingId: string) {
  mockData = {
    ...mockData,
    bindings: mockData.bindings.filter(binding => binding.id !== bindingId),
  }
}

export const integrationStore = createStore<IntegrationStateSnapshot>('integration', {
  value: initialState,
})

function syncWorkstate(snapshot: IntegrationStateSnapshot) {
  sessionActions.updateWorkState({
    integrationState: {
      accountIds: snapshot.accounts.map(account => account.id),
      bindingIds: snapshot.bindings.map(binding => binding.id),
      draftIds: snapshot.drafts.map(draft => draft.bindingId ?? draft.tempId),
      lastSyncedAt: snapshot.lastSyncedAt,
    },
  })
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
      ...init,
    })

    const contentType = response.headers.get('content-type') ?? ''
    const isJson = contentType.includes('json')
    const body = response.status === 204 ? '' : await response.text()

    if (!response.ok) {
      if (contentType.includes('text/html') || body.trim().startsWith('<')) {
        throw new Error(`API endpoint not available: ${API_BASE}${path}`)
      }
      throw new Error(body || `Request failed (${response.status})`)
    }

    if (!body) {
      return undefined as T
    }

    if (!isJson) {
      if (body.trim().startsWith('<')) {
        throw new Error(`API endpoint returned HTML instead of JSON: ${API_BASE}${path}`)
      }
      throw new Error(`Unexpected response format from ${API_BASE}${path}`)
    }

    try {
      return JSON.parse(body) as T
    } catch (error) {
      throw new Error(`Invalid JSON response from ${API_BASE}${path}`)
    }
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error(`Unable to connect to API server at ${API_BASE}`)
    }
    throw error
  }
}

function updateStore(partial: Partial<IntegrationStateSnapshot>) {
  const current = integrationStore.get()
  const next = {
    ...current,
    ...partial,
  }
  integrationStore.set(next)
  syncWorkstate(next)
}

function ensureCustomProviderInStore(appUrl: string, options: CustomProviderOptions = {}): IntegrationProviderMeta {
  const url = normalizeAppUrl(appUrl)
  const template = createCustomProviderMeta(url, options)
  const state = integrationStore.get()
  const existing = state.providers.find(provider => provider.id === template.id)

  let provider = template

  if (existing) {
    const merged: IntegrationProviderMeta = {
      ...existing,
      name: options.displayName?.trim() || existing.name,
      icon: options.icon ?? existing.icon,
      category: options.category ?? existing.category,
      docsUrl: template.docsUrl,
      oauth: template.oauth ?? existing.oauth,
      capabilities: existing.capabilities.length ? existing.capabilities : template.capabilities,
      marketTags: Array.from(new Set([...(existing.marketTags ?? []), ...(template.marketTags ?? [])])),
    }

    if (options.scopes && merged.oauth) {
      merged.oauth = {
        ...merged.oauth,
        scopes: options.scopes,
      }
    }

    const hasChanged =
      merged.name !== existing.name ||
      merged.icon !== existing.icon ||
      merged.category !== existing.category ||
      (merged.oauth?.authorizationUrl ?? '') !== (existing.oauth?.authorizationUrl ?? '') ||
      (merged.oauth?.tokenUrl ?? '') !== (existing.oauth?.tokenUrl ?? '') ||
      (merged.oauth && existing.oauth
        ? merged.oauth.scopes.join(',') !== existing.oauth.scopes.join(',')
        : merged.oauth !== existing.oauth) ||
      merged.marketTags.join(',') !== existing.marketTags.join(',')

    provider = merged

    if (hasChanged) {
      updateStore({
        providers: state.providers.map(item => (item.id === provider.id ? provider : item)),
      })
    }
  } else {
    updateStore({
      providers: [...state.providers, provider],
    })
  }

  upsertMockProvider(provider)
  return provider
}

function connectCustomAppInStore(appUrl: string, options: CustomConnectionOptions = {}) {
  const url = normalizeAppUrl(appUrl)
  const provider = ensureCustomProviderInStore(url.toString(), options)
  const state = integrationStore.get()
  const now = new Date().toISOString()

  const baseMetadata: Record<string, unknown> = {
    appUrl: url.origin + url.pathname.replace(/\/$/, ''),
    baseUrl: url.origin,
    domain: url.hostname,
    connectionUrl: url.toString(),
    connectionType: 'custom-url',
    ...(options.metadata ?? {}),
  }

  if (options.credentials) {
    baseMetadata.credentials = options.credentials
  }

  if (options.connectionId) {
    baseMetadata.connectionId = options.connectionId
  }

  const scopes = options.scopes && options.scopes.length > 0
    ? options.scopes
    : provider.oauth?.scopes ?? ['custom:read', 'custom:write']

  const accountName = options.accountName?.trim() || options.displayName?.trim() || provider.name

  const draft: IntegrationAccount = {
    id: generateId('acct'),
    providerId: provider.id,
    providerName: provider.name,
    status: 'connected',
    lastCheckedAt: now,
    connectedAt: now,
    displayName: accountName,
    scopes,
    securityTier: provider.defaultSecurityTier,
    metadata: baseMetadata,
    isVerified: provider.defaultSecurityTier === 'production',
    notices: ['Connected via custom URL handshake'],
  }

  const existingIndex = state.accounts.findIndex(account => {
    if (account.providerId !== provider.id) return false
    const metadata = account.metadata ?? {}
    const appUrlMatch = typeof metadata.appUrl === 'string' && metadata.appUrl === draft.metadata.appUrl
    const connectionUrlMatch = typeof metadata.connectionUrl === 'string' && metadata.connectionUrl === draft.metadata.connectionUrl
    return appUrlMatch || connectionUrlMatch
  })

  let accountRecord: IntegrationAccount
  let accounts: IntegrationAccount[]

  if (existingIndex >= 0) {
    const previous = state.accounts[existingIndex]
    accountRecord = {
      ...previous,
      ...draft,
      id: previous.id,
      connectedAt: previous.connectedAt ?? draft.connectedAt,
      metadata: { ...previous.metadata, ...draft.metadata },
      scopes: Array.from(new Set([...previous.scopes, ...draft.scopes])),
      notices: Array.from(new Set([...(previous.notices ?? []), ...(draft.notices ?? [])])),
      isVerified: previous.isVerified || draft.isVerified,
    }
    accounts = state.accounts.map((account, idx) => (idx === existingIndex ? accountRecord : account))
  } else {
    accountRecord = draft
    accounts = [...state.accounts, accountRecord]
  }

  updateStore({
    accounts,
    syncing: false,
    error: undefined,
    lastSyncedAt: now,
  })

  upsertMockAccount(accountRecord)

  return { provider, account: accountRecord }
}

export const integrationActions = {
  async loadProviders() {
    updateStore({ syncing: true, error: undefined })
    if (shouldFallbackToMock()) {
      const providers = getMockProviders()
      updateStore({ providers, syncing: false, lastSyncedAt: new Date().toISOString(), error: undefined })
      return providers
    }

    try {
      const providers = await request<IntegrationProviderMeta[]>('/providers')
      updateStore({ providers, syncing: false, lastSyncedAt: new Date().toISOString() })
      return providers
    } catch (error) {
      if (shouldFallbackToMock(error)) {
        console.warn('[Integrations] Falling back to mock providers', error)
        const providers = getMockProviders()
        updateStore({ providers, syncing: false, lastSyncedAt: new Date().toISOString(), error: undefined })
        return providers
      }
      console.error('[Integrations] Failed to load providers', error)
      updateStore({ syncing: false, error: error instanceof Error ? error.message : String(error) })
      throw error
    }
  },

  async syncAccountsAndBindings() {
    updateStore({ syncing: true, error: undefined })
    if (shouldFallbackToMock()) {
      const accounts = getMockAccounts()
      const bindings = getMockBindings()
      updateStore({
        accounts,
        bindings,
        syncing: false,
        lastSyncedAt: new Date().toISOString(),
        error: undefined,
      })
      return { accounts, bindings }
    }

    try {
      const [{ accounts }, { bindings }] = await Promise.all([
        request<{ accounts: IntegrationAccount[] }>('/accounts'),
        request<{ bindings: IntegrationBinding[] }>('/bindings'),
      ])

      updateStore({
        accounts,
        bindings,
        syncing: false,
        lastSyncedAt: new Date().toISOString(),
      })
      return { accounts, bindings }
    } catch (error) {
      if (shouldFallbackToMock(error)) {
        console.warn('[Integrations] Falling back to mock accounts/bindings', error)
        const accounts = getMockAccounts()
        const bindings = getMockBindings()
        updateStore({
          accounts,
          bindings,
          syncing: false,
          lastSyncedAt: new Date().toISOString(),
          error: undefined,
        })
        return { accounts, bindings }
      }
      console.error('[Integrations] Failed to sync accounts/bindings', error)
      updateStore({ syncing: false, error: error instanceof Error ? error.message : String(error) })
      throw error
    }
  },

  async connectAccount(providerId: IntegrationProviderId, payload: Record<string, unknown> = {}) {
    updateStore({ syncing: true, error: undefined })
    
    // Find the provider configuration
    const state = integrationStore.get()
    const provider = state.providers.find(p => p.id === providerId)
    
    if (!provider) {
      updateStore({ syncing: false, error: `Provider ${providerId} not found` })
      throw new Error(`Provider ${providerId} not found`)
    }

    // If provider has OAuth configuration, attempt real OAuth flow
    if (provider.oauth) {
      const { authorizationUrl, scopes } = provider.oauth
      
      // Check if we have a client ID configured for this provider
      const clientIdEnvVar = `VITE_${providerId.toUpperCase().replace(/-/g, '_')}_CLIENT_ID`
      const clientId = (import.meta.env as any)[clientIdEnvVar]
      
      if (!clientId) {
        console.warn(`[Integrations] No OAuth client ID found for ${providerId}. Set ${clientIdEnvVar} in .env to enable real OAuth.`)
        console.warn('[Integrations] Falling back to mock account creation for demo purposes.')
        
        // Create mock account with explanatory notice
        const account = mockConnectAccount(providerId, payload)
        account.notices = [
          ...(account.notices || []),
          `Demo mode: Set ${clientIdEnvVar} for real OAuth`,
        ]
        
        updateStore({
          accounts: [...state.accounts.filter(acc => acc.id !== account.id), account],
          syncing: false,
          error: undefined,
          lastSyncedAt: new Date().toISOString(),
        })
        return account
      }
      
      // Generate state parameter for CSRF protection
      const stateToken = generateId('oauth-state')
      sessionStorage.setItem('oauth_state', stateToken)
      sessionStorage.setItem('oauth_provider', providerId)
      
      // Build authorization URL with real client ID
      const redirectUri = `${window.location.origin}/oauth/callback`
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        scope: scopes.join(' '),
        state: stateToken,
        response_type: 'code',
      })
      
      const fullAuthUrl = `${authorizationUrl}?${params.toString()}`
      
      console.log('[Integrations] 🚀 Initiating real OAuth flow for:', provider.name)
      console.log('[Integrations] Authorization URL:', fullAuthUrl)
      console.log('[Integrations] Client ID:', clientId)
      console.log('[Integrations] Redirect URI:', redirectUri)
      console.log('[Integrations] Scopes:', scopes.join(', '))
      
      // Store syncing state will be cleared by OAuth callback
      updateStore({ syncing: false })
      
      // Redirect user to provider's authorization page
      window.location.href = fullAuthUrl
      
      // Return a pending indicator (actual account creation happens after callback)
      return { id: 'pending', providerId } as IntegrationAccount
    }

    // Fallback to API call if no OAuth configuration
    try {
      const { account } = await request<{ account: IntegrationAccount }>(`/providers/${providerId}/connect`, {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      updateStore({
        accounts: [...state.accounts.filter(acc => acc.id !== account.id), account],
        syncing: false,
        lastSyncedAt: new Date().toISOString(),
      })
      return account
    } catch (error) {
      if (shouldFallbackToMock(error)) {
        console.warn('[Integrations] Falling back to mock connect account', error)
        const account = mockConnectAccount(providerId, payload)
        updateStore({
          accounts: [...state.accounts.filter(acc => acc.id !== account.id), account],
          syncing: false,
          error: undefined,
          lastSyncedAt: new Date().toISOString(),
        })
        return account
      }
      console.error('[Integrations] Failed to connect account', error)
      updateStore({ syncing: false, error: error instanceof Error ? error.message : String(error) })
      throw error
    }
  },

  async refreshAccount(accountId: string) {
    if (shouldFallbackToMock()) {
      const refreshed = mockRefreshAccount(accountId)
      if (!refreshed) {
        const message = `Mock account ${accountId} not found`
        updateStore({ error: message })
        throw new Error(message)
      }
      const state = integrationStore.get()
      updateStore({
        accounts: state.accounts.some(acc => acc.id === accountId)
          ? state.accounts.map(acc => (acc.id === accountId ? refreshed : acc))
          : [...state.accounts, refreshed],
        error: undefined,
      })
      return refreshed
    }

    try {
      const { account } = await request<{ account: IntegrationAccount }>(`/accounts/${accountId}/refresh`, {
        method: 'POST',
      })

      const state = integrationStore.get()
      updateStore({
        accounts: state.accounts.map(acc => (acc.id === accountId ? account : acc)),
      })
      return account
    } catch (error) {
      if (shouldFallbackToMock(error)) {
        console.warn('[Integrations] Falling back to mock refresh account', error)
        const refreshed = mockRefreshAccount(accountId)
        if (!refreshed) {
          const message = `Mock account ${accountId} not found`
          updateStore({ error: message })
          throw new Error(message)
        }
        const state = integrationStore.get()
        updateStore({
          accounts: state.accounts.some(acc => acc.id === accountId)
            ? state.accounts.map(acc => (acc.id === accountId ? refreshed : acc))
            : [...state.accounts, refreshed],
          error: undefined,
        })
        return refreshed
      }
      console.error('[Integrations] Failed to refresh account', error)
      updateStore({ error: error instanceof Error ? error.message : String(error) })
      throw error
    }
  },

  async disconnectAccount(accountId: string) {
    if (shouldFallbackToMock()) {
      mockDisconnectAccount(accountId)
      const state = integrationStore.get()
      updateStore({
        accounts: state.accounts.filter(account => account.id !== accountId),
        bindings: state.bindings.filter(binding => binding.accountId !== accountId),
        error: undefined,
      })
      return
    }

    try {
      await request<void>(`/accounts/${accountId}`, { method: 'DELETE' })
      const state = integrationStore.get()
      updateStore({
        accounts: state.accounts.filter(account => account.id !== accountId),
        bindings: state.bindings.filter(binding => binding.accountId !== accountId),
      })
    } catch (error) {
      if (shouldFallbackToMock(error)) {
        console.warn('[Integrations] Falling back to mock disconnect account', error)
        mockDisconnectAccount(accountId)
        const state = integrationStore.get()
        updateStore({
          accounts: state.accounts.filter(account => account.id !== accountId),
          bindings: state.bindings.filter(binding => binding.accountId !== accountId),
          error: undefined,
        })
        return
      }
      console.error('[Integrations] Failed to disconnect account', error)
      updateStore({ error: error instanceof Error ? error.message : String(error) })
      throw error
    }
  },

  async upsertBinding(binding: IntegrationBinding) {
    if (shouldFallbackToMock()) {
      const saved = mockUpsertBinding(binding)
      const state = integrationStore.get()
      const exists = state.bindings.some(b => b.id === saved.id)
      updateStore({
        bindings: exists
          ? state.bindings.map(b => (b.id === saved.id ? saved : b))
          : [...state.bindings, saved],
        error: undefined,
      })
      return saved
    }

    try {
      const { binding: saved } = await request<{ binding: IntegrationBinding }>(`/bindings/${binding.id ?? 'new'}`, {
        method: binding.id ? 'PUT' : 'POST',
        body: JSON.stringify({ binding }),
      })

      const state = integrationStore.get()
      const exists = state.bindings.some(b => b.id === saved.id)
      updateStore({
        bindings: exists
          ? state.bindings.map(b => (b.id === saved.id ? saved : b))
          : [...state.bindings, saved],
      })
      return saved
    } catch (error) {
      if (shouldFallbackToMock(error)) {
        console.warn('[Integrations] Falling back to mock upsert binding', error)
        const saved = mockUpsertBinding(binding)
        const state = integrationStore.get()
        const exists = state.bindings.some(b => b.id === saved.id)
        updateStore({
          bindings: exists
            ? state.bindings.map(b => (b.id === saved.id ? saved : b))
            : [...state.bindings, saved],
          error: undefined,
        })
        return saved
      }
      console.error('[Integrations] Failed to upsert binding', error)
      updateStore({ error: error instanceof Error ? error.message : String(error) })
      throw error
    }
  },

  async deleteBinding(bindingId: string) {
    if (shouldFallbackToMock()) {
      mockDeleteBinding(bindingId)
      const state = integrationStore.get()
      updateStore({
        bindings: state.bindings.filter(binding => binding.id !== bindingId),
        error: undefined,
      })
      return
    }

    try {
      await request<void>(`/bindings/${bindingId}`, { method: 'DELETE' })
      const state = integrationStore.get()
      updateStore({ bindings: state.bindings.filter(binding => binding.id !== bindingId) })
    } catch (error) {
      if (shouldFallbackToMock(error)) {
        console.warn('[Integrations] Falling back to mock delete binding', error)
        mockDeleteBinding(bindingId)
        const state = integrationStore.get()
        updateStore({
          bindings: state.bindings.filter(binding => binding.id !== bindingId),
          error: undefined,
        })
        return
      }
      console.error('[Integrations] Failed to delete binding', error)
      updateStore({ error: error instanceof Error ? error.message : String(error) })
      throw error
    }
  },

  ensureCustomProvider(appUrl: string, options: CustomProviderOptions = {}) {
    return ensureCustomProviderInStore(appUrl, options)
  },

  connectCustomApp(appUrl: string, options: CustomConnectionOptions = {}) {
    return connectCustomAppInStore(appUrl, options)
  },

  createDraft(scope: IntegrationDraft['scope'], options: Partial<IntegrationDraft> = {}) {
    const draft: IntegrationDraft = {
      tempId: generateId('integration-draft'),
      providerId: options.providerId ?? null,
      capabilityId: options.capabilityId ?? null,
      accountId: options.accountId ?? null,
      scope,
      nodeId: options.nodeId,
      configuration: options.configuration ?? {},
      validationErrors: [],
    }

    const state = integrationStore.get()
    updateStore({ drafts: [...state.drafts, draft] })
    return draft
  },

  updateDraft(tempId: string, patch: Partial<Omit<IntegrationDraft, 'tempId'>>) {
    const state = integrationStore.get()
    updateStore({
      drafts: state.drafts.map(draft => (draft.tempId === tempId ? { ...draft, ...patch } : draft)),
    })
  },

  removeDraft(tempId: string) {
    const state = integrationStore.get()
    updateStore({ drafts: state.drafts.filter(draft => draft.tempId !== tempId) })
  },

  clearError() {
    updateStore({ error: undefined })
  },

  reset() {
    integrationStore.set(initialState)
    syncWorkstate(initialState)
  },
}

export const integrationSelectors = {
  getState: () => integrationStore.get(),
  getAccounts: () => integrationStore.get().accounts,
  getBindings: () => integrationStore.get().bindings,
  getProviders: () => integrationStore.get().providers,
  findAccount: (id: string) => integrationStore.get().accounts.find(account => account.id === id),
  findBindingsForNode: (nodeId: string) =>
    integrationStore.get().bindings.filter(binding => binding.nodeId === nodeId),
  isSyncing: () => integrationStore.get().syncing,
  getError: () => integrationStore.get().error,
}
