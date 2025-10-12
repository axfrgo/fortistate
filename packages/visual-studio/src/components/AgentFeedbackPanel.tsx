import { memo } from 'react'
import type { ReactNode } from 'react'
import type { AgentRole } from '../ai/agentTypes'
import './AgentFeedbackPanel.css'

export type AgentFeedbackStatus = 'success' | 'info' | 'warning' | 'error'

export interface AgentFeedbackMetric {
  label: string
  value: string
  tone?: 'default' | 'positive' | 'negative'
}

export interface AgentFeedbackEntry {
  id: string
  agent: AgentRole
  status: AgentFeedbackStatus
  title: string
  summary: string
  metrics?: AgentFeedbackMetric[]
  details?: string[]
  footnote?: ReactNode
  applyPayload?: any
  timestamp: number
}

interface AgentFeedbackPanelProps {
  entries: AgentFeedbackEntry[]
  isCollapsed: boolean
  onToggleCollapse: () => void
  onDismiss: (id: string) => void
  onClearAll: () => void
}

const AGENT_EMOJI: Record<AgentRole, string> = {
  custodian: '🛡️',
  diplomat: '🤝',
  narrator: '📖',
  explorer: '🔮',
  storyteller: '🎨',
}

const AGENT_LABEL: Record<AgentRole, string> = {
  custodian: 'Custodian',
  diplomat: 'Diplomat',
  narrator: 'Narrator',
  explorer: 'Explorer',
  storyteller: 'Storyteller',
}

const STATUS_LABEL: Record<AgentFeedbackStatus, string> = {
  success: 'Success',
  info: 'Update',
  warning: 'Attention',
  error: 'Error',
}

function timeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp
  if (diff < 5_000) return 'just now'
  const seconds = Math.floor(diff / 1_000)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function joinClassNames(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}

function renderDetails(details?: string[]): ReactNode {
  if (!details || details.length === 0) return null
  return (
    <ul className="agent-feedback-card__details">
      {details.map((item, index) => (
        <li key={`${item}-${index}`}>{item}</li>
      ))}
    </ul>
  )
}

function renderMetrics(metrics?: AgentFeedbackMetric[]): ReactNode {
  if (!metrics || metrics.length === 0) return null
  return (
    <div className="agent-feedback-card__metrics">
      {metrics.map((metric, index) => (
        <div
          key={`${metric.label}-${index}`}
          className={joinClassNames(
            'agent-feedback-card__metric',
            metric.tone && `agent-feedback-card__metric--${metric.tone}`
          )}
        >
          <span className="agent-feedback-card__metric-label">{metric.label}</span>
          <span className="agent-feedback-card__metric-value">{metric.value}</span>
        </div>
      ))}
    </div>
  )
}

export default memo(function AgentFeedbackPanel({
  entries,
  isCollapsed,
  onToggleCollapse,
  onDismiss,
  onClearAll,
}: AgentFeedbackPanelProps) {
  return (
    <aside className={joinClassNames('agent-feedback-panel', isCollapsed && 'agent-feedback-panel--collapsed')}>
      <button
        className="agent-feedback-panel__toggle"
        type="button"
        onClick={onToggleCollapse}
        aria-label={isCollapsed ? 'Expand agent feedback' : 'Collapse agent feedback'}
      >
        <span className="agent-feedback-panel__toggle-icon">✨</span>
        <span className="agent-feedback-panel__toggle-label">Agent Insights</span>
        <span className="agent-feedback-panel__toggle-count">{entries.length}</span>
      </button>

      <div className="agent-feedback-panel__surface" role="log" aria-live="polite">
        <header className="agent-feedback-panel__header">
          <div>
            <h3 className="agent-feedback-panel__title">Agent Insights</h3>
            <p className="agent-feedback-panel__subtitle">
              {entries.length > 0 ? 'Latest custodian analyses and AI responses' : 'Awaiting agent activity'}
            </p>
          </div>
          <button
            className="agent-feedback-panel__clear"
            type="button"
            onClick={onClearAll}
            disabled={entries.length === 0}
          >
            Clear
          </button>
        </header>

        {entries.length === 0 ? (
          <div className="agent-feedback-panel__empty">
            <div className="agent-feedback-panel__empty-icon">🌌</div>
            <p>No agent feedback yet. Trigger an analysis from the canvas context menu.</p>
          </div>
        ) : (
          <div className="agent-feedback-panel__list">
            {entries.map((entry) => (
              <article
                key={entry.id}
                className={joinClassNames(
                  'agent-feedback-card',
                  `agent-feedback-card--${entry.agent}`,
                  `agent-feedback-card--${entry.status}`
                )}
              >
                <header className="agent-feedback-card__header">
                  <div className="agent-feedback-card__identity">
                    <span className="agent-feedback-card__icon" aria-hidden>{AGENT_EMOJI[entry.agent]}</span>
                    <div>
                      <p className="agent-feedback-card__agent">{AGENT_LABEL[entry.agent]}</p>
                      <p className="agent-feedback-card__status">{STATUS_LABEL[entry.status]}</p>
                    </div>
                  </div>
                  <div className="agent-feedback-card__meta">
                    <time dateTime={new Date(entry.timestamp).toISOString()}>{timeAgo(entry.timestamp)}</time>
                    <button
                      type="button"
                      className="agent-feedback-card__dismiss"
                      onClick={() => onDismiss(entry.id)}
                      aria-label={`Dismiss ${entry.agent} feedback`}
                    >
                      ✕
                    </button>
                  </div>
                </header>

                <div className="agent-feedback-card__body">
                  <h4 className="agent-feedback-card__title">{entry.title}</h4>
                  <p className="agent-feedback-card__summary">{entry.summary}</p>
                  {renderMetrics(entry.metrics)}
                  {renderDetails(entry.details)}
                  {entry.footnote ? (
                    <footer className="agent-feedback-card__footnote">{entry.footnote}</footer>
                  ) : null}

                  {entry.applyPayload ? (
                    <div className="agent-feedback-card__actions">
                      <button
                        className="agent-feedback-card__apply"
                        onClick={() => {
                          try {
                            window.dispatchEvent(new CustomEvent('agent-apply', { detail: entry.applyPayload }))
                          } catch (e) {
                            console.warn('Apply action failed', e)
                          }
                        }}
                      >
                        Apply Fix
                      </button>
                    </div>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </aside>
  )
})
