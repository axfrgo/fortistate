import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Template, TemplateCategory, PricingModel } from '../marketplace/types'
import { useOwnsItem, useCurrentAccount, usePurchases } from '../subscription/useSubscription'
import { OwnedBadge, PurchaseButton } from '../subscription/PurchaseComponents'
import './MarketplaceGallery.css'

interface MarketplaceGalleryProps {
  templates: Template[]
  onTemplateClick: (template: Template) => void
  onPurchase: (templateId: string) => Promise<void>
  currentUserId?: string
}

const CATEGORIES: TemplateCategory[] = [
  'ecommerce',
  'gaming',
  'finance',
  'iot',
  'social',
  'healthcare',
  'logistics',
  'education',
]

export function MarketplaceGallery({
  templates,
  onTemplateClick,
  onPurchase,
  currentUserId,
}: MarketplaceGalleryProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all'>('all')
  const [pricingFilter, setPricingFilter] = useState<PricingModel | 'all'>('all')
  const [sortBy, setSortBy] = useState<'mostDownloaded' | 'highestRated' | 'newest' | 'price'>('mostDownloaded')

  // Filter and sort templates
  const filteredTemplates = useMemo(() => {
    let filtered = templates

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query) ||
          t.tags.some((tag) => tag.toLowerCase().includes(query))
      )
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((t) => t.category === selectedCategory)
    }

    // Pricing filter
    if (pricingFilter !== 'all') {
      filtered = filtered.filter((t) => t.pricingModel === pricingFilter)
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'mostDownloaded':
          return b.downloads - a.downloads
        case 'highestRated':
          return b.rating - a.rating
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'price':
          return (b.price || 0) - (a.price || 0)
        default:
          return 0
      }
    })

    return filtered
  }, [templates, searchQuery, selectedCategory, pricingFilter, sortBy])

  return (
    <div className="marketplace-gallery">
      {/* Header */}
      <div className="gallery-header">
        <div className="header-top">
          <h1>Marketplace</h1>
          <p>Browse and purchase pre-built templates for your projects</p>
        </div>

        {/* Search and filters */}
        <div className="filters-bar">
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as TemplateCategory | 'all')}
            className="filter-select"
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>

          <select
            value={pricingFilter}
            onChange={(e) => setPricingFilter(e.target.value as PricingModel | 'all')}
            className="filter-select"
          >
            <option value="all">All Pricing</option>
            <option value="free">Free</option>
            <option value="paid">Paid</option>
            <option value="freemium">Freemium</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="filter-select"
          >
            <option value="mostDownloaded">Most Downloaded</option>
            <option value="highestRated">Highest Rated</option>
            <option value="newest">Newest</option>
            <option value="price">Price</option>
          </select>
        </div>
      </div>

      {/* Results count */}
      <div className="results-info">
        {filteredTemplates.length} {filteredTemplates.length === 1 ? 'template' : 'templates'} found
      </div>

      {/* Template grid */}
      <motion.div className="templates-grid" layout>
        <AnimatePresence>
          {filteredTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onClick={() => onTemplateClick(template)}
              onPurchase={onPurchase}
              isOwner={template.authorId === currentUserId}
            />
          ))}
        </AnimatePresence>
      </motion.div>

      {filteredTemplates.length === 0 && (
        <div className="empty-state">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
            <path
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <h3>No templates found</h3>
          <p>Try adjusting your filters or search query</p>
        </div>
      )}
    </div>
  )
}

interface TemplateCardProps {
  template: Template
  onClick: () => void
  onPurchase: (templateId: string) => Promise<void>
  isOwner: boolean
}

// Category color mapping
const getCategoryColor = (category: TemplateCategory): string => {
  switch (category) {
    case 'ecommerce': return '#10b981' // green
    case 'gaming': return '#8b5cf6' // purple
    case 'finance': return '#3b82f6' // blue
    case 'iot': return '#06b6d4' // cyan
    case 'social': return '#ec4899' // pink
    case 'healthcare': return '#ef4444' // red
    case 'logistics': return '#f59e0b' // amber
    case 'education': return '#6366f1' // indigo
    default: return '#6b7280' // gray
  }
}

function TemplateCard({ template, onClick, onPurchase, isOwner }: TemplateCardProps) {
  const [isPurchasing, setIsPurchasing] = useState(false)
  const account = useCurrentAccount()
  const ownsTemplate = useOwnsItem(template.id)
  const { actions: purchaseActions } = usePurchases()

  const handlePurchase = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!account) return
    
    setIsPurchasing(true)
    try {
      await onPurchase(template.id)
      
      // Record purchase in our system
      const price = template.price || 0
      purchaseActions.purchaseItem(
        account.id,
        'template',
        template.id,
        template.name,
        price / 100, // Convert cents to dollars
        'USD'
      )
    } catch (error) {
      console.error('Purchase failed', error)
    } finally {
      setIsPurchasing(false)
    }
  }

  const categoryColor = getCategoryColor(template.category)

  return (
    <motion.div
      className={`template-card template-card--${template.category}`}
      style={{
        '--category-color': categoryColor,
      } as React.CSSProperties}
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -4 }}
      onClick={onClick}
    >
      {/* Preview/thumbnail */}
      <div className="template-preview">
        {template.thumbnail ? (
          <img src={template.thumbnail} alt={template.name} />
        ) : (
          <div className="preview-placeholder">
            {template.icon ? (
              <span className="template-icon">{template.icon}</span>
            ) : (
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
                <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
                <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
                <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
              </svg>
            )}
          </div>
        )}

        {/* Category badge */}
        <div className="category-badge">{template.category}</div>

        {/* Owner badge */}
        {isOwner && <div className="owner-badge">Your Template</div>}
        
        {/* Owned badge */}
        {ownsTemplate && !isOwner && (
          <div className="owned-template-badge">
            <OwnedBadge />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="template-content">
        <h3>{template.name}</h3>
        <p>{template.description}</p>

        {/* Tags */}
        <div className="template-tags">
          {template.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="tag">
              {tag}
            </span>
          ))}
        </div>

        {/* Stats */}
        <div className="template-stats">
          <div className="stat">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                fill="currentColor"
              />
            </svg>
            {template.rating.toFixed(1)}
          </div>
          <div className="stat">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            {template.downloads}
          </div>
          <div className="stat">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
            {template.forks}
          </div>
        </div>

        {/* Price and action */}
        <div className="template-footer">
          <div className="price">
            {template.pricingModel === 'free' ? (
              <span className="free-badge">Free</span>
            ) : (
              <span className="price-amount">${(template.price! / 100).toFixed(2)}</span>
            )}
          </div>

          {ownsTemplate ? (
            <OwnedBadge />
          ) : !isOwner ? (
            template.pricingModel === 'free' ? (
              <button
                className="purchase-button"
                onClick={handlePurchase}
                disabled={isPurchasing}
              >
                {isPurchasing ? 'Processing...' : 'Use Template'}
              </button>
            ) : (
              <PurchaseButton
                itemId={template.id}
                itemName={template.name}
                itemType="template"
                price={template.price! / 100}
                currency="USD"
                onPurchase={async () => {
                  // Call the original onPurchase handler
                  await onPurchase(template.id)
                }}
              />
            )
          ) : null}
        </div>
      </div>
    </motion.div>
  )
}
