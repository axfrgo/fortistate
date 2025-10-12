/**
 * Restriction Badge Component
 * 
 * Shows when a feature is restricted by plan limits
 */

import type { ReactNode } from 'react'
import './RestrictionBadge.css'

interface RestrictionBadgeProps {
  feature: string
  requiredTier?: string
  onUpgrade?: () => void
}

export function RestrictionBadge({ feature, requiredTier, onUpgrade }: RestrictionBadgeProps) {
  return (
    <div className="restriction-badge">
      <span className="restriction-icon">🔒</span>
      <span className="restriction-text">
        {feature} {requiredTier && `requires ${requiredTier}`}
      </span>
      {onUpgrade && (
        <button className="restriction-upgrade-btn" onClick={onUpgrade}>
          Upgrade
        </button>
      )}
    </div>
  )
}

interface UsageLimitBadgeProps {
  current: number
  max: number
  label: string
  onUpgrade?: () => void
}

export function UsageLimitBadge({ current, max, label, onUpgrade }: UsageLimitBadgeProps) {
  const percentage = max === Infinity ? 0 : (current / max) * 100
  const isAtLimit = current >= max
  const isNearLimit = percentage >= 80

  return (
    <div className={`usage-limit-badge ${isAtLimit ? 'at-limit' : isNearLimit ? 'near-limit' : ''}`}>
      <div className="usage-limit-header">
        <span className="usage-limit-label">{label}</span>
        <span className="usage-limit-count">
          {current} / {max === Infinity ? '∞' : max}
        </span>
      </div>
      {max !== Infinity && (
        <div className="usage-limit-bar">
          <div
            className="usage-limit-progress"
            style={{ width: `${Math.min(100, percentage)}%` }}
          />
        </div>
      )}
      {isAtLimit && onUpgrade && (
        <button className="usage-limit-upgrade-btn" onClick={onUpgrade}>
          Increase Limit
        </button>
      )}
    </div>
  )
}

interface UpgradePromptProps {
  title: string
  message: string
  currentTier: string
  recommendedTier: string
  onUpgrade?: () => void
  onDismiss?: () => void
}

export function UpgradePrompt({
  title,
  message,
  currentTier,
  recommendedTier,
  onUpgrade,
  onDismiss,
}: UpgradePromptProps) {
  return (
    <div className="upgrade-prompt">
      <div className="upgrade-prompt-content">
        <div className="upgrade-prompt-icon">⚡</div>
        <h3 className="upgrade-prompt-title">{title}</h3>
        <p className="upgrade-prompt-message">{message}</p>
        <div className="upgrade-prompt-tiers">
          <div className="upgrade-prompt-tier current">
            <span className="tier-label">Current</span>
            <span className="tier-name">{currentTier}</span>
          </div>
          <div className="upgrade-prompt-arrow">→</div>
          <div className="upgrade-prompt-tier recommended">
            <span className="tier-label">Recommended</span>
            <span className="tier-name">{recommendedTier}</span>
          </div>
        </div>
        <div className="upgrade-prompt-actions">
          {onUpgrade && (
            <button className="upgrade-prompt-btn primary" onClick={onUpgrade}>
              Upgrade Now
            </button>
          )}
          {onDismiss && (
            <button className="upgrade-prompt-btn secondary" onClick={onDismiss}>
              Maybe Later
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

interface PlanComparisonProps {
  features: Array<{
    name: string
    free: boolean | string | number
    starter: boolean | string | number
    pro: boolean | string | number
    enterprise: boolean | string | number
  }>
}

export function PlanComparison({ features }: PlanComparisonProps) {
  return (
    <div className="plan-comparison">
      <table className="plan-comparison-table">
        <thead>
          <tr>
            <th>Feature</th>
            <th>Free</th>
            <th>Starter</th>
            <th>Pro</th>
            <th>Enterprise</th>
          </tr>
        </thead>
        <tbody>
          {features.map((feature, index) => (
            <tr key={index}>
              <td className="feature-name">{feature.name}</td>
              <td className="feature-value">{renderFeatureValue(feature.free)}</td>
              <td className="feature-value">{renderFeatureValue(feature.starter)}</td>
              <td className="feature-value">{renderFeatureValue(feature.pro)}</td>
              <td className="feature-value">{renderFeatureValue(feature.enterprise)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function renderFeatureValue(value: boolean | string | number): ReactNode {
  if (typeof value === 'boolean') {
    return value ? <span className="check-icon">✓</span> : <span className="cross-icon">✗</span>
  }
  if (value === Infinity) {
    return '∞'
  }
  return value
}

interface FeatureGateProps {
  allowed: boolean
  feature: string
  requiredTier?: string
  onUpgrade?: () => void
  children: ReactNode
}

export function FeatureGate({
  allowed,
  feature,
  requiredTier,
  onUpgrade,
  children,
}: FeatureGateProps) {
  if (allowed) {
    return <>{children}</>
  }

  return (
    <div className="feature-gate">
      <div className="feature-gate-overlay">
        <RestrictionBadge feature={feature} requiredTier={requiredTier} onUpgrade={onUpgrade} />
      </div>
      <div className="feature-gate-content disabled">{children}</div>
    </div>
  )
}
