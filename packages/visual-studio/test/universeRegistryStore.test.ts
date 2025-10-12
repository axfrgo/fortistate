import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest'

vi.mock('../src/session/sessionPersistence', () => ({
  sessionActions: {
    updateWorkState: vi.fn(),
  },
}))

import { universeRegistryActions, universeRegistrySelectors } from '../src/universes/universeRegistryStore'
import { sessionActions } from '../src/session/sessionPersistence'
import type { UniverseDraftMetadata, UniverseRuntimeConfig } from '../src/integrations/types'

describe('universeRegistryStore', () => {
  const originalFetch = globalThis.fetch
  const getUpdateWorkStateMock = () => sessionActions.updateWorkState as unknown as Mock

  beforeEach(() => {
    getUpdateWorkStateMock().mockClear()
    universeRegistryActions.reset()
    getUpdateWorkStateMock().mockClear()
  })

  afterEach(() => {
    if (originalFetch) {
      globalThis.fetch = originalFetch
    } else {
      // @ts-expect-error - cleaning up test-assigned fetch
      delete globalThis.fetch
    }
    vi.restoreAllMocks()
  })

  it('creates drafts and syncs session workstate', () => {
    const metadata: UniverseDraftMetadata = {
      label: 'Sales Onboarding',
      description: 'Runtime for onboarding cohorts',
      marketTags: ['sales', 'onboarding'],
    }

    const draftId = universeRegistryActions.createDraft('draft-001', metadata)

    const state = universeRegistrySelectors.getState()
    expect(Object.keys(state.drafts)).toContain(draftId)
    expect(state.drafts[draftId]).toMatchObject(metadata)

    const updateWorkState = getUpdateWorkStateMock()
    expect(updateWorkState).toHaveBeenCalled()
    const payload = updateWorkState.mock.calls.at(-1)?.[0]
    expect(payload?.universeState?.draftUniverseIds).toContain(draftId)
  })

  it('records launch activity to recent universes', () => {
    const updateWorkState = getUpdateWorkStateMock()
    const config: UniverseRuntimeConfig = {
      universeId: 'universe-123',
      versionId: 'version-alpha',
      entryNodeId: null,
      dryRun: false,
      telemetryLevel: 'standard',
      notifyOnCompletion: true,
      completionChannels: [{ type: 'email', target: 'ops@example.com' }],
    }

    universeRegistryActions.recordLaunch(config)

    const state = universeRegistrySelectors.getState()
    expect(state.recentUniverseIds[0]).toBe('universe-123')
    expect(state.lastViewedUniverseId).toBe('universe-123')

    expect(updateWorkState).toHaveBeenCalled()
    const payload = updateWorkState.mock.calls.at(-1)?.[0]
    expect(payload?.universeState?.recentUniverseIds?.[0]).toBe('universe-123')
  })

  it('launches universes through the API and updates status flags', async () => {
    const updateWorkState = getUpdateWorkStateMock()
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ launchId: 'launch-555', status: 'queued' }),
    })

    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch

    const config: UniverseRuntimeConfig = {
      universeId: 'universe-rocket',
      versionId: 'version-prod',
      entryNodeId: 'node-start',
      dryRun: false,
      telemetryLevel: 'verbose',
      notifyOnCompletion: true,
      completionChannels: [
        { type: 'slack', target: '#go-live' },
        { type: 'in-app', target: 'notifications' },
      ],
      bindingOverrides: [{ bindingId: 'bind-1', accountId: 'acct-prod' }],
    }

    const launchPromise = universeRegistryActions.launchUniverse(config)

    // launching flag should be true immediately after invoking the action
    expect(universeRegistrySelectors.getState().launching).toBe(true)

    const result = await launchPromise

    expect(result).toEqual({ launchId: 'launch-555', status: 'queued' })
    expect(fetchMock).toHaveBeenCalledWith('/api/universes/universe-rocket/launch', expect.objectContaining({
      method: 'POST',
    }))

    const state = universeRegistrySelectors.getState()
    expect(state.launching).toBe(false)
    expect(state.recentUniverseIds[0]).toBe('universe-rocket')
    expect(state.lastViewedUniverseId).toBe('universe-rocket')

    expect(updateWorkState).toHaveBeenCalled()
    const payload = updateWorkState.mock.calls.at(-1)?.[0]
    expect(payload?.universeState?.recentUniverseIds?.[0]).toBe('universe-rocket')
  })
})
