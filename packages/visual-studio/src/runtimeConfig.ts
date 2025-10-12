const stripTrailingSlash = (value: string) => value.replace(/\/$/, '')

const inferDefaultApiBase = () => {
  if (typeof window !== 'undefined') {
    const { origin } = window.location
    if (origin.includes('localhost')) {
      return 'http://localhost:3001'
    }
    return origin
  }
  return 'http://localhost:3001'
}

const rawApiBase = (import.meta.env.VITE_FORTISTATE_API_URL ?? '').trim()
const apiBaseUrl = rawApiBase ? stripTrailingSlash(rawApiBase) : stripTrailingSlash(inferDefaultApiBase())

const buildUrl = (path: string) => {
  if (!path.startsWith('/')) {
    return `${apiBaseUrl}/${path}`
  }
  return `${apiBaseUrl}${path}`
}

const rawCollabWs = (import.meta.env.VITE_FORTISTATE_COLLAB_WS_URL ?? '').trim()
const collabWsUrl = rawCollabWs
  ? rawCollabWs
  : `${apiBaseUrl.replace(/^http/i, 'ws')}/collaboration`

export const runtimeConfig = {
  apiBaseUrl,
  integrationsBaseUrl: buildUrl('/api/integrations'),
  universesBaseUrl: buildUrl('/api/universes'),
  billingBaseUrl: buildUrl('/api/billing'),
  marketplaceBaseUrl: buildUrl('/api'),
  collaborationWsUrl: collabWsUrl,
  buildUrl,
} as const

export type RuntimeConfig = typeof runtimeConfig
