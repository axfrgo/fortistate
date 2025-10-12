import { createStore } from '../../../../src/storeFactory'
import { sessionActions } from '../session/sessionPersistence'
import { runtimeConfig } from '../runtimeConfig'
import {
  type IntegrationBinding,
  type IntegrationProviderId,
  type SavedUniverseSummary,
  type SavedUniverseVersion,
  type UniverseDraftMetadata,
  type UniverseRegistrySnapshot,
  type UniverseRuntimeConfig,
} from '../integrations/types'

const API_BASE = runtimeConfig.universesBaseUrl

const initialState: UniverseRegistrySnapshot = {
  universes: [],
  versions: {},
  drafts: {},
  recentUniverseIds: [],
  lastViewedUniverseId: null,
  loading: false,
  launching: false,
}

function generateId(prefix: string) {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

const { VITE_MOCK_API, VITE_MOCK_UNIVERSES } = import.meta.env as {
  VITE_MOCK_API?: string
  VITE_MOCK_UNIVERSES?: string
}

const FORCE_MOCK = VITE_MOCK_API === 'true' || VITE_MOCK_UNIVERSES === 'true'

const MOCK_STORAGE_KEY = 'fortistate:universes'

function deepClone<T>(value: T): T {
  if (typeof structuredClone === 'function') {
    return structuredClone(value)
  }
  return JSON.parse(JSON.stringify(value)) as T
}

interface MockUniverseData {
  universes: SavedUniverseSummary[]
  versions: Record<string, SavedUniverseVersion>
}

function createDefaultMockData(): MockUniverseData {
  const createdAt = new Date().toISOString()
  const universeId = 'demo-universe'
  const versionId = 'demo-version'

  const universes: SavedUniverseSummary[] = [
    {
      id: universeId,
      label: 'Sample Automation Universe',
      description: 'Offline sample universe generated locally for demos and quick iteration.',
      icon: '🪐',
      createdAt,
      updatedAt: createdAt,
      ownerId: 'local-user',
      marketTags: ['offline', 'demo'],
      activeVersionId: versionId,
      versionIds: [versionId],
  integrationCounts: {} as Record<IntegrationProviderId, number>,
    },
  ]

  const versions: Record<string, SavedUniverseVersion> = {
    [`${universeId}:${versionId}`]: {
      id: versionId,
      label: 'Initial Draft',
      description: 'Base universe blueprint available when the platform API is offline.',
      createdAt,
      createdBy: 'local-user',
      canvasState: {
        nodes: [
          {
            id: 'welcome-node',
            type: 'workflow:start',
            position: { x: 0, y: 0 },
            data: { label: 'Welcome to Fortistate' },
            width: 320,
            height: 180,
          },
        ],
        edges: [],
        viewport: { x: 0, y: 0, zoom: 1 },
      },
      bindings: [],
    },
  }

  return { universes, versions }
}

function loadMockData(): MockUniverseData {
  const fallback = createDefaultMockData()
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return fallback
  }

  try {
    const raw = window.localStorage.getItem(MOCK_STORAGE_KEY)
    if (!raw) {
      window.localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(fallback))
      return fallback
    }

    const parsed = JSON.parse(raw) as Partial<MockUniverseData>
    if (!Array.isArray(parsed.universes) || typeof parsed.versions !== 'object' || parsed.versions === null) {
      return fallback
    }

    return {
      universes: parsed.universes as SavedUniverseSummary[],
      versions: parsed.versions as Record<string, SavedUniverseVersion>,
    }
  } catch (error) {
    console.warn('[Universes] Failed to load mock universe data from storage', error)
    return fallback
  }
}

let mockData: MockUniverseData = loadMockData()

function persistMockData() {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(mockData))
  } catch (error) {
    console.warn('[Universes] Failed to persist mock universe data to storage', error)
  }
}

function getMockUniverses(): SavedUniverseSummary[] {
  return mockData.universes.map(deepClone)
}

function getMockVersions(): Record<string, SavedUniverseVersion> {
  return Object.fromEntries(
    Object.entries(mockData.versions).map(([key, version]) => [key, deepClone(version)])
  )
}

function saveMockUniverses(universes: SavedUniverseSummary[], versions: Record<string, SavedUniverseVersion>) {
  mockData = { universes: universes.map(deepClone), versions: deepClone(versions) }
  persistMockData()
}

function getMockVersion(universeId: string, versionId: string): SavedUniverseVersion | null {
  return mockData.versions[`${universeId}:${versionId}`] ? deepClone(mockData.versions[`${universeId}:${versionId}`]) : null
}

function computeIntegrationCounts(bindings: IntegrationBinding[]): Record<IntegrationProviderId, number> {
  return bindings.reduce<Record<IntegrationProviderId, number>>((acc, binding) => {
    const providerId = binding.providerId
    acc[providerId] = (acc[providerId] ?? 0) + 1
    return acc
  }, {} as Record<IntegrationProviderId, number>)
}

function saveUniverseMock(
  metadata: UniverseDraftMetadata,
  payload: {
    canvas: SavedUniverseVersion['canvasState']
    bindings: SavedUniverseVersion['bindings']
    ownerId?: string
    createdBy?: string
  }
) {
  const now = new Date().toISOString()
  const existing = mockData.universes.find(universe => universe.label === metadata.label)
  const universeId = existing?.id ?? generateId('mock-universe')
  const versionId = generateId('mock-version')

  const universe: SavedUniverseSummary = {
    id: universeId,
    label: metadata.label,
    description: metadata.description,
    icon: metadata.icon,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    ownerId: payload.ownerId ?? existing?.ownerId ?? 'local-user',
    activeVersionId: versionId,
    versionIds: Array.from(new Set([versionId, ...(existing?.versionIds ?? [])])),
    integrationCounts: computeIntegrationCounts(payload.bindings),
    marketTags: metadata.marketTags,
  }

  const version: SavedUniverseVersion = {
    id: versionId,
    label: metadata.label || 'Untitled Version',
    description: metadata.description,
    createdAt: now,
    createdBy: payload.createdBy ?? payload.ownerId ?? 'local-user',
    canvasState: deepClone(payload.canvas),
    bindings: deepClone(payload.bindings),
  }

  const versions = { ...mockData.versions, [`${universeId}:${versionId}`]: version }
  const universes = [universe, ...mockData.universes.filter(item => item.id !== universeId)]

  mockData = { universes, versions }
  persistMockData()

  return { universe: deepClone(universe), version: deepClone(version) }
}

function deleteUniverseMock(universeId: string) {
  mockData = {
    universes: mockData.universes.filter(universe => universe.id !== universeId),
    versions: Object.fromEntries(
      Object.entries(mockData.versions).filter(([key]) => !key.startsWith(`${universeId}:`))
    ),
  }
  persistMockData()
}

function shouldFallbackToMock(error?: unknown): boolean {
  if (FORCE_MOCK) return true
  if (!error) return false
  if (error instanceof Error) {
    const message = error.message
    return (
      message.includes('API endpoint not available') ||
      message.includes('Unable to connect to API server') ||
      message.includes('Failed to fetch') ||
      message.includes('NetworkError')
    )
  }
  return false
}

function computeRecentUniverseIds(
  universes: SavedUniverseSummary[],
  previous: string[]
): string[] {
  return Array.from(
    new Set<string>([
      ...universes
        .slice()
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 8)
        .map(universe => universe.id),
      ...previous,
    ])
  ).slice(0, 12)
}


export const universeRegistryStore = createStore<UniverseRegistrySnapshot>('universeRegistry', {
  value: initialState,
})

function syncWorkstate(snapshot: UniverseRegistrySnapshot) {
  sessionActions.updateWorkState({
    universeState: {
      activeUniverseId: snapshot.lastViewedUniverseId,
      lastViewedUniverseId: snapshot.lastViewedUniverseId,
      recentUniverseIds: snapshot.recentUniverseIds,
      draftUniverseIds: Object.keys(snapshot.drafts),
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

function updateStore(patch: Partial<UniverseRegistrySnapshot>) {
  const current = universeRegistryStore.get()
  const next = {
    ...current,
    ...patch,
  }
  universeRegistryStore.set(next)
  syncWorkstate(next)
}

export const universeRegistryActions = {
  async loadUniverses() {
    updateStore({ loading: true, error: undefined })

    const commit = (universes: SavedUniverseSummary[], versions: Record<string, SavedUniverseVersion>) => {
      const state = universeRegistryStore.get()
      const recent = computeRecentUniverseIds(universes, state.recentUniverseIds)
      updateStore({ universes, versions, loading: false, recentUniverseIds: recent, error: undefined })
    }

    if (FORCE_MOCK) {
      const universes = getMockUniverses()
      const versions = getMockVersions()
      commit(universes, versions)
      return universes
    }

    try {
      const { universes } = await request<{ universes: SavedUniverseSummary[] }>('/')
      const allowedVersionKeys = new Set(
        universes.flatMap(universe => universe.versionIds.map(versionId => `${universe.id}:${versionId}`))
      )
      const state = universeRegistryStore.get()
      const filteredVersions = Object.fromEntries(
        Object.entries(state.versions).filter(([key]) => allowedVersionKeys.has(key))
      )
      commit(universes, filteredVersions)
      return universes
    } catch (error) {
      if (shouldFallbackToMock(error)) {
        console.warn('[Universes] Falling back to mock universes', error)
        const universes = getMockUniverses()
        const versions = getMockVersions()
        commit(universes, versions)
        return universes
      }
      console.error('[Universes] Failed to load universes', error)
      updateStore({ loading: false, error: error instanceof Error ? error.message : String(error) })
      throw error
    }
  },

  async loadUniverseVersion(universeId: string, versionId: string) {
    const commit = (version: SavedUniverseVersion) => {
      const state = universeRegistryStore.get()
      updateStore({
        versions: {
          ...state.versions,
          [`${universeId}:${versionId}`]: version,
        },
        error: undefined,
      })
      return version
    }

    if (FORCE_MOCK) {
      const version = getMockVersion(universeId, versionId)
      if (!version) {
        const message = `Mock universe version ${versionId} for ${universeId} not found`
        updateStore({ error: message })
        throw new Error(message)
      }
      return commit(version)
    }

    try {
      const { version } = await request<{ version: SavedUniverseVersion }>(`/${universeId}/versions/${versionId}`)
      return commit(version)
    } catch (error) {
      if (shouldFallbackToMock(error)) {
        console.warn('[Universes] Falling back to mock version', error)
        const version = getMockVersion(universeId, versionId)
        if (!version) {
          const message = `Mock universe version ${versionId} for ${universeId} not found`
          updateStore({ error: message })
          throw new Error(message)
        }
        return commit(version)
      }
      console.error('[Universes] Failed to load version', error)
      updateStore({ error: error instanceof Error ? error.message : String(error) })
      throw error
    }
  },

  createDraft(draftId: string = generateId('universe-draft'), data: UniverseDraftMetadata) {
    const state = universeRegistryStore.get()
    updateStore({
      drafts: {
        ...state.drafts,
        [draftId]: data,
      },
    })
    return draftId
  },

  updateDraft(draftId: string, patch: Partial<UniverseDraftMetadata>) {
    const state = universeRegistryStore.get()
    if (!state.drafts[draftId]) return
    updateStore({
      drafts: {
        ...state.drafts,
        [draftId]: {
          ...state.drafts[draftId],
          ...patch,
        },
      },
    })
  },

  removeDraft(draftId: string) {
    const state = universeRegistryStore.get()
    if (!state.drafts[draftId]) return
    const { [draftId]: _, ...rest } = state.drafts
    updateStore({ drafts: rest })
  },

  async saveUniverse(
    draftId: string,
    payload: {
      canvas: SavedUniverseVersion['canvasState']
      bindings: SavedUniverseVersion['bindings']
      ownerId?: string
      createdBy?: string
    }
  ) {
    const draft = universeRegistryStore.get().drafts[draftId]
    if (!draft) throw new Error(`Draft ${draftId} not found`)

    const metadata: Record<string, unknown> = { ...draft }
    if (payload.ownerId) {
      metadata.ownerId = payload.ownerId
    }
    if (payload.createdBy) {
      metadata.createdBy = payload.createdBy
    }

    const normalizedMetadata: UniverseDraftMetadata = {
      label: typeof metadata.label === 'string' ? metadata.label : draft.label,
      description: typeof metadata.description === 'string' ? metadata.description : draft.description,
      icon: typeof metadata.icon === 'string' ? metadata.icon : draft.icon,
      marketTags: Array.isArray(metadata.marketTags) ? (metadata.marketTags as string[]) : draft.marketTags ?? [],
      targetLaunchDate:
        typeof metadata.targetLaunchDate === 'string' ? metadata.targetLaunchDate : draft.targetLaunchDate,
    }

    const commit = ({ universe, version }: { universe: SavedUniverseSummary; version: SavedUniverseVersion }) => {
      const state = universeRegistryStore.get()
      updateStore({
        universes: [...state.universes.filter(u => u.id !== universe.id), universe],
        versions: {
          ...state.versions,
          [`${universe.id}:${version.id}`]: version,
        },
        drafts: Object.keys(state.drafts)
          .filter(id => id !== draftId)
          .reduce<Record<string, UniverseDraftMetadata>>((acc, id) => {
            acc[id] = state.drafts[id]
            return acc
          }, {}),
        lastViewedUniverseId: universe.id,
        recentUniverseIds: [universe.id, ...state.recentUniverseIds.filter(id => id !== universe.id)].slice(0, 12),
        error: undefined,
      })
      return { universe, version }
    }

    const executeMockSave = () => commit(saveUniverseMock(normalizedMetadata, payload))

    if (FORCE_MOCK) {
      return executeMockSave()
    }

    try {
      const result = await request<{ universe: SavedUniverseSummary; version: SavedUniverseVersion }>('/', {
        method: 'POST',
        body: JSON.stringify({
          draftId,
          metadata,
          canvas: payload.canvas,
          bindings: payload.bindings,
          ownerId: payload.ownerId,
          createdBy: payload.createdBy,
        }),
      })

      return commit(result)
    } catch (error) {
      if (shouldFallbackToMock(error)) {
        console.warn('[Universes] Falling back to mock universe save', error)
        return executeMockSave()
      }
      console.error('[Universes] Failed to save universe', error)
      updateStore({ error: error instanceof Error ? error.message : String(error) })
      throw error
    }
  },

  async deleteUniverse(universeId: string) {
    const commit = () => {
      const state = universeRegistryStore.get()
      updateStore({
        universes: state.universes.filter(u => u.id !== universeId),
        versions: Object.fromEntries(
          Object.entries(state.versions).filter(([key]) => !key.startsWith(`${universeId}:`))
        ),
        recentUniverseIds: state.recentUniverseIds.filter(id => id !== universeId),
        lastViewedUniverseId: state.lastViewedUniverseId === universeId ? null : state.lastViewedUniverseId,
        error: undefined,
      })
    }

    if (FORCE_MOCK) {
      deleteUniverseMock(universeId)
      commit()
      return
    }

    try {
      await request<void>(`/${universeId}`, { method: 'DELETE' })
      commit()
    } catch (error) {
      if (shouldFallbackToMock(error)) {
        console.warn('[Universes] Falling back to mock universe deletion', error)
        deleteUniverseMock(universeId)
        commit()
        return
      }
      console.error('[Universes] Failed to delete universe', error)
      updateStore({ error: error instanceof Error ? error.message : String(error) })
      throw error
    }
  },

  async launchUniverse(config: UniverseRuntimeConfig) {
    const finalize = (universeId: string, launchId?: string) => {
      const state = universeRegistryStore.get()
      const recent = [universeId, ...state.recentUniverseIds.filter(id => id !== universeId)].slice(0, 12)
      
      // Update the universe to show live status
      const updatedUniverses = state.universes.map(universe => {
        if (universe.id === universeId) {
          return {
            ...universe,
            deploymentStatus: 'live' as const,
            lastLaunchedAt: new Date().toISOString(),
            activeLaunchId: launchId,
          }
        }
        return universe
      })
      
      updateStore({
        launching: false,
        recentUniverseIds: recent,
        lastViewedUniverseId: universeId,
        error: undefined,
        universes: updatedUniverses,
      })
      
      // Persist to mock storage
      saveMockUniverses(updatedUniverses, state.versions)
      // Sync with session
      syncWorkstate({
        ...state,
        universes: updatedUniverses,
      })
    }

    const executeMockLaunch = () => {
      const launchId = generateId('mock-launch')
      finalize(config.universeId, launchId)
      return { launchId, status: 'queued' as string }
    }

    updateStore({ launching: true, error: undefined })

    if (FORCE_MOCK) {
      return executeMockLaunch()
    }

    try {
      const { launchId, status } = await request<{ launchId: string; status?: string }>(
        `/${config.universeId}/launch`,
        {
          method: 'POST',
          body: JSON.stringify({ config }),
        }
      )

      finalize(config.universeId, launchId)
      return { launchId, status }
    } catch (error) {
      if (shouldFallbackToMock(error)) {
        console.warn('[Universes] Falling back to mock universe launch', error)
        return executeMockLaunch()
      }
      console.error('[Universes] Failed to launch universe', error)
      updateStore({ launching: false, error: error instanceof Error ? error.message : String(error) })
      throw error
    }
  },

  setLastViewed(universeId: string | null) {
    updateStore({ lastViewedUniverseId: universeId ?? null })
  },

  recordLaunch(config: UniverseRuntimeConfig) {
    const state = universeRegistryStore.get()
    const recent = state.recentUniverseIds.filter(id => id !== config.universeId)
    recent.unshift(config.universeId)
    updateStore({
      recentUniverseIds: recent.slice(0, 12),
      lastViewedUniverseId: config.universeId,
    })
  },

  async pauseUniverse(universeId: string) {
    const state = universeRegistryStore.get()
    const updatedUniverses = state.universes.map(universe => {
      if (universe.id === universeId) {
        return {
          ...universe,
          deploymentStatus: 'paused' as const,
        }
      }
      return universe
    })

    updateStore({ universes: updatedUniverses })
    saveMockUniverses(updatedUniverses, state.versions)
    syncWorkstate({ ...state, universes: updatedUniverses })

    // TODO: Call backend API to pause running execution
    console.log('[Universes] Paused universe:', universeId)
  },

  async stopUniverse(universeId: string) {
    const state = universeRegistryStore.get()
    const updatedUniverses = state.universes.map(universe => {
      if (universe.id === universeId) {
        return {
          ...universe,
          deploymentStatus: 'draft' as const,
          activeLaunchId: undefined,
        }
      }
      return universe
    })

    updateStore({ universes: updatedUniverses })
    saveMockUniverses(updatedUniverses, state.versions)
    syncWorkstate({ ...state, universes: updatedUniverses })

    // TODO: Call backend API to stop running execution
    console.log('[Universes] Stopped universe:', universeId)
  },

  clearError() {
    updateStore({ error: undefined })
  },

  reset() {
    universeRegistryStore.set(initialState)
    syncWorkstate(initialState)
  },
}

export const universeRegistrySelectors = {
  getState: () => universeRegistryStore.get(),
  getUniverses: () => universeRegistryStore.get().universes,
  getUniverse: (universeId: string) =>
    universeRegistryStore.get().universes.find(universe => universe.id === universeId) ?? null,
  getVersion: (universeId: string, versionId: string) =>
    universeRegistryStore.get().versions[`${universeId}:${versionId}`] ?? null,
  getDraft: (draftId: string) => universeRegistryStore.get().drafts[draftId] ?? null,
  getRecentUniverses: () => universeRegistryStore.get().recentUniverseIds,
  getLastViewedUniverseId: () => universeRegistryStore.get().lastViewedUniverseId,
  isLoading: () => universeRegistryStore.get().loading,
  getError: () => universeRegistryStore.get().error,
}
