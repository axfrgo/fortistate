/**
 * Purchase UI Components
 * 
 * React components for displaying purchase history, owned items, and purchase flows
 */

import { useState } from 'react'
import {
  usePurchases,
  useOwnedTemplates,
  usePurchaseHistory,
  useTotalSpent,
  useCurrentAccount,
  type Purchase,
  type OwnedItem,
} from './useSubscription'
import './PurchaseComponents.css'

// ============================================================================
// OWNED ITEMS BADGE
// ============================================================================

interface OwnedBadgeProps {
  className?: string
}

export function OwnedBadge({ className = '' }: OwnedBadgeProps) {
  return (
    <div className={`owned-badge ${className}`}>
      <span className="owned-badge-icon">✓</span>
      <span className="owned-badge-text">Owned</span>
    </div>
  )
}

// ============================================================================
// PURCHASE BUTTON
// ============================================================================

interface PurchaseButtonProps {
  itemId: string
  itemName: string
  itemType: 'template' | 'feature' | 'asset' | 'plugin'
  price: number
  currency?: string
  onPurchase?: (purchase: Purchase) => void
  className?: string
  disabled?: boolean
}

export function PurchaseButton({
  itemId,
  itemName,
  itemType,
  price,
  currency = 'USD',
  onPurchase,
  className = '',
  disabled = false,
}: PurchaseButtonProps) {
  const { ownsItem, actions } = usePurchases()
  const account = useCurrentAccount()
  const [isPurchasing, setIsPurchasing] = useState(false)
  const owned = ownsItem(itemId)

  const handlePurchase = async () => {
    if (!account || owned || disabled || isPurchasing) return
    
    setIsPurchasing(true)
    try {
      // In a real app, this would call a payment API
      // For now, we'll simulate the purchase
      const purchase = actions.purchaseItem(
        account.id,
        itemType,
        itemId,
        itemName,
        price,
        currency
      )
      
      if (purchase && onPurchase) {
        onPurchase(purchase)
      }
    } finally {
      setIsPurchasing(false)
    }
  }

  if (owned) {
    return <OwnedBadge className={className} />
  }

  return (
    <button
      className={`purchase-button ${className}`}
      onClick={handlePurchase}
      disabled={disabled || isPurchasing}
    >
      {isPurchasing ? (
        <>
          <span className="purchase-button-spinner"></span>
          <span>Processing...</span>
        </>
      ) : (
        <>
          <span>Purchase</span>
          <span className="purchase-button-price">
            {currency === 'USD' ? '$' : currency}
            {price.toFixed(2)}
          </span>
        </>
      )}
    </button>
  )
}

// ============================================================================
// OWNED ITEMS LIST
// ============================================================================

interface OwnedItemsListProps {
  itemType?: 'template' | 'feature' | 'asset' | 'plugin'
  className?: string
}

export function OwnedItemsList({ itemType, className = '' }: OwnedItemsListProps) {
  const { ownedItems, ownedTemplates, ownedFeatures, ownedAssets, ownedPlugins } = usePurchases()

  let items: OwnedItem[] = ownedItems
  if (itemType === 'template') items = ownedTemplates
  else if (itemType === 'feature') items = ownedFeatures
  else if (itemType === 'asset') items = ownedAssets
  else if (itemType === 'plugin') items = ownedPlugins

  if (items.length === 0) {
    return (
      <div className={`owned-items-empty ${className}`}>
        <p>No {itemType ? `${itemType}s` : 'items'} owned yet</p>
      </div>
    )
  }

  return (
    <div className={`owned-items-list ${className}`}>
      {items.map((item) => (
        <div key={item.purchaseId} className="owned-item-card">
          <div className="owned-item-icon">
            {item.itemType === 'template' && '📋'}
            {item.itemType === 'feature' && '⭐'}
            {item.itemType === 'asset' && '🎨'}
            {item.itemType === 'plugin' && '🔌'}
          </div>
          <div className="owned-item-info">
            <h4>{item.itemName}</h4>
            <p className="owned-item-type">{item.itemType}</p>
            <p className="owned-item-date">
              Purchased {new Date(item.purchasedAt).toLocaleDateString()}
            </p>
          </div>
          <OwnedBadge />
        </div>
      ))}
    </div>
  )
}

// ============================================================================
// PURCHASE HISTORY
// ============================================================================

interface PurchaseHistoryProps {
  className?: string
}

export function PurchaseHistory({ className = '' }: PurchaseHistoryProps) {
  const purchaseHistory = usePurchaseHistory()
  const totalSpent = useTotalSpent()

  if (purchaseHistory.length === 0) {
    return (
      <div className={`purchase-history-empty ${className}`}>
        <p>No purchase history yet</p>
      </div>
    )
  }

  return (
    <div className={`purchase-history ${className}`}>
      <div className="purchase-history-header">
        <h3>Purchase History</h3>
        <div className="purchase-history-total">
          Total Spent: <strong>${totalSpent.toFixed(2)}</strong>
        </div>
      </div>
      
      <div className="purchase-history-list">
        {purchaseHistory.map((purchase) => (
          <div key={purchase.id} className="purchase-history-item">
            <div className="purchase-history-icon">
              {purchase.itemType === 'template' && '📋'}
              {purchase.itemType === 'feature' && '⭐'}
              {purchase.itemType === 'asset' && '🎨'}
              {purchase.itemType === 'plugin' && '🔌'}
            </div>
            <div className="purchase-history-info">
              <h4>{purchase.itemName}</h4>
              <p className="purchase-history-date">
                {new Date(purchase.purchasedAt).toLocaleDateString()} at{' '}
                {new Date(purchase.purchasedAt).toLocaleTimeString()}
              </p>
              <p className="purchase-history-transaction">
                Transaction: {purchase.transactionId}
              </p>
            </div>
            <div className="purchase-history-price">
              {purchase.price === 0 ? (
                <span className="purchase-history-free">Free</span>
              ) : (
                <span>
                  {purchase.currency === 'USD' ? '$' : purchase.currency}
                  {purchase.price.toFixed(2)}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// OWNED TEMPLATES GALLERY
// ============================================================================

interface OwnedTemplatesGalleryProps {
  onSelect?: (templateId: string) => void
  className?: string
}

export function OwnedTemplatesGallery({
  onSelect,
  className = '',
}: OwnedTemplatesGalleryProps) {
  const ownedTemplates = useOwnedTemplates()

  if (ownedTemplates.length === 0) {
    return (
      <div className={`owned-templates-empty ${className}`}>
        <p>No templates owned yet</p>
        <p className="owned-templates-empty-hint">
          Purchase templates from the marketplace to get started
        </p>
      </div>
    )
  }

  return (
    <div className={`owned-templates-gallery ${className}`}>
      {ownedTemplates.map((template) => (
        <div
          key={template.purchaseId}
          className="owned-template-card"
          onClick={() => onSelect?.(template.itemId)}
        >
          <div className="owned-template-preview">
            <span className="owned-template-icon">📋</span>
          </div>
          <div className="owned-template-info">
            <h4>{template.itemName}</h4>
            <OwnedBadge />
          </div>
        </div>
      ))}
    </div>
  )
}

// ============================================================================
// PURCHASE STATS
// ============================================================================

interface PurchaseStatsProps {
  className?: string
}

export function PurchaseStats({ className = '' }: PurchaseStatsProps) {
  const {
    ownedTemplates,
    ownedFeatures,
    ownedAssets,
    ownedPlugins,
    purchaseHistory,
  } = usePurchases()
  const totalSpent = useTotalSpent()

  return (
    <div className={`purchase-stats ${className}`}>
      <div className="purchase-stat-card">
        <div className="purchase-stat-value">{ownedTemplates.length}</div>
        <div className="purchase-stat-label">Templates</div>
      </div>
      
      <div className="purchase-stat-card">
        <div className="purchase-stat-value">{ownedFeatures.length}</div>
        <div className="purchase-stat-label">Features</div>
      </div>
      
      <div className="purchase-stat-card">
        <div className="purchase-stat-value">{ownedAssets.length}</div>
        <div className="purchase-stat-label">Assets</div>
      </div>
      
      <div className="purchase-stat-card">
        <div className="purchase-stat-value">{ownedPlugins.length}</div>
        <div className="purchase-stat-label">Plugins</div>
      </div>
      
      <div className="purchase-stat-card purchase-stat-total">
        <div className="purchase-stat-value">${totalSpent.toFixed(2)}</div>
        <div className="purchase-stat-label">Total Spent</div>
      </div>
      
      <div className="purchase-stat-card">
        <div className="purchase-stat-value">{purchaseHistory.length}</div>
        <div className="purchase-stat-label">Transactions</div>
      </div>
    </div>
  )
}
