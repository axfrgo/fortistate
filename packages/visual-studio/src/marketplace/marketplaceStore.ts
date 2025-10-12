/**
 * Marketplace Store using Fortistate Laws
 * Template economy with revenue sharing
 */

import { runtimeConfig } from '../runtimeConfig'

import type {
  Template,
  TemplateId,
  UserId,
  TemplateCategory,
  TemplateReview,
  Purchase,
  MarketplaceStats,
  CreatorDashboard,
} from './types'

const REVENUE_SPLIT = {
  platform: 0.3, // 30% platform fee
  creator: 0.7,  // 70% to creator
}

export class MarketplaceStore {
  private templates: Map<TemplateId, Template> = new Map()
  private purchases: Map<string, Purchase> = new Map()
  private reviews: Map<TemplateId, TemplateReview[]> = new Map()
  private apiBase: string = runtimeConfig.marketplaceBaseUrl

  constructor() {
    this.loadMockData()
  }

  // BEGIN: Create new template
  async createTemplate(data: Omit<Template, 'id' | 'downloads' | 'forks' | 'rating' | 'reviewCount' | 'revenue' | 'createdAt' | 'updatedAt'>): Promise<Template> {
    const template: Template = {
      ...data,
      id: crypto.randomUUID(),
      downloads: 0,
      forks: 0,
      rating: 0,
      reviewCount: 0,
      revenue: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    try {
      const response = await fetch(`${this.apiBase}/templates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template),
      })

      if (!response.ok) throw new Error('Failed to create template')

      this.templates.set(template.id, template)
      console.log('✅ Template created:', template.name)
      return template
    } catch (error) {
      // Fallback to local storage
      this.templates.set(template.id, template)
      this.persistToLocalStorage()
      return template
    }
  }

  // BECOME: Update template
  async updateTemplate(id: TemplateId, updates: Partial<Template>): Promise<Template | null> {
    const existing = this.templates.get(id)
    if (!existing) return null

    const updated: Template = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    }

    try {
      await fetch(`${this.apiBase}/templates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      })

      this.templates.set(id, updated)
      this.persistToLocalStorage()
      return updated
    } catch (error) {
      this.templates.set(id, updated)
      this.persistToLocalStorage()
      return updated
    }
  }

  // CEASE: Delete template
  async deleteTemplate(id: TemplateId, userId: UserId): Promise<boolean> {
    const template = this.templates.get(id)
    if (!template || template.authorId !== userId) {
      console.error('❌ Unauthorized or template not found')
      return false
    }

    try {
      await fetch(`${this.apiBase}/templates/${id}`, {
        method: 'DELETE',
      })

      this.templates.delete(id)
      this.reviews.delete(id)
      this.persistToLocalStorage()
      console.log('🗑️ Template deleted:', template.name)
      return true
    } catch (error) {
      this.templates.delete(id)
      this.persistToLocalStorage()
      return true
    }
  }

  // Browse templates
  async browseTemplates(filters: {
    category?: TemplateCategory
    search?: string
    sort?: 'popular' | 'recent' | 'top-rated' | 'trending'
    pricingModel?: 'free' | 'paid' | 'all'
    page?: number
    limit?: number
  } = {}): Promise<Template[]> {
    try {
      const params = new URLSearchParams()
      if (filters.category) params.set('category', filters.category)
      if (filters.search) params.set('search', filters.search)
      if (filters.sort) params.set('sort', filters.sort)
      if (filters.pricingModel && filters.pricingModel !== 'all') {
        params.set('pricingModel', filters.pricingModel)
      }
      params.set('page', String(filters.page || 1))
      params.set('limit', String(filters.limit || 20))

      const response = await fetch(`${this.apiBase}/templates?${params}`)
      if (!response.ok) throw new Error('Failed to fetch templates')

      const data = await response.json()
      return data.templates || []
    } catch (error) {
      // Fallback to local filtering
      return this.filterTemplatesLocally(filters)
    }
  }

  private filterTemplatesLocally(filters: any): Template[] {
    let results = Array.from(this.templates.values()).filter((t) => t.isPublic)

    if (filters.category) {
      results = results.filter((t) => t.category === filters.category)
    }

    if (filters.search) {
      const query = filters.search.toLowerCase()
      results = results.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query) ||
          t.tags.some((tag) => tag.toLowerCase().includes(query))
      )
    }

    if (filters.pricingModel && filters.pricingModel !== 'all') {
      results = results.filter((t) => t.pricingModel === filters.pricingModel)
    }

    // Sort
    switch (filters.sort) {
      case 'popular':
        results.sort((a, b) => b.downloads - a.downloads)
        break
      case 'recent':
        results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        break
      case 'top-rated':
        results.sort((a, b) => b.rating - a.rating)
        break
      case 'trending':
        // Simple trending: recent + popular
        results.sort((a, b) => {
          const scoreA = a.downloads * 0.7 + new Date(a.createdAt).getTime() * 0.3
          const scoreB = b.downloads * 0.7 + new Date(b.createdAt).getTime() * 0.3
          return scoreB - scoreA
        })
        break
    }

    return results
  }

  // Get single template
  async getTemplate(id: TemplateId): Promise<Template | null> {
    try {
      const response = await fetch(`${this.apiBase}/templates/${id}`)
      if (!response.ok) throw new Error('Template not found')
      return await response.json()
    } catch (error) {
      return this.templates.get(id) || null
    }
  }

  // Purchase template
  async purchaseTemplate(templateId: TemplateId, userId: UserId): Promise<Purchase> {
    const template = this.templates.get(templateId)
    if (!template) throw new Error('Template not found')

    if (template.pricingModel === 'free') {
      // Free template - just increment downloads
      await this.updateTemplate(templateId, {
        downloads: template.downloads + 1,
      })

      const purchase: Purchase = {
        id: crypto.randomUUID(),
        templateId,
        userId,
        amount: 0,
        currency: 'USD',
        status: 'completed',
        createdAt: new Date().toISOString(),
      }

      this.purchases.set(purchase.id, purchase)
      return purchase
    }

    // Paid template - process payment
    try {
      const response = await fetch(`${this.apiBase}/templates/${templateId}/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, amount: template.price }),
      })

      if (!response.ok) throw new Error('Payment failed')

      const purchase: Purchase = await response.json()
      this.purchases.set(purchase.id, purchase)

      // Update template stats
      const creatorRevenue = Math.floor(template.price * REVENUE_SPLIT.creator)
      await this.updateTemplate(templateId, {
        downloads: template.downloads + 1,
        revenue: template.revenue + creatorRevenue,
      })

      console.log(`💰 Purchase complete: $${(template.price / 100).toFixed(2)}`)
      return purchase
    } catch (error) {
      // Fallback: simulate purchase
      const purchase: Purchase = {
        id: crypto.randomUUID(),
        templateId,
        userId,
        amount: template.price,
        currency: 'USD',
        status: 'completed',
        createdAt: new Date().toISOString(),
      }

      this.purchases.set(purchase.id, purchase)

      const creatorRevenue = Math.floor(template.price * REVENUE_SPLIT.creator)
      await this.updateTemplate(templateId, {
        downloads: template.downloads + 1,
        revenue: template.revenue + creatorRevenue,
      })

      this.persistToLocalStorage()
      return purchase
    }
  }

  // Review system
  async addReview(templateId: TemplateId, review: Omit<TemplateReview, 'id' | 'createdAt'>): Promise<TemplateReview> {
    const newReview: TemplateReview = {
      ...review,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    }

    const existing = this.reviews.get(templateId) || []
    existing.push(newReview)
    this.reviews.set(templateId, existing)

    // Recalculate rating
    const avgRating = existing.reduce((sum, r) => sum + r.rating, 0) / existing.length
    await this.updateTemplate(templateId, {
      rating: Math.round(avgRating * 10) / 10,
      reviewCount: existing.length,
    })

    this.persistToLocalStorage()
    return newReview
  }

  async getReviews(templateId: TemplateId): Promise<TemplateReview[]> {
    return this.reviews.get(templateId) || []
  }

  // Creator dashboard
  async getCreatorDashboard(userId: UserId): Promise<CreatorDashboard> {
    const userTemplates = Array.from(this.templates.values()).filter((t) => t.authorId === userId)

    const totalRevenue = userTemplates.reduce((sum, t) => sum + t.revenue, 0)
    const totalDownloads = userTemplates.reduce((sum, t) => sum + t.downloads, 0)
    const totalForks = userTemplates.reduce((sum, t) => sum + t.forks, 0)
    const averageRating =
      userTemplates.reduce((sum, t) => sum + t.rating, 0) / (userTemplates.length || 1)

    const recentPurchases = Array.from(this.purchases.values())
      .filter((p) => userTemplates.some((t) => t.id === p.templateId))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)

    // Calculate monthly revenue (last 12 months)
    const monthlyRevenue: Array<{ month: string; revenue: number }> = []
    const now = new Date()
    for (let i = 11; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthStr = month.toISOString().slice(0, 7) // YYYY-MM

      const monthPurchases = Array.from(this.purchases.values()).filter((p) => {
        const purchaseMonth = p.createdAt.slice(0, 7)
        return purchaseMonth === monthStr && userTemplates.some((t) => t.id === p.templateId)
      })

      const revenue = monthPurchases.reduce((sum, p) => sum + Math.floor(p.amount * REVENUE_SPLIT.creator), 0)
      monthlyRevenue.push({ month: monthStr, revenue })
    }

    return {
      userId,
      templates: userTemplates,
      totalRevenue,
      totalDownloads,
      totalForks,
      averageRating: Math.round(averageRating * 10) / 10,
      recentPurchases,
      monthlyRevenue,
    }
  }

  // Marketplace stats
  async getMarketplaceStats(): Promise<MarketplaceStats> {
    const allTemplates = Array.from(this.templates.values()).filter((t) => t.isPublic)

    const totalRevenue = allTemplates.reduce((sum, t) => sum + t.revenue, 0)
    const totalDownloads = allTemplates.reduce((sum, t) => sum + t.downloads, 0)

    const trendingTemplates = [...allTemplates]
      .sort((a, b) => {
        const scoreA = a.downloads * 0.5 + a.rating * 100
        const scoreB = b.downloads * 0.5 + b.rating * 100
        return scoreB - scoreA
      })
      .slice(0, 10)

    // Top creators
    const creatorMap = new Map<UserId, { name: string; avatar: string; revenue: number; downloads: number }>()

    allTemplates.forEach((t) => {
      const existing = creatorMap.get(t.authorId) || {
        name: t.authorName,
        avatar: t.authorAvatar,
        revenue: 0,
        downloads: 0,
      }

      existing.revenue += t.revenue
      existing.downloads += t.downloads
      creatorMap.set(t.authorId, existing)
    })

    const topCreators = Array.from(creatorMap.entries())
      .map(([userId, data]) => ({ userId, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    return {
      totalTemplates: allTemplates.length,
      totalRevenue,
      totalDownloads,
      trendingTemplates,
      topCreators,
    }
  }

  // Fork template
  async forkTemplate(templateId: TemplateId, userId: UserId, newName: string): Promise<Template> {
    const original = await this.getTemplate(templateId)
    if (!original) throw new Error('Template not found')

    // Increment fork count
    await this.updateTemplate(templateId, {
      forks: original.forks + 1,
    })

    // Create forked copy
    const forked = await this.createTemplate({
      name: newName,
      description: `Forked from: ${original.name}`,
      icon: original.icon,
      category: original.category,
      tags: [...original.tags, 'forked'],
      authorId: userId,
      authorName: 'Current User', // Should come from user context
      authorAvatar: '👤',
      nodes: JSON.parse(JSON.stringify(original.nodes)),
      edges: JSON.parse(JSON.stringify(original.edges)),
      metadata: {
        ...original.metadata,
        forkedFrom: templateId,
      },
      pricingModel: 'free',
      price: 0,
      version: '1.0.0',
      isPublic: false,
      isFeatured: false,
    })

    return forked
  }

  // Persistence
  private persistToLocalStorage(): void {
    try {
      localStorage.setItem('marketplace:templates', JSON.stringify(Array.from(this.templates.entries())))
      localStorage.setItem('marketplace:purchases', JSON.stringify(Array.from(this.purchases.entries())))
      localStorage.setItem('marketplace:reviews', JSON.stringify(Array.from(this.reviews.entries())))
    } catch (error) {
      console.error('Failed to persist marketplace data:', error)
    }
  }

  private loadFromLocalStorage(): void {
    try {
      const templatesData = localStorage.getItem('marketplace:templates')
      if (templatesData) {
        this.templates = new Map(JSON.parse(templatesData))
      }

      const purchasesData = localStorage.getItem('marketplace:purchases')
      if (purchasesData) {
        this.purchases = new Map(JSON.parse(purchasesData))
      }

      const reviewsData = localStorage.getItem('marketplace:reviews')
      if (reviewsData) {
        this.reviews = new Map(JSON.parse(reviewsData))
      }
    } catch (error) {
      console.error('Failed to load marketplace data:', error)
    }
  }

  // Mock data for demo
  private loadMockData(): void {
    this.loadFromLocalStorage()

    // If no data, create some mock templates
    if (this.templates.size === 0) {
      const mockTemplates: Omit<Template, 'id' | 'downloads' | 'forks' | 'rating' | 'reviewCount' | 'revenue' | 'createdAt' | 'updatedAt'>[] = [
        {
          name: 'E-commerce Starter',
          description: 'Shopping cart with inventory tracking, fraud detection, and payment processing',
          icon: '🛒',
          category: 'ecommerce',
          tags: ['cart', 'inventory', 'payments'],
          authorId: 'user-1',
          authorName: 'Alice Chen',
          authorAvatar: '👩‍💻',
          nodes: [],
          edges: [],
          metadata: {},
          pricingModel: 'free',
          price: 0,
          version: '1.0.0',
          isPublic: true,
          isFeatured: true,
        },
        {
          name: 'Real-time Chat System',
          description: 'WebSocket-based chat with presence, typing indicators, and message persistence',
          icon: '💬',
          category: 'social',
          tags: ['chat', 'websocket', 'realtime'],
          authorId: 'user-1',
          authorName: 'Alice Chen',
          authorAvatar: '👩‍💻',
          nodes: [],
          edges: [],
          metadata: {},
          pricingModel: 'paid',
          price: 900,
          version: '1.2.0',
          isPublic: true,
          isFeatured: true,
        },
        {
          name: 'Banking KYC Flow',
          description: 'Know-Your-Customer onboarding with document verification and compliance checks',
          icon: '🏦',
          category: 'finance',
          tags: ['banking', 'kyc', 'compliance'],
          authorId: 'user-2',
          authorName: 'Bob Smith',
          authorAvatar: '👨‍💼',
          nodes: [],
          edges: [],
          metadata: {},
          pricingModel: 'paid',
          price: 4900,
          version: '2.0.0',
          isPublic: true,
          isFeatured: false,
        },
      ]

      mockTemplates.forEach(async (t) => {
        await this.createTemplate(t)
      })
    }
  }
}

// Singleton
let instance: MarketplaceStore | null = null

export function createMarketplaceStore(): MarketplaceStore {
  if (!instance) {
    instance = new MarketplaceStore()
  }
  return instance
}

export function getMarketplaceStore(): MarketplaceStore | null {
  return instance
}
