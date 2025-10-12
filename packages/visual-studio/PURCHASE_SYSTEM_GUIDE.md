# Purchase Tracking System - Complete Integration Guide

## Overview

The purchase tracking system extends Fortistate's subscription model to persist user purchases across sessions. Users can purchase templates, features, assets, and plugins from the marketplace, and their purchases are automatically tracked and associated with their account.

## System Architecture

### Data Model

```typescript
// Purchase record
interface Purchase {
  id: string                    // Unique purchase ID
  userId: string                // User who made the purchase
  itemType: 'template' | 'feature' | 'asset' | 'plugin'
  itemId: string                // ID of the purchased item
  itemName: string              // Display name
  price: number                 // Price in dollars
  currency: string              // Currency code (default: USD)
  purchasedAt: number           // Unix timestamp
  transactionId: string         // Transaction identifier
}

// Owned item (lightweight reference)
interface OwnedItem {
  itemType: 'template' | 'feature' | 'asset' | 'plugin'
  itemId: string
  itemName: string
  purchasedAt: number
  purchaseId: string            // Link back to purchase record
}

// State includes:
{
  purchases: Record<string, Purchase>           // All purchases by ID
  ownedItems: Record<string, OwnedItem[]>       // User ID -> owned items
}
```

### Constraint-Based Validation

The system uses Fortistate's automatic repair to enforce business rules:

1. **No Duplicate Purchases**: Users cannot purchase the same item twice
2. **Price Validation**: Price must be >= 0
3. **Deduplication**: State automatically deduplicates owned items per user

## Core Features

### 1. Purchase Actions

```typescript
import { subscriptionActions } from './subscription/subscriptionModel'

// Purchase an item
const purchase = subscriptionActions.purchaseItem(
  userId,
  'template',
  'template-123',
  'E-commerce Template',
  29.99,
  'USD'
)

// Grant free item (promotions, free tier)
subscriptionActions.grantFreeItem(
  userId,
  'template',
  'starter-template',
  'Starter Template'
)

// Record existing purchase (from payment provider)
subscriptionActions.recordPurchase({
  id: 'purchase_xyz',
  userId: 'user_123',
  itemType: 'template',
  itemId: 'template-456',
  itemName: 'Premium Template',
  price: 49.99,
  currency: 'USD',
  purchasedAt: Date.now(),
  transactionId: 'stripe_txn_abc'
})
```

### 2. Ownership Checks

```typescript
import { useOwnsItem, useOwnedTemplates } from './subscription/useSubscription'

function TemplateCard({ templateId }) {
  const ownsTemplate = useOwnsItem(templateId)
  
  return (
    <div>
      {ownsTemplate ? (
        <OwnedBadge />
      ) : (
        <PurchaseButton ... />
      )}
    </div>
  )
}
```

### 3. Purchase History

```typescript
import { usePurchaseHistory, useTotalSpent } from './subscription/useSubscription'

function AccountPage() {
  const history = usePurchaseHistory()
  const totalSpent = useTotalSpent()
  
  return (
    <div>
      <h2>Total Spent: ${totalSpent.toFixed(2)}</h2>
      <PurchaseHistory />
    </div>
  )
}
```

## UI Components

### OwnedBadge
Displays a checkmark badge indicating ownership.

```tsx
import { OwnedBadge } from './subscription/PurchaseComponents'

<OwnedBadge className="my-custom-class" />
```

### PurchaseButton
Smart button that handles purchase flow and shows owned status.

```tsx
import { PurchaseButton } from './subscription/PurchaseComponents'

<PurchaseButton
  itemId="template-123"
  itemName="E-commerce Template"
  itemType="template"
  price={29.99}
  currency="USD"
  onPurchase={(purchase) => {
    console.log('Purchase complete:', purchase)
  }}
  disabled={false}
/>
```

The button:
- Shows "Owned" badge if user owns the item
- Displays price and "Purchase" text otherwise
- Handles loading state during purchase
- Validates ownership before purchase

### PurchaseHistory
Full purchase history with transaction details.

```tsx
import { PurchaseHistory } from './subscription/PurchaseComponents'

<PurchaseHistory className="my-class" />
```

Displays:
- All purchases with timestamps
- Transaction IDs
- Item icons by type
- Total spent summary

### OwnedItemsList
Grid of owned items with filtering.

```tsx
import { OwnedItemsList } from './subscription/PurchaseComponents'

// All owned items
<OwnedItemsList />

// Filter by type
<OwnedItemsList itemType="template" />
```

### OwnedTemplatesGallery
Visual gallery of owned templates (good for dashboard).

```tsx
import { OwnedTemplatesGallery } from './subscription/PurchaseComponents'

<OwnedTemplatesGallery
  onSelect={(templateId) => {
    console.log('Selected:', templateId)
  }}
/>
```

### PurchaseStats
Statistics dashboard showing counts and spending.

```tsx
import { PurchaseStats } from './subscription/PurchaseComponents'

<PurchaseStats />
```

Displays:
- Templates owned
- Features owned
- Assets owned
- Plugins owned
- Total spent
- Transaction count

## React Hooks

### useOwnsItem(itemId)
Check if current user owns a specific item.

```typescript
const ownsTemplate = useOwnsItem('template-123')
```

### useOwnedItems()
Get all items owned by current user.

```typescript
const ownedItems = useOwnedItems() // OwnedItem[]
```

### useOwnedItemsByType(type)
Get owned items filtered by type.

```typescript
const templates = useOwnedItemsByType('template')
const features = useOwnedItemsByType('feature')
```

### useOwnedTemplates()
Shorthand for `useOwnedItemsByType('template')`.

```typescript
const templates = useOwnedTemplates()
```

### usePurchaseHistory()
Get full purchase history for current user.

```typescript
const history = usePurchaseHistory() // Purchase[]
```

### useTotalSpent()
Get total amount spent by current user.

```typescript
const total = useTotalSpent() // number (in dollars)
```

### usePurchases()
Comprehensive hook with all purchase data and helpers.

```typescript
const {
  ownedItems,          // All owned items
  purchaseHistory,     // All purchases
  totalSpent,          // Total $
  ownedTemplates,      // Templates only
  ownedFeatures,       // Features only
  ownedAssets,         // Assets only
  ownedPlugins,        // Plugins only
  ownsItem,            // (id) => boolean
  actions,             // { purchaseItem, grantFreeItem }
} = usePurchases()
```

## Marketplace Integration

The marketplace automatically shows ownership status and purchase buttons:

```tsx
// MarketplaceGallery.tsx automatically integrates
import { MarketplaceGallery } from './marketplace/MarketplaceGallery'

<MarketplaceGallery
  templates={templates}
  onTemplateClick={(template) => { ... }}
  onPurchase={async (templateId) => {
    // Your payment logic here
    await processPayment(templateId)
  }}
/>
```

**Features:**
- Shows "Owned" badge on purchased templates
- Disables purchase button for owned items
- Records purchase in Fortistate on successful payment
- Persists purchases across sessions

## State Persistence

Purchases are stored in Fortistate's subscription store and automatically persist:

```typescript
// State structure
{
  purchases: {
    'purchase_123': { ... },
    'purchase_456': { ... }
  },
  ownedItems: {
    'user_789': [
      { itemId: 'template-1', itemType: 'template', ... },
      { itemId: 'feature-2', itemType: 'feature', ... }
    ]
  }
}
```

To persist to backend:

```typescript
import { subscriptionStore } from './subscription/subscriptionModel'

// Subscribe to changes
subscriptionStore.subscribe(() => {
  const state = subscriptionStore.get()
  
  // Send to your backend
  api.savePurchases({
    userId: state.currentUserId,
    purchases: state.purchases,
    ownedItems: state.ownedItems
  })
})

// Load on app init
async function loadUserData(userId) {
  const data = await api.getPurchases(userId)
  
  // Restore purchases
  data.purchases.forEach(purchase => {
    subscriptionActions.recordPurchase(purchase)
  })
}
```

## Validation & Constraints

### Automatic Validation

The system automatically:
1. Prevents duplicate purchases
2. Validates prices (must be >= 0)
3. Deduplicates owned items
4. Links purchases to owned items

### Manual Validation

```typescript
const result = subscriptionActions.purchaseItem(...)

if (!result) {
  // Purchase failed validation
  // Check console for error message
}
```

Validation errors:
- `null` return value = validation failed
- Console warnings for duplicate purchases
- Console errors for invalid prices

## Testing

```typescript
import { subscriptionActions, subscriptionSelectors } from './subscription/subscriptionModel'

// Test purchase flow
describe('Purchase System', () => {
  it('should record purchase', () => {
    const userId = 'test-user'
    const purchase = subscriptionActions.purchaseItem(
      userId,
      'template',
      'test-template',
      'Test Template',
      9.99
    )
    
    expect(purchase).toBeDefined()
    expect(purchase?.price).toBe(9.99)
    
    const state = subscriptionStore.get()
    expect(subscriptionSelectors.ownsItem(state, userId, 'test-template')).toBe(true)
  })
  
  it('should prevent duplicate purchases', () => {
    const userId = 'test-user'
    
    // First purchase
    subscriptionActions.purchaseItem(userId, 'template', 'dup-test', 'Dup', 10)
    
    // Second attempt
    const result = subscriptionActions.purchaseItem(userId, 'template', 'dup-test', 'Dup', 10)
    
    expect(result).toBeNull() // Validation blocked duplicate
  })
})
```

## Payment Integration Example

```typescript
import { useCurrentAccount, usePurchases } from './subscription/useSubscription'
import { loadStripe } from '@stripe/stripe-js'

async function handlePurchase(itemId: string, itemName: string, price: number) {
  const account = useCurrentAccount()
  const { actions } = usePurchases()
  
  if (!account) return
  
  try {
    // 1. Create Stripe checkout session
    const response = await fetch('/api/create-checkout', {
      method: 'POST',
      body: JSON.stringify({ itemId, price })
    })
    const { sessionId } = await response.json()
    
    // 2. Redirect to Stripe
    const stripe = await loadStripe(STRIPE_KEY)
    await stripe?.redirectToCheckout({ sessionId })
    
    // 3. On success webhook, record purchase
    // (This happens on your backend after payment confirmation)
    // Backend calls:
    actions.purchaseItem(account.id, 'template', itemId, itemName, price)
    
  } catch (error) {
    console.error('Payment failed:', error)
  }
}
```

## Benefits

1. **Automatic Deduplication**: Can't purchase same item twice
2. **Type Safety**: Full TypeScript support
3. **Reactive**: UI updates immediately on purchase
4. **Persistent**: Survives page reloads
5. **Auditable**: Full transaction history
6. **Flexible**: Works with any payment provider
7. **Constraint-Based**: Automatic validation and repair

## Next Steps

1. **Backend Integration**: Connect to your API for persistence
2. **Payment Provider**: Integrate Stripe/PayPal webhooks
3. **Analytics**: Track purchase conversion rates
4. **Refunds**: Add refund handling logic
5. **Subscriptions**: Extend for recurring payments

## Files Created

- `src/subscription/subscriptionModel.ts` - Extended with purchase types and actions
- `src/subscription/useSubscription.ts` - Added purchase hooks
- `src/subscription/PurchaseComponents.tsx` - UI components (332 lines)
- `src/subscription/PurchaseComponents.css` - Styling (450+ lines)
- `src/marketplace/MarketplaceGallery.tsx` - Integrated ownership checks

## Summary

The purchase tracking system provides a complete, production-ready solution for managing user purchases using Fortistate's state management. All purchases are automatically validated, deduplicated, and persisted, giving users a seamless shopping experience while maintaining data integrity.
