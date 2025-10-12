import { useState } from 'react'
import { motion } from 'framer-motion'
import type { SubscriptionTier } from '../billing/types'
import { SUBSCRIPTION_PLANS } from '../billing/billingStore'
import './PlanSelector.css'

interface PlanSelectorProps {
  currentTier?: SubscriptionTier
  onSelectPlan: (tier: SubscriptionTier, billingCycle: 'monthly' | 'annual') => Promise<void>
  onClose?: () => void
}

export function PlanSelector({ currentTier, onSelectPlan, onClose }: PlanSelectorProps) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly')
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const plans: SubscriptionTier[] = ['free', 'pro', 'enterprise']

  const handleSelectPlan = async (tier: SubscriptionTier) => {
    if (tier === currentTier) return

    setSelectedTier(tier)
    setIsProcessing(true)

    try {
      await onSelectPlan(tier, billingCycle)
      onClose?.()
    } catch (error) {
      console.error('Failed to select plan:', error)
    } finally {
      setIsProcessing(false)
      setSelectedTier(null)
    }
  }

  return (
    <div className="plan-selector">
      <div className="selector-header">
        <h2>Choose Your Plan</h2>
        <p>Scale your state management as you grow</p>

        {/* Billing cycle toggle */}
        <div className="billing-toggle">
          <button
            className={billingCycle === 'monthly' ? 'active' : ''}
            onClick={() => setBillingCycle('monthly')}
          >
            Monthly
          </button>
          <button
            className={billingCycle === 'annual' ? 'active' : ''}
            onClick={() => setBillingCycle('annual')}
          >
            Annual
            <span className="save-badge">Save up to $1,000</span>
          </button>
        </div>
      </div>

      <div className="plans-grid">
        {plans.map((tier) => {
          const plan = SUBSCRIPTION_PLANS[tier]
          const price =
            billingCycle === 'annual' ? plan.annualPrice / 12 / 100 : plan.price / 100
          const isCurrent = tier === currentTier
          const isPopular = tier === 'pro'

          return (
            <motion.div
              key={tier}
              className={`plan-card ${isCurrent ? 'current' : ''} ${isPopular ? 'popular' : ''}`}
              whileHover={!isCurrent ? { y: -8, scale: 1.02 } : {}}
            >
              {isPopular && <div className="popular-badge">Most Popular</div>}

              <div className="plan-header">
                <h3>{plan.name}</h3>
                <div className="plan-price">
                  {tier === 'free' ? (
                    <span className="price-free">Free</span>
                  ) : (
                    <>
                      <span className="price-amount">${price.toFixed(0)}</span>
                      <span className="price-period">/mo</span>
                    </>
                  )}
                </div>
                {billingCycle === 'annual' && tier !== 'free' && (
                  <div className="annual-note">Billed annually (${(plan.annualPrice / 100).toFixed(0)}/yr)</div>
                )}
              </div>

              <div className="plan-features">
                <div className="feature-group">
                  <h4>Core Features</h4>
                  <ul>
                    <li className="feature-item">
                      <svg className="check-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M16.7 5L7.5 14.2 3.3 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                      <span>
                        {typeof plan.features.maxUniverses === 'number'
                          ? `${plan.features.maxUniverses} universes`
                          : 'Unlimited universes'}
                      </span>
                    </li>
                    <li className="feature-item">
                      <svg className="check-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M16.7 5L7.5 14.2 3.3 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                      <span>
                        {typeof plan.features.maxEntitiesPerUniverse === 'number'
                          ? `${plan.features.maxEntitiesPerUniverse} entities/universe`
                          : 'Unlimited entities'}
                      </span>
                    </li>
                    <li className={`feature-item ${!plan.features.quantumSubstrate ? 'disabled' : ''}`}>
                      <svg className="check-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
                        {plan.features.quantumSubstrate ? (
                          <path d="M16.7 5L7.5 14.2 3.3 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        ) : (
                          <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        )}
                      </svg>
                      <span>Quantum substrate</span>
                    </li>
                    <li className={`feature-item ${!plan.features.collaboration ? 'disabled' : ''}`}>
                      <svg className="check-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
                        {plan.features.collaboration ? (
                          <path d="M16.7 5L7.5 14.2 3.3 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        ) : (
                          <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        )}
                      </svg>
                      <span>Real-time collaboration</span>
                    </li>
                  </ul>
                </div>

                {tier !== 'free' && (
                  <div className="feature-group">
                    <h4>Advanced</h4>
                    <ul>
                      {plan.features.privateProjects && (
                        <li className="feature-item">
                          <svg className="check-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M16.7 5L7.5 14.2 3.3 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                          </svg>
                          <span>Private projects</span>
                        </li>
                      )}
                      {plan.features.exportCode && (
                        <li className="feature-item">
                          <svg className="check-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M16.7 5L7.5 14.2 3.3 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                          </svg>
                          <span>Code export</span>
                        </li>
                      )}
                      {plan.features.sso && (
                        <li className="feature-item">
                          <svg className="check-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M16.7 5L7.5 14.2 3.3 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                          </svg>
                          <span>SSO & RBAC</span>
                        </li>
                      )}
                      {plan.features.dedicatedSupport && (
                        <li className="feature-item">
                          <svg className="check-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M16.7 5L7.5 14.2 3.3 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                          </svg>
                          <span>Dedicated support</span>
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>

              <button
                className={`select-button ${isCurrent ? 'current-plan' : ''}`}
                onClick={() => handleSelectPlan(tier)}
                disabled={isCurrent || isProcessing}
              >
                {isProcessing && selectedTier === tier
                  ? 'Processing...'
                  : isCurrent
                    ? 'Current Plan'
                    : tier === 'free'
                      ? 'Get Started'
                      : tier === 'enterprise'
                        ? 'Contact Sales'
                        : 'Upgrade Now'}
              </button>
            </motion.div>
          )
        })}
      </div>

      <div className="faq-section">
        <h3>Frequently Asked Questions</h3>
        <div className="faq-grid">
          <div className="faq-item">
            <strong>Can I switch plans anytime?</strong>
            <p>Yes, upgrade or downgrade anytime. Changes take effect immediately.</p>
          </div>
          <div className="faq-item">
            <strong>What payment methods do you accept?</strong>
            <p>We accept all major credit cards via Stripe.</p>
          </div>
          <div className="faq-item">
            <strong>Is there a free trial?</strong>
            <p>The Free tier is always available. No credit card required.</p>
          </div>
          <div className="faq-item">
            <strong>What happens if I downgrade?</strong>
            <p>Your data is preserved. Features are limited based on the new tier.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
