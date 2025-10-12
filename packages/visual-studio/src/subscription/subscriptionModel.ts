/**
 * Subscription State Model using Fortistate
 * 
 * This module defines the state management for user subscriptions, plans,
 * and feature restrictions using Fortistate's store system.
 */

import { createStore } from '../../../../src/storeFactory'

// ============================================================================
// TYPES
// ============================================================================

export type PlanTier = 'free' | 'starter' | 'pro' | 'enterprise'

export interface PlanFeatures {
  maxUniverses: number
  maxNodesPerUniverse: number
  collaborationEnabled: boolean
  marketplaceAccess: boolean
  exportCode: boolean
  prioritySupport: boolean
  customBranding: boolean
  advancedPhysics: boolean
  emergenceDetection: boolean
  quantumFeatures: boolean
}

export interface Plan {
  id: string
  name: string
  tier: PlanTier
  price: number
  currency: string
  features: PlanFeatures
}

export interface Subscription {
  id: string
  userId: string
  planId: string
  tier: PlanTier
  status: 'active' | 'inactive' | 'cancelled' | 'trial'
  currentPeriodStart: number
  currentPeriodEnd: number
  cancelAtPeriodEnd: boolean
}

export interface Usage {
  userId: string
  universesCreated: number
  nodesInCurrentUniverse: number
  templatesUsed: number
  collaborators: number
  lastUpdated: number
}

export interface UserAccount {
  id: string
  clerkUserId: string
  email: string
  name: string
  createdAt: number
  subscriptionId: string | null
}

export interface Purchase {
  id: string
  userId: string
  itemType: 'template' | 'feature' | 'asset' | 'plugin'
  itemId: string
  itemName: string
  price: number
  currency: string
  purchasedAt: number
  transactionId: string
}

export interface OwnedItem {
  itemType: 'template' | 'feature' | 'asset' | 'plugin'
  itemId: string
  itemName: string
  purchasedAt: number
  purchaseId: string
}

// ============================================================================
// PLAN DEFINITIONS
// ============================================================================

export const PLANS: Record<PlanTier, Plan> = {
  free: {
    id: 'plan_free',
    name: 'Free',
    tier: 'free',
    price: 0,
    currency: 'USD',
    features: {
      maxUniverses: 3,
      maxNodesPerUniverse: 50,
      collaborationEnabled: false,
      marketplaceAccess: true,
      exportCode: true,
      prioritySupport: false,
      customBranding: false,
      advancedPhysics: false,
      emergenceDetection: false,
      quantumFeatures: false,
    },
  },
  starter: {
    id: 'plan_starter',
    name: 'Starter',
    tier: 'starter',
    price: 29,
    currency: 'USD',
    features: {
      maxUniverses: 10,
      maxNodesPerUniverse: 200,
      collaborationEnabled: true,
      marketplaceAccess: true,
      exportCode: true,
      prioritySupport: false,
      customBranding: false,
      advancedPhysics: true,
      emergenceDetection: true,
      quantumFeatures: false,
    },
  },
  pro: {
    id: 'plan_pro',
    name: 'Pro',
    tier: 'pro',
    price: 99,
    currency: 'USD',
    features: {
      maxUniverses: 50,
      maxNodesPerUniverse: 1000,
      collaborationEnabled: true,
      marketplaceAccess: true,
      exportCode: true,
      prioritySupport: true,
      customBranding: true,
      advancedPhysics: true,
      emergenceDetection: true,
      quantumFeatures: true,
    },
  },
  enterprise: {
    id: 'plan_enterprise',
    name: 'Enterprise',
    tier: 'enterprise',
    price: 499,
    currency: 'USD',
    features: {
      maxUniverses: Infinity,
      maxNodesPerUniverse: Infinity,
      collaborationEnabled: true,
      marketplaceAccess: true,
      exportCode: true,
      prioritySupport: true,
      customBranding: true,
      advancedPhysics: true,
      emergenceDetection: true,
      quantumFeatures: true,
    },
  },
}

// ============================================================================
// STATE SHAPE
// ============================================================================

export interface SubscriptionState {
  accounts: Record<string, UserAccount>
  subscriptions: Record<string, Subscription>
  usage: Record<string, Usage>
  purchases: Record<string, Purchase>
  ownedItems: Record<string, OwnedItem[]> // userId -> array of owned items
  currentUserId: string | null
}

const initialState: SubscriptionState = {
  accounts: {},
  subscriptions: {},
  usage: {},
  purchases: {},
  ownedItems: {},
  currentUserId: null,
}

// ============================================================================
// FORTISTATE STORE
// ============================================================================

export const subscriptionStore = createStore<SubscriptionState>('subscription', {
  value: initialState,
})

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate and auto-repair subscription state
 */
function validateAndRepair(state: SubscriptionState): SubscriptionState {
  let repairedState = { ...state }

  // Repair 1: Ensure user has valid subscription
  if (repairedState.currentUserId) {
    const account = repairedState.accounts[repairedState.currentUserId]
    if (account && !account.subscriptionId) {
      // Create free subscription
      const freeSubscription: Subscription = {
        id: `sub_free_${Date.now()}`,
        userId: repairedState.currentUserId,
        planId: PLANS.free.id,
        tier: 'free',
        status: 'active',
        currentPeriodStart: Date.now(),
        currentPeriodEnd: Date.now() + 365 * 24 * 60 * 60 * 1000,
        cancelAtPeriodEnd: false,
      }

      repairedState = {
        ...repairedState,
        subscriptions: {
          ...repairedState.subscriptions,
          [freeSubscription.id]: freeSubscription,
        },
        accounts: {
          ...repairedState.accounts,
          [repairedState.currentUserId]: {
            ...account,
            subscriptionId: freeSubscription.id,
          },
        },
      }
    }
  }

  // Repair 2: Cap usage at plan limits
  if (repairedState.currentUserId) {
    const account = repairedState.accounts[repairedState.currentUserId]
    const usage = repairedState.usage[repairedState.currentUserId]
    
    if (account && usage) {
      const subscription = account.subscriptionId
        ? repairedState.subscriptions[account.subscriptionId]
        : null
      const tier = subscription?.tier || 'free'
      const plan = PLANS[tier]

      repairedState = {
        ...repairedState,
        usage: {
          ...repairedState.usage,
          [repairedState.currentUserId]: {
            ...usage,
            universesCreated: Math.min(
              usage.universesCreated,
              plan.features.maxUniverses
            ),
            nodesInCurrentUniverse: Math.min(
              usage.nodesInCurrentUniverse,
              plan.features.maxNodesPerUniverse
            ),
          },
        },
      }
    }
  }

  // Repair 3: Expire subscriptions past their period
  const now = Date.now()
  const updatedSubscriptions = { ...repairedState.subscriptions }
  let hasExpired = false

  for (const [id, subscription] of Object.entries(updatedSubscriptions)) {
    if (
      (subscription.status === 'active' || subscription.status === 'trial') &&
      subscription.currentPeriodEnd < now
    ) {
      updatedSubscriptions[id] = {
        ...subscription,
        status: 'inactive',
      }
      hasExpired = true
    }
  }

  if (hasExpired) {
    repairedState = {
      ...repairedState,
      subscriptions: updatedSubscriptions,
    }
  }

  // Repair 4: Validate purchases - remove duplicate purchases
  const validPurchases: Record<string, Purchase> = {}
  const validOwnedItems: Record<string, OwnedItem[]> = {}
  
  // Deduplicate purchases by itemId per user
  for (const [purchaseId, purchase] of Object.entries(repairedState.purchases)) {
    const userId = purchase.userId
    const userItems = validOwnedItems[userId] || []
    
    // Check if user already owns this item
    const alreadyOwns = userItems.some(item => item.itemId === purchase.itemId)
    
    if (!alreadyOwns) {
      validPurchases[purchaseId] = purchase
      validOwnedItems[userId] = [
        ...userItems,
        {
          itemType: purchase.itemType,
          itemId: purchase.itemId,
          itemName: purchase.itemName,
          purchasedAt: purchase.purchasedAt,
          purchaseId: purchase.id,
        }
      ]
    }
  }
  
  // Check if we need to update
  const purchaseCount = Object.keys(repairedState.purchases).length
  const validPurchaseCount = Object.keys(validPurchases).length
  
  if (purchaseCount !== validPurchaseCount) {
    repairedState = {
      ...repairedState,
      purchases: validPurchases,
      ownedItems: validOwnedItems,
    }
  }

  return repairedState
}

// ============================================================================
// ACTIONS
// ============================================================================

export const subscriptionActions = {
  /**
   * Initialize or update user account
   */
  setAccount: (account: UserAccount) => {
    const state = subscriptionStore.get()
    const newState = validateAndRepair({
      ...state,
      accounts: {
        ...state.accounts,
        [account.id]: account,
      },
      currentUserId: account.id,
    })
    subscriptionStore.set(newState)
  },

  /**
   * Create or update subscription
   */
  setSubscription: (subscription: Subscription) => {
    const state = subscriptionStore.get()
    const newState = validateAndRepair({
      ...state,
      subscriptions: {
        ...state.subscriptions,
        [subscription.id]: subscription,
      },
    })
    subscriptionStore.set(newState)
  },

  /**
   * Update usage metrics
   */
  updateUsage: (userId: string, updates: Partial<Usage>) => {
    const state = subscriptionStore.get()
    const currentUsage = state.usage[userId] || {
      userId,
      universesCreated: 0,
      nodesInCurrentUniverse: 0,
      templatesUsed: 0,
      collaborators: 0,
      lastUpdated: Date.now(),
    }

    const newState = validateAndRepair({
      ...state,
      usage: {
        ...state.usage,
        [userId]: {
          ...currentUsage,
          ...updates,
          lastUpdated: Date.now(),
        },
      },
    })
    subscriptionStore.set(newState)
  },

  /**
   * Upgrade subscription to new tier
   */
  upgradePlan: (userId: string, newTier: PlanTier) => {
    const state = subscriptionStore.get()
    const account = state.accounts[userId]
    if (!account?.subscriptionId) return

    const currentSubscription = state.subscriptions[account.subscriptionId]
    if (!currentSubscription) return

    const newPlan = PLANS[newTier]
    const updatedSubscription: Subscription = {
      ...currentSubscription,
      planId: newPlan.id,
      tier: newTier,
      status: 'active',
      currentPeriodStart: Date.now(),
      currentPeriodEnd: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
    }

    const newState = validateAndRepair({
      ...state,
      subscriptions: {
        ...state.subscriptions,
        [account.subscriptionId]: updatedSubscription,
      },
    })
    subscriptionStore.set(newState)
  },

  /**
   * Cancel subscription
   */
  cancelSubscription: (subscriptionId: string) => {
    const state = subscriptionStore.get()
    const subscription = state.subscriptions[subscriptionId]
    if (!subscription) return

    const newState = validateAndRepair({
      ...state,
      subscriptions: {
        ...state.subscriptions,
        [subscriptionId]: {
          ...subscription,
          cancelAtPeriodEnd: true,
        },
      },
    })
    subscriptionStore.set(newState)
  },

  /**
   * Clear current user (logout)
   */
  clearCurrentUser: () => {
    const state = subscriptionStore.get()
    subscriptionStore.set({
      ...state,
      currentUserId: null,
    })
  },

  /**
   * Record a purchase
   */
  recordPurchase: (purchase: Purchase) => {
    const state = subscriptionStore.get()
    
    // Create owned item entry
    const ownedItem: OwnedItem = {
      itemType: purchase.itemType,
      itemId: purchase.itemId,
      itemName: purchase.itemName,
      purchasedAt: purchase.purchasedAt,
      purchaseId: purchase.id,
    }

    const currentOwnedItems = state.ownedItems[purchase.userId] || []
    
    const newState = validateAndRepair({
      ...state,
      purchases: {
        ...state.purchases,
        [purchase.id]: purchase,
      },
      ownedItems: {
        ...state.ownedItems,
        [purchase.userId]: [...currentOwnedItems, ownedItem],
      },
    })
    subscriptionStore.set(newState)
  },

  /**
   * Purchase an item (template, feature, etc.)
   */
  purchaseItem: (
    userId: string,
    itemType: Purchase['itemType'],
    itemId: string,
    itemName: string,
    price: number,
    currency: string = 'USD'
  ) => {
    const state = subscriptionStore.get()
    
    // Validation: Check if user already owns this item
    const currentOwnedItems = state.ownedItems[userId] || []
    const alreadyOwns = currentOwnedItems.some(item => item.itemId === itemId)
    
    if (alreadyOwns) {
      console.warn(`User ${userId} already owns item ${itemId}`)
      return null
    }
    
    // Validation: Check for valid price (must be >= 0)
    if (price < 0) {
      console.error('Invalid purchase: price cannot be negative')
      return null
    }
    
    const purchase: Purchase = {
      id: `purchase_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      itemType,
      itemId,
      itemName,
      price,
      currency,
      purchasedAt: Date.now(),
      transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    }

    subscriptionActions.recordPurchase(purchase)
    return purchase
  },

  /**
   * Grant free item (for promotions, free tier items, etc.)
   */
  grantFreeItem: (
    userId: string,
    itemType: Purchase['itemType'],
    itemId: string,
    itemName: string
  ) => {
    return subscriptionActions.purchaseItem(
      userId,
      itemType,
      itemId,
      itemName,
      0,
      'USD'
    )
  },
}

// ============================================================================
// SELECTORS
// ============================================================================

export const subscriptionSelectors = {
  /**
   * Get current user's account
   */
  getCurrentAccount: (state: SubscriptionState): UserAccount | null => {
    if (!state.currentUserId) return null
    return state.accounts[state.currentUserId] || null
  },

  /**
   * Get current user's subscription
   */
  getCurrentSubscription: (state: SubscriptionState): Subscription | null => {
    const account = subscriptionSelectors.getCurrentAccount(state)
    if (!account?.subscriptionId) return null
    return state.subscriptions[account.subscriptionId] || null
  },

  /**
   * Get current user's plan
   */
  getCurrentPlan: (state: SubscriptionState): Plan => {
    const subscription = subscriptionSelectors.getCurrentSubscription(state)
    const tier = subscription?.tier || 'free'
    return PLANS[tier]
  },

  /**
   * Get current user's usage
   */
  getCurrentUsage: (state: SubscriptionState): Usage | null => {
    if (!state.currentUserId) return null
    return state.usage[state.currentUserId] || null
  },

  /**
   * Check if user can perform an action
   */
  canPerformAction: (
    state: SubscriptionState,
    action: keyof PlanFeatures
  ): boolean => {
    const plan = subscriptionSelectors.getCurrentPlan(state)
    return plan.features[action] as boolean
  },

  /**
   * Check if user is at usage limit
   */
  isAtLimit: (
    state: SubscriptionState,
    limit: 'universes' | 'nodes'
  ): boolean => {
    const plan = subscriptionSelectors.getCurrentPlan(state)
    const usage = subscriptionSelectors.getCurrentUsage(state)
    if (!usage) return false

    switch (limit) {
      case 'universes':
        return usage.universesCreated >= plan.features.maxUniverses
      case 'nodes':
        return usage.nodesInCurrentUniverse >= plan.features.maxNodesPerUniverse
      default:
        return false
    }
  },

  /**
   * Get remaining capacity
   */
  getRemainingCapacity: (
    state: SubscriptionState,
    limit: 'universes' | 'nodes'
  ): number => {
    const plan = subscriptionSelectors.getCurrentPlan(state)
    const usage = subscriptionSelectors.getCurrentUsage(state)
    if (!usage) return plan.features.maxUniverses

    switch (limit) {
      case 'universes':
        return Math.max(0, plan.features.maxUniverses - usage.universesCreated)
      case 'nodes':
        return Math.max(
          0,
          plan.features.maxNodesPerUniverse - usage.nodesInCurrentUniverse
        )
      default:
        return 0
    }
  },

  /**
   * Get all purchases for a user
   */
  getUserPurchases: (state: SubscriptionState, userId: string): Purchase[] => {
    return Object.values(state.purchases).filter((p) => p.userId === userId)
  },

  /**
   * Get all owned items for current user
   */
  getCurrentUserOwnedItems: (state: SubscriptionState): OwnedItem[] => {
    if (!state.currentUserId) return []
    return state.ownedItems[state.currentUserId] || []
  },

  /**
   * Check if user owns a specific item
   */
  ownsItem: (
    state: SubscriptionState,
    userId: string,
    itemId: string
  ): boolean => {
    const ownedItems = state.ownedItems[userId] || []
    return ownedItems.some((item) => item.itemId === itemId)
  },

  /**
   * Get owned items by type
   */
  getOwnedItemsByType: (
    state: SubscriptionState,
    userId: string,
    itemType: Purchase['itemType']
  ): OwnedItem[] => {
    const ownedItems = state.ownedItems[userId] || []
    return ownedItems.filter((item) => item.itemType === itemType)
  },

  /**
   * Get purchase history for current user
   */
  getCurrentUserPurchaseHistory: (state: SubscriptionState): Purchase[] => {
    if (!state.currentUserId) return []
    return subscriptionSelectors.getUserPurchases(state, state.currentUserId)
  },

  /**
   * Get total spent by user
   */
  getTotalSpent: (state: SubscriptionState, userId: string): number => {
    const purchases = subscriptionSelectors.getUserPurchases(state, userId)
    return purchases.reduce((sum, purchase) => sum + purchase.price, 0)
  },
}
