# Purchase System - Quick Start Examples

## Basic Usage

### 1. Check if User Owns Something
```tsx
import { useOwnsItem } from './subscription/useSubscription'

function TemplateCard({ templateId }) {
  const ownsTemplate = useOwnsItem(templateId)
  
  return (
    <div>
      {ownsTemplate ? (
        <span>✅ You own this!</span>
      ) : (
        <button>Buy Now</button>
      )}
    </div>
  )
}
```

### 2. Purchase Button (Auto-Handles Everything)
```tsx
import { PurchaseButton } from './subscription/PurchaseComponents'

function ProductPage() {
  return (
    <PurchaseButton
      itemId="premium-template-1"
      itemName="Premium E-commerce Template"
      itemType="template"
      price={29.99}
      onPurchase={async (purchase) => {
        // Called after successful purchase
        console.log('Purchased:', purchase.itemName)
        navigate('/my-purchases')
      }}
    />
  )
}
```

### 3. Show Purchase History
```tsx
import { PurchaseHistory, PurchaseStats } from './subscription/PurchaseComponents'

function AccountPage() {
  return (
    <div>
      <h1>My Account</h1>
      <PurchaseStats />
      <PurchaseHistory />
    </div>
  )
}
```

### 4. Display Owned Templates
```tsx
import { OwnedTemplatesGallery } from './subscription/PurchaseComponents'

function MyTemplatesPage() {
  return (
    <OwnedTemplatesGallery
      onSelect={(templateId) => {
        // User clicked on owned template
        loadTemplate(templateId)
      }}
    />
  )
}
```

## Advanced Usage

### 5. Comprehensive Purchase Hook
```tsx
import { usePurchases } from './subscription/useSubscription'

function Dashboard() {
  const {
    ownedItems,          // All owned items
    ownedTemplates,      // Just templates
    purchaseHistory,     // All purchases
    totalSpent,          // Total $
    ownsItem,            // Check function
    actions              // Purchase actions
  } = usePurchases()
  
  return (
    <div>
      <h2>You own {ownedItems.length} items</h2>
      <h3>Total Spent: ${totalSpent.toFixed(2)}</h3>
      
      {ownedTemplates.map(template => (
        <div key={template.itemId}>
          {template.itemName}
        </div>
      ))}
    </div>
  )
}
```

### 6. Manual Purchase Action
```tsx
import { useCurrentAccount, usePurchases } from './subscription/useSubscription'

function CustomCheckout() {
  const account = useCurrentAccount()
  const { actions } = usePurchases()
  
  const handleStripeSuccess = async (stripeSession) => {
    // After Stripe confirms payment
    const purchase = actions.purchaseItem(
      account.id,
      'template',
      'template-123',
      'Pro Template',
      49.99,
      'USD'
    )
    
    if (purchase) {
      toast.success('Purchase successful!')
    } else {
      toast.error('Already owned or invalid')
    }
  }
  
  return <StripeCheckout onSuccess={handleStripeSuccess} />
}
```

### 7. Grant Free Item (Promotions)
```tsx
import { useCurrentAccount, usePurchases } from './subscription/useSubscription'

function PromoCode() {
  const account = useCurrentAccount()
  const { actions } = usePurchases()
  
  const applyPromo = (code: string) => {
    if (code === 'WELCOME10') {
      // Give user a free template
      actions.grantFreeItem(
        account.id,
        'template',
        'starter-template',
        'Starter Template'
      )
      
      toast.success('Free template added!')
    }
  }
  
  return <PromoCodeInput onApply={applyPromo} />
}
```

### 8. Filter Owned Items by Type
```tsx
import { useOwnedItemsByType } from './subscription/useSubscription'

function MyLibrary() {
  const templates = useOwnedItemsByType('template')
  const features = useOwnedItemsByType('feature')
  const assets = useOwnedItemsByType('asset')
  const plugins = useOwnedItemsByType('plugin')
  
  return (
    <Tabs>
      <Tab label={`Templates (${templates.length})`}>
        {templates.map(t => <TemplateCard key={t.itemId} {...t} />)}
      </Tab>
      <Tab label={`Features (${features.length})`}>
        {features.map(f => <FeatureCard key={f.itemId} {...f} />)}
      </Tab>
      {/* ... */}
    </Tabs>
  )
}
```

### 9. Conditional Feature Access
```tsx
import { useOwnsItem } from './subscription/useSubscription'

function AdvancedEditor() {
  const hasPremiumEditor = useOwnsItem('feature-premium-editor')
  
  if (!hasPremiumEditor) {
    return (
      <div>
        <h3>Premium Feature</h3>
        <p>Unlock the advanced editor for $9.99</p>
        <PurchaseButton
          itemId="feature-premium-editor"
          itemName="Premium Editor"
          itemType="feature"
          price={9.99}
        />
      </div>
    )
  }
  
  return <PremiumEditorComponent />
}
```

### 10. Purchase with Payment Integration
```tsx
import { useCurrentAccount, usePurchases } from './subscription/useSubscription'
import { loadStripe } from '@stripe/stripe-js'

function BuyTemplateButton({ template }) {
  const account = useCurrentAccount()
  const { actions } = usePurchases()
  const [loading, setLoading] = useState(false)
  
  const handlePurchase = async () => {
    setLoading(true)
    
    try {
      // 1. Create Stripe checkout
      const res = await fetch('/api/checkout', {
        method: 'POST',
        body: JSON.stringify({
          itemId: template.id,
          price: template.price
        })
      })
      const { sessionId } = await res.json()
      
      // 2. Redirect to Stripe
      const stripe = await loadStripe(process.env.STRIPE_KEY)
      const result = await stripe.redirectToCheckout({ sessionId })
      
      if (result.error) {
        throw result.error
      }
      
      // 3. On webhook success, your backend should call:
      // actions.purchaseItem(account.id, 'template', template.id, ...)
      
    } catch (error) {
      console.error(error)
      toast.error('Purchase failed')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <button onClick={handlePurchase} disabled={loading}>
      {loading ? 'Processing...' : `Buy for $${template.price}`}
    </button>
  )
}
```

## Common Patterns

### Show Owned Badge on Cards
```tsx
import { useOwnsItem } from './subscription/useSubscription'
import { OwnedBadge } from './subscription/PurchaseComponents'

function ItemCard({ item }) {
  const owned = useOwnsItem(item.id)
  
  return (
    <div className="card">
      {owned && <OwnedBadge />}
      <h3>{item.name}</h3>
      <p>${item.price}</p>
    </div>
  )
}
```

### Lock Feature Behind Purchase
```tsx
function FeatureGate({ featureId, children }) {
  const hasFeature = useOwnsItem(featureId)
  
  if (!hasFeature) {
    return <UpgradePrompt featureId={featureId} />
  }
  
  return <>{children}</>
}

// Usage
<FeatureGate featureId="advanced-analytics">
  <AnalyticsDashboard />
</FeatureGate>
```

### Purchase Success Redirect
```tsx
function CheckoutSuccess() {
  const navigate = useNavigate()
  const { ownedItems } = usePurchases()
  
  useEffect(() => {
    // Show success message
    toast.success('Purchase complete!')
    
    // Redirect to library after 2s
    setTimeout(() => {
      navigate('/my-library')
    }, 2000)
  }, [])
  
  return (
    <div>
      <h1>✅ Purchase Successful!</h1>
      <p>You now own {ownedItems.length} items</p>
    </div>
  )
}
```

## Best Practices

### ✅ DO
- Use `useOwnsItem()` for simple ownership checks
- Use `PurchaseButton` component for consistent UX
- Check `purchase !== null` after manual purchases
- Show purchase history in account settings
- Grant free items for promotions

### ❌ DON'T
- Don't try to purchase without checking ownership first
- Don't bypass validation (it will fail anyway)
- Don't forget to handle null returns from `purchaseItem()`
- Don't store prices in state (get from item catalog)

## Testing

```typescript
import { subscriptionActions, subscriptionSelectors } from './subscription/subscriptionModel'

describe('Purchases', () => {
  it('records purchase', () => {
    const p = subscriptionActions.purchaseItem(
      'user1',
      'template',
      'tmpl1',
      'Test',
      10
    )
    
    expect(p).toBeTruthy()
    expect(p?.price).toBe(10)
  })
  
  it('prevents duplicates', () => {
    subscriptionActions.purchaseItem('user1', 'template', 'dup', 'Dup', 5)
    const second = subscriptionActions.purchaseItem('user1', 'template', 'dup', 'Dup', 5)
    
    expect(second).toBeNull()
  })
})
```

## Need Help?

See **PURCHASE_SYSTEM_GUIDE.md** for complete documentation.
