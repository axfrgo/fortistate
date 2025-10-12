/**
 * Node Editor - Modal for editing node properties
 * Double-click any node to edit its values
 */

import { useState, useEffect, useRef, useMemo, useCallback, useSyncExternalStore } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Node } from 'reactflow'
import './NodeEditor.css'
import { integrationStore, integrationActions } from '../integrations/integrationStore'
import type {
  IntegrationAccount,
  IntegrationBinding,
  IntegrationCapabilityId,
  IntegrationProviderId,
  IntegrationProviderMeta,
  IntegrationSecurityTier,
} from '../integrations/types'
import { useWorkState } from '../session/useSession'

interface BindingEditorCardProps {
  nodeId: string
  defaultUniverseId: string
  binding?: IntegrationBinding
  accounts: IntegrationAccount[]
  providers: IntegrationProviderMeta[]
  prioritySuggestion: number
  onSaved?: () => void
  onRemoved?: () => void
}

type BindingStatus = 'idle' | 'saving' | 'success' | 'error'

function generateLocalBindingId(nodeId: string): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `draft-${nodeId}-${crypto.randomUUID()}`
  }
  return `draft-${nodeId}-${Math.random().toString(36).slice(2, 10)}`
}

function BindingEditorCard({
  nodeId,
  defaultUniverseId,
  binding,
  accounts,
  providers,
  prioritySuggestion,
  onSaved,
  onRemoved,
}: BindingEditorCardProps) {
  const [providerId, setProviderId] = useState<string>(binding?.providerId ?? '')
  const [accountId, setAccountId] = useState<string>(binding?.accountId ?? '')
  const [capabilityId, setCapabilityId] = useState<string>(binding?.config.capabilityId ?? '')
  const [summary, setSummary] = useState<string>(binding?.config.summary ?? '')
  const [environment, setEnvironment] = useState<IntegrationSecurityTier>(binding?.environment ?? 'sandbox')
  const [settings, setSettings] = useState<string>(
    () => JSON.stringify(binding?.config.settings ?? {}, null, 2)
  )
  const [status, setStatus] = useState<BindingStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  const providerOptions = providers

  const suggestedProvider = useMemo(() => {
    if (providerOptions.length === 0) return undefined
    const withAccount = providerOptions.find(provider =>
      accounts.some(account => account.providerId === provider.id)
    )
    return withAccount ?? providerOptions[0]
  }, [accounts, providerOptions])

  const activeProvider = useMemo(() => {
    if (!providerId) return undefined
    return providers.find(provider => provider.id === providerId)
  }, [providers, providerId])

  const providerAccounts = useMemo(
    () => accounts.filter(account => account.providerId === providerId),
    [accounts, providerId]
  )

  const capabilityOptions = activeProvider?.capabilities ?? []

  useEffect(() => {
    if (!binding) {
      if (!providerId && suggestedProvider) {
        setProviderId(suggestedProvider.id)
      }
      return
    }

    setProviderId(binding.providerId)
    setAccountId(binding.accountId)
    setCapabilityId(binding.config.capabilityId ?? '')
    setSummary(binding.config.summary ?? '')
    setEnvironment(binding.environment)
    setSettings(JSON.stringify(binding.config.settings ?? {}, null, 2))
    setStatus('idle')
    setError(null)
  }, [binding, providerId, suggestedProvider])

  useEffect(() => {
    if (providerAccounts.length === 0) {
      setAccountId('')
      return
    }
    if (!providerAccounts.some(account => account.id === accountId)) {
      setAccountId(providerAccounts[0].id)
    }
  }, [providerAccounts, accountId])

  useEffect(() => {
    if (capabilityOptions.length === 0) {
      setCapabilityId('')
      return
    }
    if (!capabilityOptions.some(capability => capability.id === capabilityId)) {
      setCapabilityId(capabilityOptions[0].id)
    }
  }, [capabilityOptions, capabilityId])

  const handleSave = useCallback(async () => {
    if (!providerId) {
      setError('Select a provider to continue.')
      setStatus('error')
      return
    }
    if (!accountId) {
      setError('Select a connected account for this provider.')
      setStatus('error')
      return
    }
    if (!capabilityId) {
      setError('Choose a capability to invoke.')
      setStatus('error')
      return
    }

    let settingsPayload: Record<string, unknown> = {}
    try {
      const trimmed = settings.trim()
      settingsPayload = trimmed ? (JSON.parse(trimmed) as Record<string, unknown>) : {}
    } catch (err) {
      setError('Settings must be valid JSON.')
      setStatus('error')
      return
    }

    const now = new Date().toISOString()
    const bindingId = binding?.id ?? generateLocalBindingId(nodeId)

    const payload: IntegrationBinding = {
      id: bindingId,
      scope: 'node',
      universeId: binding?.universeId ?? defaultUniverseId,
      nodeId,
      accountId,
      providerId: providerId as IntegrationProviderId,
      config: {
        capabilityId: capabilityId as IntegrationCapabilityId,
        settings: settingsPayload,
        summary: summary.trim() ? summary.trim() : undefined,
      },
      createdAt: binding?.createdAt ?? now,
      updatedAt: now,
      environment,
      priority: binding?.priority ?? prioritySuggestion,
      runtimeOptions: binding?.runtimeOptions,
    }

    setStatus('saving')
    setError(null)
    try {
      await integrationActions.upsertBinding(payload)
      setStatus('success')
      setTimeout(() => setStatus('idle'), 1600)
      onSaved?.()
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : String(err))
    }
  }, [
    accountId,
    binding?.createdAt,
    binding?.id,
    binding?.priority,
    binding?.runtimeOptions,
    binding?.universeId,
    capabilityId,
    defaultUniverseId,
    environment,
    nodeId,
    onSaved,
    prioritySuggestion,
    providerId,
    settings,
    summary,
  ])

  const handleRemove = useCallback(async () => {
    if (!binding?.id) {
      onRemoved?.()
      return
    }

    setStatus('saving')
    setError(null)
    try {
      await integrationActions.deleteBinding(binding.id)
      setStatus('idle')
      onRemoved?.()
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : String(err))
    }
  }, [binding?.id, onRemoved])

  return (
    <div className="binding-card">
      <div className="binding-card-header">
        <div>
          <h4>{binding ? 'Attached integration' : 'Attach external app'}</h4>
          <p>
            Map this node to a connected provider capability so runtime execution can call the
            external app directly.
          </p>
        </div>
        {binding?.id ? <span className="binding-id">{binding.id}</span> : null}
      </div>

      <div className="binding-grid">
        <label>
          Provider
          <select
            className="editor-input"
            value={providerId}
            onChange={event => setProviderId(event.target.value)}
          >
            <option value="">Select provider</option>
            {providerOptions.map(provider => (
              <option key={provider.id} value={provider.id}>
                {provider.name}
              </option>
            ))}
            {providerId && !providerOptions.some(provider => provider.id === providerId) ? (
              <option value={providerId}>{providerId}</option>
            ) : null}
          </select>
        </label>

        <label>
          Account
          <select
            className="editor-input"
            value={accountId}
            onChange={event => setAccountId(event.target.value)}
            disabled={!providerId || providerAccounts.length === 0}
          >
            <option value="">
              {providerId ? 'Select account' : 'Choose provider first'}
            </option>
            {providerAccounts.map(account => (
              <option key={account.id} value={account.id}>
                {account.displayName}
              </option>
            ))}
          </select>
        </label>

        <label>
          Capability
          <select
            className="editor-input"
            value={capabilityId}
            onChange={event => setCapabilityId(event.target.value)}
            disabled={capabilityOptions.length === 0}
          >
            <option value="">
              {capabilityOptions.length ? 'Select capability' : 'No capabilities available'}
            </option>
            {capabilityOptions.map(capability => (
              <option key={capability.id} value={capability.id}>
                {capability.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          Environment
          <select
            className="editor-input"
            value={environment}
            onChange={event => setEnvironment(event.target.value as IntegrationSecurityTier)}
          >
            <option value="sandbox">Sandbox</option>
            <option value="production">Production</option>
          </select>
        </label>

        <label>
          Summary (optional)
          <input
            className="editor-input"
            value={summary}
            onChange={event => setSummary(event.target.value)}
            placeholder="E.g. Generate onboarding script"
          />
        </label>

        <label className="binding-settings">
          Settings (JSON)
          <textarea
            className="editor-textarea"
            rows={6}
            value={settings}
            onChange={event => setSettings(event.target.value)}
            placeholder={`{\n  "promptTemplate": "..."\n}`}
          />
        </label>
      </div>

      <div className="binding-actions">
        <button
          type="button"
          className="editor-btn cancel"
          onClick={handleRemove}
          disabled={status === 'saving'}
        >
          {binding?.id ? (status === 'saving' ? 'Removing…' : 'Remove binding') : 'Cancel'}
        </button>
        <button
          type="button"
          className="editor-btn save"
          onClick={handleSave}
          disabled={status === 'saving'}
        >
          {binding?.id
            ? status === 'saving'
              ? 'Saving…'
              : 'Save binding'
            : status === 'saving'
            ? 'Attaching…'
            : 'Attach binding'}
        </button>
      </div>

      {status === 'success' ? <div className="binding-status success">Binding saved.</div> : null}
      {status === 'error' && error ? (
        <div className="binding-status error">{error}</div>
      ) : null}
      {!accounts.length ? (
        <div className="binding-status info">
          Connect an app in the Connection Center to make it available for binding.
        </div>
      ) : null}
    </div>
  )
}

interface NodeEditorProps {
  node: Node | null
  isOpen: boolean
  onClose: () => void
  onSave: (nodeId: string, newData: any) => void
}

export default function NodeEditor({ node, isOpen, onClose, onSave }: NodeEditorProps) {
  const [formData, setFormData] = useState<any>({})
  const [showNewBinding, setShowNewBinding] = useState(false)
  const dragBoundsRef = useRef<HTMLDivElement>(null)
  const workState = useWorkState()
  const integrationState = useSyncExternalStore(
    integrationStore.subscribe,
    integrationStore.get,
    integrationStore.get
  )
  const { accounts, providers, bindings } = integrationState
  const nodeBindings = useMemo(
    () => (node ? bindings.filter(binding => binding.nodeId === node.id) : []),
    [bindings, node?.id]
  )
  const defaultUniverseId = useMemo(() => {
    const active = workState.universeState.activeUniverseId ?? workState.currentUniverseId
    return active ?? 'workspace-draft'
  }, [workState.currentUniverseId, workState.universeState.activeUniverseId])

  useEffect(() => {
    if (node) {
      setFormData({ ...node.data })
    }
  }, [node])

  useEffect(() => {
    if (!isOpen) return
    if (providers.length === 0) {
      integrationActions
        .loadProviders()
        .catch(error => console.warn('[NodeEditor] Failed to load providers', error))
    }
    if (accounts.length === 0) {
      integrationActions
        .syncAccountsAndBindings()
        .catch(error => console.warn('[NodeEditor] Failed to sync accounts', error))
    }
  }, [accounts.length, isOpen, providers.length])

  useEffect(() => {
    if (!isOpen) {
      setShowNewBinding(false)
    }
  }, [isOpen])

  if (!node) return null

  const handleSave = () => {
    onSave(node.id, formData)
    onClose()
  }

  const handleChange = (key: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [key]: value }))
  }

  const renderField = (key: string, value: any) => {
    // Skip internal fields
    if (key === 'executionResult' || key === 'isExecuting' || key === 'status') {
      return null
    }

    // Handle different field types
    if (key === 'properties' && typeof value === 'object') {
      return (
        <div key={key} className="editor-field">
          <label className="editor-label">Properties (JSON)</label>
          <textarea
            className="editor-textarea"
            value={JSON.stringify(value, null, 2)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value)
                handleChange(key, parsed)
              } catch (err) {
                // Keep typing even if JSON is temporarily invalid
                handleChange(key, e.target.value)
              }
            }}
            rows={6}
          />
        </div>
      )
    }

    if (typeof value === 'string' || typeof value === 'number') {
      return (
        <div key={key} className="editor-field">
          <label className="editor-label">{key}</label>
          <input
            type="text"
            className="editor-input"
            value={value}
            onChange={(e) => handleChange(key, e.target.value)}
          />
        </div>
      )
    }

    return null
  }

  const getNodeTypeLabel = () => {
    const typeLabels: Record<string, string> = {
      begin: '🌱 BEGIN',
      become: '🌊 BECOME',
      cease: '🧱 CEASE',
      transcend: '🌀 TRANSCEND',
      operator: '⚙️ Operator',
      law: '📜 Law'
    }
    return typeLabels[node.type || ''] || node.type
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="editor-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <div className="editor-modal-positioner" ref={dragBoundsRef}>
            <motion.div
              className="editor-modal"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              drag
              dragConstraints={dragBoundsRef}
              dragMomentum={false}
              dragElastic={0.15}
            >
              <div className="editor-header">
                <div className="editor-title">
                  <span className="editor-type">{getNodeTypeLabel()}</span>
                  <span className="editor-id">{node.id}</span>
                </div>
                <button className="editor-close" onClick={onClose}>✕</button>
              </div>

              <div className="editor-body">
                {Object.entries(formData).map(([key, value]) => renderField(key, value))}

                <div className="editor-section">
                  <div className="editor-section-header">
                    <h3 className="editor-section-title">External app bindings</h3>
                    <p className="editor-section-caption">
                      Attach connected integrations so this node can execute steps in external apps.
                    </p>
                  </div>

                  {nodeBindings.length === 0 && !showNewBinding ? (
                    <div className="binding-empty">
                      <strong>No integrations attached</strong>
                      Use the Connection Center to connect apps, then bind them here to automate this
                      node.
                    </div>
                  ) : null}

                  <div className="binding-stack">
                    {nodeBindings.map((binding, index) => (
                      <BindingEditorCard
                        key={binding.id}
                        nodeId={node.id}
                        binding={binding}
                        accounts={accounts}
                        providers={providers}
                        defaultUniverseId={defaultUniverseId}
                        prioritySuggestion={binding.priority ?? index + 1}
                      />
                    ))}

                    {showNewBinding ? (
                      <BindingEditorCard
                        key={`new-${node.id}`}
                        nodeId={node.id}
                        accounts={accounts}
                        providers={providers}
                        defaultUniverseId={defaultUniverseId}
                        prioritySuggestion={nodeBindings.length + 1}
                        onSaved={() => setShowNewBinding(false)}
                        onRemoved={() => setShowNewBinding(false)}
                      />
                    ) : null}
                  </div>

                  <div className="binding-add-row">
                    <button
                      type="button"
                      className="editor-add-binding"
                      onClick={() => setShowNewBinding(prev => !prev)}
                      disabled={!accounts.length || !providers.length}
                    >
                      {showNewBinding ? 'Cancel new binding' : 'Add integration binding'}
                    </button>
                    {!accounts.length || !providers.length ? (
                      <span className="binding-add-hint">
                        Connect providers and accounts in the Connection Center first.
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="editor-footer">
                <button className="editor-btn cancel" onClick={onClose}>
                  Cancel
                </button>
                <button className="editor-btn save" onClick={handleSave}>
                  💾 Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
