/**
 * Billing Store with Stripe Integration
 * Manages subscriptions, usage metering, and payments
 */

import { runtimeConfig } from '../runtimeConfig'

import type {
  SubscriptionPlan,
  Subscription,
  SubscriptionTier,
  UserId,
  Invoice,
  PaymentMethod,
  UsageMetric,
  BillingHistory,
} from './types'

// Subscription plans configuration
export const SUBSCRIPTION_PLANS: Record<SubscriptionTier, SubscriptionPlan> = {
  free: {
    tier: 'free',
    name: 'Free',
    price: 0,
    annualPrice: 0,
    features: {
      maxUniverses: 3,
      maxEntitiesPerUniverse: 50,
      quantumSubstrate: false,
      relativisticSubstrate: false,
      metaLawsComposition: false,
      privateProjects: false,
      premiumTemplates: false,
      exportCode: false,
      collaboration: false,
      sso: false,
      rbac: false,
      auditLogs: false,
      dedicatedSupport: false,
      onPremise: false,
      customLawEngines: false,
      sla: false,
    },
    limits: {
      teamMembers: 1,
      apiCallsPerMonth: 1000,
      storageGB: 1,
    },
  },
  pro: {
    tier: 'pro',
    name: 'Pro',
    price: 2900, // $29/month
    annualPrice: 29000, // $290/year (save $58)
    features: {
      maxUniverses: 'unlimited',
      maxEntitiesPerUniverse: 'unlimited',
      quantumSubstrate: true,
      relativisticSubstrate: true,
      metaLawsComposition: true,
      privateProjects: true,
      premiumTemplates: true,
      exportCode: true,
      collaboration: true,
      sso: false,
      rbac: false,
      auditLogs: false,
      dedicatedSupport: false,
      onPremise: false,
      customLawEngines: false,
      sla: false,
    },
    limits: {
      teamMembers: 5,
      apiCallsPerMonth: 100000,
      storageGB: 50,
    },
  },
  enterprise: {
    tier: 'enterprise',
    name: 'Enterprise',
    price: 49900, // $499/month
    annualPrice: 499000, // $4,990/year (save $1,000)
    features: {
      maxUniverses: 'unlimited',
      maxEntitiesPerUniverse: 'unlimited',
      quantumSubstrate: true,
      relativisticSubstrate: true,
      metaLawsComposition: true,
      privateProjects: true,
      premiumTemplates: true,
      exportCode: true,
      collaboration: true,
      sso: true,
      rbac: true,
      auditLogs: true,
      dedicatedSupport: true,
      onPremise: true,
      customLawEngines: true,
      sla: true,
    },
    limits: {
      teamMembers: 'unlimited',
      apiCallsPerMonth: 'unlimited',
      storageGB: 'unlimited',
    },
  },
}

export class BillingStore {
  private subscriptions: Map<UserId, Subscription> = new Map()
  private invoices: Map<string, Invoice> = new Map()
  private paymentMethods: Map<UserId, PaymentMethod[]> = new Map()
  private usageMetrics: UsageMetric[] = []
  private apiBase: string = runtimeConfig.billingBaseUrl

  constructor() {
    this.loadFromLocalStorage()
  }

  // BEGIN: Create subscription
  async createSubscription(
    userId: UserId,
    tier: SubscriptionTier,
    billingCycle: 'monthly' | 'annual' = 'monthly'
  ): Promise<Subscription> {
    const plan = SUBSCRIPTION_PLANS[tier]

    // For free tier, no Stripe needed
    if (tier === 'free') {
      const subscription: Subscription = {
        id: crypto.randomUUID(),
        userId,
        tier,
        status: 'active',
        billingCycle,
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        usage: {
          universes: 0,
          entities: 0,
          apiCalls: 0,
          storageGB: 0,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      this.subscriptions.set(userId, subscription)
      this.persistToLocalStorage()
      console.log('✅ Free subscription created')
      return subscription
    }

    // For paid tiers, integrate with Stripe
    try {
      const price = billingCycle === 'annual' ? plan.annualPrice : plan.price

      const response = await fetch(`${this.apiBase}/subscriptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          tier,
          billingCycle,
          price,
        }),
      })

      if (!response.ok) throw new Error('Failed to create subscription')

      const subscription: Subscription = await response.json()
      this.subscriptions.set(userId, subscription)
      this.persistToLocalStorage()
      console.log(`✅ ${tier} subscription created: $${(price / 100).toFixed(2)}/${billingCycle === 'annual' ? 'year' : 'month'}`)
      return subscription
    } catch (error) {
      // Fallback: simulate subscription
      console.warn('⚠️ Stripe unavailable, using mock subscription')
      const subscription: Subscription = {
        id: crypto.randomUUID(),
        userId,
        tier,
        status: 'active',
        billingCycle,
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        usage: {
          universes: 0,
          entities: 0,
          apiCalls: 0,
          storageGB: 0,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      this.subscriptions.set(userId, subscription)
      this.persistToLocalStorage()
      return subscription
    }
  }

  // BECOME: Update subscription tier
  async updateSubscription(userId: UserId, newTier: SubscriptionTier): Promise<Subscription | null> {
    const existing = this.subscriptions.get(userId)
    if (!existing) {
      console.error('❌ No subscription found')
      return null
    }

    // Downgrade to free
    if (newTier === 'free') {
      await this.cancelSubscription(userId)
      return await this.createSubscription(userId, 'free')
    }

    // Upgrade/downgrade between paid tiers
    try {
      const response = await fetch(`${this.apiBase}/subscriptions/${existing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: newTier }),
      })

      if (!response.ok) throw new Error('Failed to update subscription')

      const updated: Subscription = await response.json()
      this.subscriptions.set(userId, updated)
      this.persistToLocalStorage()
      console.log(`✅ Subscription updated: ${existing.tier} → ${newTier}`)
      return updated
    } catch (error) {
      // Fallback
      const updated: Subscription = {
        ...existing,
        tier: newTier,
        updatedAt: new Date().toISOString(),
      }

      this.subscriptions.set(userId, updated)
      this.persistToLocalStorage()
      return updated
    }
  }

  // CEASE: Cancel subscription
  async cancelSubscription(userId: UserId, immediately: boolean = false): Promise<boolean> {
    const subscription = this.subscriptions.get(userId)
    if (!subscription) return false

    try {
      const response = await fetch(`${this.apiBase}/subscriptions/${subscription.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ immediately }),
      })

      if (!response.ok) throw new Error('Failed to cancel subscription')

      if (immediately) {
        // Downgrade to free immediately
        await this.createSubscription(userId, 'free')
      } else {
        // Cancel at period end
        const updated: Subscription = {
          ...subscription,
          status: 'canceled',
          canceledAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        this.subscriptions.set(userId, updated)
      }

      this.persistToLocalStorage()
      console.log(`🛑 Subscription canceled${immediately ? ' immediately' : ' at period end'}`)
      return true
    } catch (error) {
      // Fallback
      if (immediately) {
        await this.createSubscription(userId, 'free')
      } else {
        const updated: Subscription = {
          ...subscription,
          status: 'canceled',
          canceledAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        this.subscriptions.set(userId, updated)
      }

      this.persistToLocalStorage()
      return true
    }
  }

  // Usage tracking
  async trackUsage(userId: UserId, metric: 'universes' | 'entities' | 'apiCalls' | 'storageGB', value: number): Promise<void> {
    const subscription = this.subscriptions.get(userId)
    if (!subscription) return

    const usageMetric: UsageMetric = {
      userId,
      timestamp: new Date().toISOString(),
      metric,
      value,
    }

    this.usageMetrics.push(usageMetric)

    // Update subscription usage
    subscription.usage[metric] = value
    subscription.updatedAt = new Date().toISOString()
    this.subscriptions.set(userId, subscription)

    // Check limits
    const plan = SUBSCRIPTION_PLANS[subscription.tier]
    const limit = plan.features[`max${metric.charAt(0).toUpperCase() + metric.slice(1)}` as keyof typeof plan.features]

    if (typeof limit === 'number' && value > limit) {
      console.warn(`⚠️ Usage limit exceeded: ${metric} = ${value} (limit: ${limit})`)
      // Emit event for UI notification
    }

    this.persistToLocalStorage()
  }

  // Get current subscription
  getSubscription(userId: UserId): Subscription | null {
    return this.subscriptions.get(userId) || null
  }

  // Check feature access
  hasFeature(userId: UserId, feature: keyof SubscriptionPlan['features']): boolean {
    const subscription = this.subscriptions.get(userId)
    if (!subscription) return false

    const plan = SUBSCRIPTION_PLANS[subscription.tier]
    return Boolean(plan.features[feature])
  }

  // Check usage limits
  checkLimit(userId: UserId, limit: keyof SubscriptionPlan['limits'], value: number): boolean {
    const subscription = this.subscriptions.get(userId)
    if (!subscription) return false

    const plan = SUBSCRIPTION_PLANS[subscription.tier]
    const maxValue = plan.limits[limit]

    return maxValue === 'unlimited' || value <= (maxValue as number)
  }

  // Payment methods
  async addPaymentMethod(userId: UserId, paymentMethod: Omit<PaymentMethod, 'id' | 'userId'>): Promise<PaymentMethod> {
    const newPaymentMethod: PaymentMethod = {
      ...paymentMethod,
      id: crypto.randomUUID(),
      userId,
    }

    const existing = this.paymentMethods.get(userId) || []
    existing.push(newPaymentMethod)
    this.paymentMethods.set(userId, existing)

    this.persistToLocalStorage()
    console.log('✅ Payment method added')
    return newPaymentMethod
  }

  getPaymentMethods(userId: UserId): PaymentMethod[] {
    return this.paymentMethods.get(userId) || []
  }

  // Invoices
  async getInvoices(userId: UserId): Promise<Invoice[]> {
    return Array.from(this.invoices.values()).filter((inv) => inv.userId === userId)
  }

  async getBillingHistory(userId: UserId): Promise<BillingHistory> {
    const invoices = await this.getInvoices(userId)
    const totalSpent = invoices.filter((inv) => inv.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0)

    const subscription = this.subscriptions.get(userId)
    const nextBillingDate = subscription?.currentPeriodEnd
    const plan = subscription ? SUBSCRIPTION_PLANS[subscription.tier] : null
    const nextBillingAmount = plan
      ? subscription!.billingCycle === 'annual'
        ? plan.annualPrice
        : plan.price
      : undefined

    return {
      invoices,
      totalSpent,
      nextBillingDate,
      nextBillingAmount,
    }
  }

  // Get plan details
  getPlan(tier: SubscriptionTier): SubscriptionPlan {
    return SUBSCRIPTION_PLANS[tier]
  }

  getAllPlans(): SubscriptionPlan[] {
    return Object.values(SUBSCRIPTION_PLANS)
  }

  // Persistence
  private persistToLocalStorage(): void {
    try {
      localStorage.setItem('billing:subscriptions', JSON.stringify(Array.from(this.subscriptions.entries())))
      localStorage.setItem('billing:invoices', JSON.stringify(Array.from(this.invoices.entries())))
      localStorage.setItem('billing:paymentMethods', JSON.stringify(Array.from(this.paymentMethods.entries())))
      localStorage.setItem('billing:usageMetrics', JSON.stringify(this.usageMetrics))
    } catch (error) {
      console.error('Failed to persist billing data:', error)
    }
  }

  private loadFromLocalStorage(): void {
    try {
      const subscriptionsData = localStorage.getItem('billing:subscriptions')
      if (subscriptionsData) {
        this.subscriptions = new Map(JSON.parse(subscriptionsData))
      }

      const invoicesData = localStorage.getItem('billing:invoices')
      if (invoicesData) {
        this.invoices = new Map(JSON.parse(invoicesData))
      }

      const paymentMethodsData = localStorage.getItem('billing:paymentMethods')
      if (paymentMethodsData) {
        this.paymentMethods = new Map(JSON.parse(paymentMethodsData))
      }

      const usageMetricsData = localStorage.getItem('billing:usageMetrics')
      if (usageMetricsData) {
        this.usageMetrics = JSON.parse(usageMetricsData)
      }
    } catch (error) {
      console.error('Failed to load billing data:', error)
    }
  }
}

// Singleton
let instance: BillingStore | null = null

export function createBillingStore(): BillingStore {
  if (!instance) {
    instance = new BillingStore()
  }
  return instance
}

export function getBillingStore(): BillingStore | null {
  return instance
}
