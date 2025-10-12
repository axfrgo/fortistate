/**
 * Marketplace Types
 * Template economy powered by Fortistate laws
 */

import type { Node, Edge } from 'reactflow'

export type TemplateId = string
export type UserId = string
export type CategoryId = string

export type TemplateCategory =
  | 'ecommerce'
  | 'gaming'
  | 'finance'
  | 'iot'
  | 'social'
  | 'healthcare'
  | 'logistics'
  | 'education'
  | 'other'

export type PricingModel = 'free' | 'paid' | 'freemium'

export interface Template {
  id: TemplateId
  name: string
  description: string
  icon: string
  thumbnail?: string // Preview image URL
  category: TemplateCategory
  tags: string[]
  authorId: UserId
  authorName: string
  authorAvatar: string
  
  // Content
  nodes: Node[]
  edges: Edge[]
  metadata: Record<string, any>
  
  // Pricing
  pricingModel: PricingModel
  price: number // in cents (e.g., 900 = $9.00)
  
  // Stats
  downloads: number
  forks: number
  rating: number // 0-5
  reviewCount: number
  revenue: number // total earned in cents
  
  // Metadata
  createdAt: string
  updatedAt: string
  version: string
  isPublic: boolean
  isFeatured: boolean
}

export interface TemplateReview {
  id: string
  templateId: TemplateId
  userId: UserId
  userName: string
  userAvatar: string
  rating: number // 1-5
  comment: string
  createdAt: string
}

export interface Purchase {
  id: string
  templateId: TemplateId
  userId: UserId
  amount: number // in cents
  currency: string
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  stripePaymentIntentId?: string
  createdAt: string
}

export interface MarketplaceStats {
  totalTemplates: number
  totalRevenue: number
  totalDownloads: number
  trendingTemplates: Template[]
  topCreators: Array<{
    userId: UserId
    name: string
    avatar: string
    revenue: number
    downloads: number
  }>
}

export interface CreatorDashboard {
  userId: UserId
  templates: Template[]
  totalRevenue: number // in cents
  totalDownloads: number
  totalForks: number
  averageRating: number
  recentPurchases: Purchase[]
  monthlyRevenue: Array<{ month: string; revenue: number }>
}
