/**
 * React Hooks for Subscription Management
 * 
 * These hooks provide reactive access to subscription state and feature restrictions
 */

import { useSyncExternalStore } from 'react'
import {
  subscriptionStore,
  subscriptionActions,
  subscriptionSelectors,
  type PlanTier,
  type PlanFeatures,
  type Plan,
  type Subscription,
  type UserAccount,
  type Usage,
  type Purchase,
  type OwnedItem,
  PLANS,
} from './subscriptionModel'

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook to access the full subscription state
 */
export function useSubscriptionState() {
  return useSyncExternalStore(
    subscriptionStore.subscribe,
    subscriptionStore.get,
    subscriptionStore.get
  )
}

/**
 * Hook to get current user's account
 */
export function useCurrentAccount(): UserAccount | null {
  const state = useSubscriptionState()
  return subscriptionSelectors.getCurrentAccount(state)
}

/**
 * Hook to get current user's subscription
 */
export function useCurrentSubscription(): Subscription | null {
  const state = useSubscriptionState()
  return subscriptionSelectors.getCurrentSubscription(state)
}

/**
 * Hook to get current user's plan
 */
export function useCurrentPlan(): Plan {
  const state = useSubscriptionState()
  return subscriptionSelectors.getCurrentPlan(state)
}

/**
 * Hook to get current user's usage stats
 */
export function useCurrentUsage(): Usage | null {
  const state = useSubscriptionState()
  return subscriptionSelectors.getCurrentUsage(state)
}

/**
 * Hook to check if a feature is available on current plan
 */
export function useFeatureAccess(feature: keyof PlanFeatures): boolean {
  const state = useSubscriptionState()
  return subscriptionSelectors.canPerformAction(state, feature)
}

/**
 * Hook to check if user is at a usage limit
 */
export function useIsAtLimit(limit: 'universes' | 'nodes'): boolean {
  const state = useSubscriptionState()
  return subscriptionSelectors.isAtLimit(state, limit)
}

/**
 * Hook to get remaining capacity for a limit
 */
export function useRemainingCapacity(limit: 'universes' | 'nodes'): number {
  const state = useSubscriptionState()
  return subscriptionSelectors.getRemainingCapacity(state, limit)
}

/**
 * Hook to get subscription actions
 */
export function useSubscriptionActions() {
  return subscriptionActions
}

/**
 * Comprehensive hook that provides all subscription info and actions
 */
export function useSubscription() {
  const state = useSubscriptionState()
  const account = subscriptionSelectors.getCurrentAccount(state)
  const subscription = subscriptionSelectors.getCurrentSubscription(state)
  const plan = subscriptionSelectors.getCurrentPlan(state)
  const usage = subscriptionSelectors.getCurrentUsage(state)

  return {
    // State
    account,
    subscription,
    plan,
    usage,
    
    // Computed
    tier: plan.tier,
    isActive: subscription?.status === 'active' || subscription?.status === 'trial',
    isTrial: subscription?.status === 'trial',
    willCancel: subscription?.cancelAtPeriodEnd || false,
    
    // Feature checks
    canCollaborate: plan.features.collaborationEnabled,
    canAccessMarketplace: plan.features.marketplaceAccess,
    canExportCode: plan.features.exportCode,
    hasPrioritySupport: plan.features.prioritySupport,
    hasCustomBranding: plan.features.customBranding,
    hasAdvancedPhysics: plan.features.advancedPhysics,
    hasEmergenceDetection: plan.features.emergenceDetection,
    hasQuantumFeatures: plan.features.quantumFeatures,
    
    // Limits
    maxUniverses: plan.features.maxUniverses,
    maxNodes: plan.features.maxNodesPerUniverse,
    universesUsed: usage?.universesCreated || 0,
    nodesUsed: usage?.nodesInCurrentUniverse || 0,
    
    // Capacity
    universesRemaining: Math.max(0, plan.features.maxUniverses - (usage?.universesCreated || 0)),
    nodesRemaining: Math.max(0, plan.features.maxNodesPerUniverse - (usage?.nodesInCurrentUniverse || 0)),
    
    // Status checks
    isAtUniverseLimit: (usage?.universesCreated || 0) >= plan.features.maxUniverses,
    isAtNodeLimit: (usage?.nodesInCurrentUniverse || 0) >= plan.features.maxNodesPerUniverse,
    
    // Actions
    actions: subscriptionActions,
  }
}

/**
 * Hook to check if user can upgrade to a specific tier
 */
export function useCanUpgrade(targetTier: PlanTier): boolean {
  const { tier } = useSubscription()
  const tierOrder: PlanTier[] = ['free', 'starter', 'pro', 'enterprise']
  const currentIndex = tierOrder.indexOf(tier)
  const targetIndex = tierOrder.indexOf(targetTier)
  return targetIndex > currentIndex
}

/**
 * Hook to get upgrade path (next available tier)
 */
export function useUpgradePath(): PlanTier | null {
  const { tier } = useSubscription()
  const tierOrder: PlanTier[] = ['free', 'starter', 'pro', 'enterprise']
  const currentIndex = tierOrder.indexOf(tier)
  return currentIndex < tierOrder.length - 1 ? tierOrder[currentIndex + 1] : null
}

/**
 * Hook to get all available plans
 */
export function useAvailablePlans(): Plan[] {
  return Object.values(PLANS)
}

/**
 * Hook to get a specific plan by tier
 */
export function usePlan(tier: PlanTier): Plan {
  return PLANS[tier]
}

// ============================================================================
// PURCHASE HOOKS
// ============================================================================

/**
 * Hook to get all owned items for current user
 */
export function useOwnedItems() {
  const state = useSubscriptionState()
  return subscriptionSelectors.getCurrentUserOwnedItems(state)
}

/**
 * Hook to check if current user owns a specific item
 */
export function useOwnsItem(itemId: string): boolean {
  const state = useSubscriptionState()
  const account = subscriptionSelectors.getCurrentAccount(state)
  if (!account) return false
  return subscriptionSelectors.ownsItem(state, account.id, itemId)
}

/**
 * Hook to get owned items by type
 */
export function useOwnedItemsByType(itemType: 'template' | 'feature' | 'asset' | 'plugin') {
  const state = useSubscriptionState()
  const account = subscriptionSelectors.getCurrentAccount(state)
  if (!account) return []
  return subscriptionSelectors.getOwnedItemsByType(state, account.id, itemType)
}

/**
 * Hook to get purchase history
 */
export function usePurchaseHistory() {
  const state = useSubscriptionState()
  return subscriptionSelectors.getCurrentUserPurchaseHistory(state)
}

/**
 * Hook to get total amount spent
 */
export function useTotalSpent(): number {
  const state = useSubscriptionState()
  const account = subscriptionSelectors.getCurrentAccount(state)
  if (!account) return 0
  return subscriptionSelectors.getTotalSpent(state, account.id)
}

/**
 * Hook to get owned templates specifically
 */
export function useOwnedTemplates() {
  return useOwnedItemsByType('template')
}

/**
 * Hook to check if user owns a template
 */
export function useOwnsTemplate(templateId: string): boolean {
  return useOwnsItem(templateId)
}

/**
 * Comprehensive purchase hook
 */
export function usePurchases() {
  const state = useSubscriptionState()
  const account = subscriptionSelectors.getCurrentAccount(state)
  const ownedItems = subscriptionSelectors.getCurrentUserOwnedItems(state)
  const purchaseHistory = subscriptionSelectors.getCurrentUserPurchaseHistory(state)
  const totalSpent = account ? subscriptionSelectors.getTotalSpent(state, account.id) : 0

  return {
    ownedItems,
    purchaseHistory,
    totalSpent,
    ownedTemplates: ownedItems.filter(item => item.itemType === 'template'),
    ownedFeatures: ownedItems.filter(item => item.itemType === 'feature'),
    ownedAssets: ownedItems.filter(item => item.itemType === 'asset'),
    ownedPlugins: ownedItems.filter(item => item.itemType === 'plugin'),
    ownsItem: (itemId: string) => ownedItems.some(item => item.itemId === itemId),
    actions: {
      purchaseItem: subscriptionActions.purchaseItem,
      grantFreeItem: subscriptionActions.grantFreeItem,
    },
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  PLANS,
  type PlanTier,
  type PlanFeatures,
  type Plan,
  type Subscription,
  type UserAccount,
  type Usage,
  type Purchase,
  type OwnedItem,
}
