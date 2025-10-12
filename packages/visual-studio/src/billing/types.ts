/**
 * Billing & Subscription Types
 * SaaS tiers with Stripe integration
 */

export type SubscriptionTier = 'free' | 'pro' | 'enterprise'
export type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'incomplete' | 'trial'
export type UserId = string

export interface SubscriptionPlan {
  tier: SubscriptionTier
  name: string
  price: number // monthly in cents
  annualPrice: number // yearly in cents
  features: {
    maxUniverses: number | 'unlimited'
    maxEntitiesPerUniverse: number | 'unlimited'
    quantumSubstrate: boolean
    relativisticSubstrate: boolean
    metaLawsComposition: boolean
    privateProjects: boolean
    premiumTemplates: boolean
    exportCode: boolean
    collaboration: boolean
    sso: boolean
    rbac: boolean
    auditLogs: boolean
    dedicatedSupport: boolean
    onPremise: boolean
    customLawEngines: boolean
    sla: boolean
  }
  limits: {
    teamMembers: number | 'unlimited'
    apiCallsPerMonth: number | 'unlimited'
    storageGB: number | 'unlimited'
  }
}

export interface Subscription {
  id: string
  userId: UserId
  tier: SubscriptionTier
  status: SubscriptionStatus
  billingCycle: 'monthly' | 'annual'
  
  // Stripe
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  stripePriceId?: string
  
  // Dates
  currentPeriodStart: string
  currentPeriodEnd: string
  trialEnd?: string
  canceledAt?: string
  
  // Usage
  usage: {
    universes: number
    entities: number
    apiCalls: number
    storageGB: number
  }
  
  createdAt: string
  updatedAt: string
}

export interface Invoice {
  id: string
  userId: UserId
  subscriptionId: string
  amount: number // in cents
  currency: string
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible'
  stripeInvoiceId?: string
  pdfUrl?: string
  createdAt: string
  paidAt?: string
  dueDate?: string
}

export interface PaymentMethod {
  id: string
  userId: UserId
  type: 'card' | 'bank_account'
  brand?: string // 'visa', 'mastercard', etc
  last4: string
  expiryMonth?: number
  expiryYear?: number
  isDefault: boolean
  stripePaymentMethodId?: string
}

export interface UsageMetric {
  userId: UserId
  timestamp: string
  metric: 'universes' | 'entities' | 'apiCalls' | 'storageGB'
  value: number
}

export interface BillingHistory {
  invoices: Invoice[]
  totalSpent: number
  nextBillingDate?: string
  nextBillingAmount?: number
}
