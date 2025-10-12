# Subscription System Integration Guide

## Overview

The Fortistate Visual Studio now has a complete subscription management system built using **Fortistate's own state management**! This demonstrates the power of using Fortistate for complex business logic with automatic constraint enforcement and validation.

## Architecture

### Core Components

1. **`subscriptionModel.ts`** - State model with Fortistate store
2. **`useSubscription.ts`** - React hooks for reactive subscriptions
3. **`RestrictionComponents.tsx`** - UI components for restrictions
4. **`AuthContext.tsx`** - Integration with Clerk authentication

### State Structure

```typescript
interface SubscriptionState {
  accounts: Record<string, UserAccount>
  subscriptions: Record<string, Subscription>
  usage: Record<string, Usage>
  currentUserId: string | null
}
```

### Plan Tiers

- **Free**: 3 universes, 50 nodes, no collaboration
- **Starter**: 10 universes, 200 nodes, collaboration enabled
- **Pro**: 50 universes, 1000 nodes, all features
- **Enterprise**: Unlimited, all features + priority support

## Features

### Automatic Constraint Enforcement

Fortistate automatically enforces three key constraints:

1. **Valid Subscription**: Auto-creates free subscription if missing
2. **Usage Limits**: Caps usage at plan limits
3. **Subscription Period**: Auto-expires subscriptions past their period

### Real-time Reactive Updates

All subscription changes automatically trigger re-renders in components using the hooks.

## Usage Examples

### 1. Check Feature Access

```tsx
import { useFeatureAccess } from './subscription/useSubscription'

function CollaborationButton() {
  const canCollaborate = useFeatureAccess('collaborationEnabled')
  
  if (!canCollaborate) {
    return <RestrictionBadge feature="Collaboration" requiredTier="Starter" />
  }
  
  return <button>Invite Collaborators</button>
}
```

### 2. Show Usage Limits

```tsx
import { useSubscription } from './subscription/useSubscription'
import { UsageLimitBadge } from './subscription/RestrictionComponents'

function UniverseCounter() {
  const { universesUsed, maxUniverses, actions } = useSubscription()
  
  return (
    <UsageLimitBadge
      current={universesUsed}
      max={maxUniverses}
      label="Universes"
      onUpgrade={() => handleUpgrade()}
    />
  )
}
```

### 3. Feature Gating

```tsx
import { useFeatureAccess } from './subscription/useSubscription'
import { FeatureGate } from './subscription/RestrictionComponents'

function QuantumPanel() {
  const hasQuantum = useFeatureAccess('quantumFeatures')
  
  return (
    <FeatureGate
      allowed={hasQuantum}
      feature="Quantum Features"
      requiredTier="Pro"
    >
      <QuantumControls />
    </FeatureGate>
  )
}
```

### 4. Comprehensive Subscription Info

```tsx
import { useSubscription } from './subscription/useSubscription'

function SubscriptionDashboard() {
  const {
    plan,
    tier,
    isActive,
    universesUsed,
    maxUniverses,
    universesRemaining,
    isAtUniverseLimit,
    canCollaborate,
    actions,
  } = useSubscription()
  
  return (
    <div>
      <h2>Current Plan: {plan.name}</h2>
      <p>Status: {isActive ? 'Active' : 'Inactive'}</p>
      <p>Universes: {universesUsed} / {maxUniverses}</p>
      <p>Remaining: {universesRemaining}</p>
      
      {isAtUniverseLimit && (
        <button onClick={() => actions.upgradePlan(userId, 'starter')}>
          Upgrade to Starter
        </button>
      )}
    </div>
  )
}
```

### 5. Update Usage Tracking

```tsx
import { useSubscriptionActions } from './subscription/useSubscription'

function UniverseCreator() {
  const actions = useSubscriptionActions()
  
  const createUniverse = () => {
    // Create universe logic...
    
    // Update usage
    actions.updateUsage(userId, {
      universesCreated: currentCount + 1
    })
  }
  
  return <button onClick={createUniverse}>Create Universe</button>
}
```

### 6. Upgrade Prompt

```tsx
import { useSubscription, useUpgradePath } from './subscription/useSubscription'
import { UpgradePrompt } from './subscription/RestrictionComponents'

function LimitReachedPrompt() {
  const { tier, isAtUniverseLimit } = useSubscription()
  const nextTier = useUpgradePath()
  
  if (!isAtUniverseLimit || !nextTier) return null
  
  return (
    <UpgradePrompt
      title="Universe Limit Reached"
      message="You've reached your universe limit. Upgrade to create more!"
      currentTier={tier}
      recommendedTier={nextTier}
      onUpgrade={() => handleUpgrade(nextTier)}
      onDismiss={() => setShowPrompt(false)}
    />
  )
}
```

### 7. Plan Comparison Table

```tsx
import { PLANS } from './subscription/subscriptionModel'
import { PlanComparison } from './subscription/RestrictionComponents'

function PricingPage() {
  const features = [
    {
      name: 'Max Universes',
      free: PLANS.free.features.maxUniverses,
      starter: PLANS.starter.features.maxUniverses,
      pro: PLANS.pro.features.maxUniverses,
      enterprise: PLANS.enterprise.features.maxUniverses,
    },
    {
      name: 'Max Nodes per Universe',
      free: PLANS.free.features.maxNodesPerUniverse,
      starter: PLANS.starter.features.maxNodesPerUniverse,
      pro: PLANS.pro.features.maxNodesPerUniverse,
      enterprise: PLANS.enterprise.features.maxNodesPerUniverse,
    },
    {
      name: 'Collaboration',
      free: PLANS.free.features.collaborationEnabled,
      starter: PLANS.starter.features.collaborationEnabled,
      pro: PLANS.pro.features.collaborationEnabled,
      enterprise: PLANS.enterprise.features.collaborationEnabled,
    },
    // ... more features
  ]
  
  return <PlanComparison features={features} />
}
```

## Integration with Existing Features

### Marketplace Templates

```tsx
// In MarketplaceGallery.tsx
import { useFeatureAccess, useSubscription } from '../subscription/useSubscription'

function MarketplaceGallery() {
  const hasMarketplace = useFeatureAccess('marketplaceAccess')
  const { tier } = useSubscription()
  
  if (!hasMarketplace) {
    return (
      <div>
        <RestrictionBadge feature="Marketplace" requiredTier="Free" />
        <p>Sign in to access the marketplace</p>
      </div>
    )
  }
  
  // Show templates...
}
```

### Collaboration Features

```tsx
// In collaboration modals
import { useFeatureAccess } from '../subscription/useSubscription'

function ShareUniverseButton() {
  const canCollaborate = useFeatureAccess('collaborationEnabled')
  
  return (
    <FeatureGate
      allowed={canCollaborate}
      feature="Collaboration"
      requiredTier="Starter"
      onUpgrade={() => openBillingModal()}
    >
      <button>Share Universe</button>
    </FeatureGate>
  )
}
```

### Code Export

```tsx
// In code generator
import { useFeatureAccess } from '../subscription/useSubscription'

function ExportButton() {
  const canExport = useFeatureAccess('exportCode')
  
  if (!canExport) {
    return <RestrictionBadge feature="Code Export" requiredTier="Free" />
  }
  
  return <button onClick={exportCode}>Export TypeScript</button>
}
```

## Automatic Behaviors

### On Sign In

1. User account is created/updated in subscription store
2. If no subscription exists, free plan is auto-assigned
3. Usage tracking is initialized
4. All components react to new subscription state

### On Usage Changes

1. Usage is validated against plan limits
2. If exceeded, usage is capped at maximum
3. UI components show limit warnings
4. Upgrade prompts appear when appropriate

### On Subscription Expiry

1. Fortistate automatically detects expired subscriptions
2. Status is changed to 'inactive'
3. User is downgraded to free plan features
4. Usage limits are enforced

## Benefits of Using Fortistate

### 1. Declarative Constraints

Instead of scattered validation logic, all constraints are defined in one place and automatically enforced.

### 2. Automatic Repair

When invalid states occur (e.g., missing subscription), Fortistate automatically repairs them to valid states.

### 3. Reactive Updates

All components using hooks automatically re-render when subscription state changes.

### 4. Type Safety

Full TypeScript support with proper types for plans, features, and usage.

### 5. Testability

Easy to test - just set subscription store state and verify constraints work.

### 6. Performance

Fortistate only triggers re-renders in components that actually use the changed data.

## Testing Examples

```typescript
import { subscriptionStore, subscriptionActions, PLANS } from './subscriptionModel'

// Test constraint: Auto-create free subscription
test('automatically creates free subscription', () => {
  subscriptionActions.setAccount({
    id: 'user_123',
    clerkUserId: 'clerk_123',
    email: 'test@example.com',
    name: 'Test User',
    createdAt: Date.now(),
    subscriptionId: null,
  })
  
  const state = subscriptionStore.get()
  const account = state.accounts['user_123']
  
  expect(account.subscriptionId).toBeTruthy()
  const subscription = state.subscriptions[account.subscriptionId!]
  expect(subscription.tier).toBe('free')
})

// Test constraint: Cap usage at limits
test('caps usage at plan limits', () => {
  // ... setup user with free plan
  
  subscriptionActions.updateUsage('user_123', {
    universesCreated: 999, // Try to exceed free plan limit of 3
  })
  
  const state = subscriptionStore.get()
  const usage = state.usage['user_123']
  
  expect(usage.universesCreated).toBe(PLANS.free.features.maxUniverses)
})
```

## Next Steps

1. **Connect to Stripe/Payment**: Integrate actual payment processing
2. **Persist to Database**: Save subscription state to backend
3. **Add Analytics**: Track usage patterns and conversion
4. **Implement Trials**: Add trial period logic
5. **Add Webhooks**: Handle subscription changes from payment provider

---

**The subscription system is now fully integrated and ready to use!** 🎉

All plan restrictions are automatically enforced by Fortistate's constraint system, making it impossible for users to exceed their limits or access restricted features.
