import type { Node, Edge } from 'reactflow'

export interface Template {
  id: string
  name: string
  description: string
  category: 'banking' | 'ecommerce' | 'game' | 'demo' | 'automation'
  icon: string
  nodes: Node[]
  edges: Edge[]
}

export const templates: Template[] = [
  // Banking Universe
  {
    id: 'banking-basic',
    name: 'Banking Universe',
    description: 'Account lifecycle with deposits, withdrawals, and boundaries',
    category: 'banking',
    icon: '🏦',
    nodes: [
      {
        id: 'begin-alice',
        type: 'begin',
        position: { x: 100, y: 50 },
        data: { 
          entity: 'user:alice',
          properties: { balance: 100, tier: 'basic' },
          narrative: "🌱 Alice's account begins with $100",
          status: 'idle'
        },
      },
      {
        id: 'become-deposit',
        type: 'become',
        position: { x: 100, y: 220 },
        data: { 
          entity: 'user:alice',
          transform: 'balance + 50',
          trigger: 'deposit event',
          narrative: "🌊 Alice deposits $50",
          status: 'idle'
        },
      },
      {
        id: 'become-withdraw',
        type: 'become',
        position: { x: 100, y: 390 },
        data: { 
          entity: 'user:alice',
          transform: 'balance - 200',
          trigger: 'withdrawal event',
          narrative: "🌊 Alice withdraws $200",
          status: 'idle'
        },
      },
      {
        id: 'cease-boundary',
        type: 'cease',
        position: { x: 100, y: 560 },
        data: { 
          entity: 'user:alice',
          condition: 'balance < 0',
          action: 'repair',
          narrative: "🧱 Balance cannot go negative - repair to $0",
          status: 'idle'
        },
      },
      {
        id: 'transcend-vip',
        type: 'transcend',
        position: { x: 400, y: 560 },
        data: { 
          entity: 'user:alice',
          portal: 'universe:vip',
          condition: 'balance > 10000',
          narrative: "🌀 Transcend to VIP universe at $10k",
          status: 'idle'
        },
      },
    ],
    edges: [
      { id: 'e1', source: 'begin-alice', target: 'become-deposit', animated: true, style: { stroke: '#10B981', strokeWidth: 2 } },
      { id: 'e2', source: 'become-deposit', target: 'become-withdraw', animated: true, style: { stroke: '#3B82F6', strokeWidth: 2 } },
      { id: 'e3', source: 'become-withdraw', target: 'cease-boundary', animated: true, style: { stroke: '#3B82F6', strokeWidth: 2 } },
      { id: 'e4', source: 'cease-boundary', target: 'transcend-vip', animated: true, style: { stroke: '#8B5CF6', strokeWidth: 2 } },
    ],
  },

  // E-commerce Universe
  {
    id: 'ecommerce-inventory',
    name: 'E-commerce Inventory',
    description: 'Product stock management with constraints',
    category: 'ecommerce',
    icon: '🛒',
    nodes: [
      {
        id: 'begin-product',
        type: 'begin',
        position: { x: 100, y: 50 },
        data: { 
          entity: 'product:laptop',
          properties: { stock: 50, price: 999 },
          narrative: "🌱 Laptop inventory begins with 50 units",
          status: 'idle'
        },
      },
      {
        id: 'become-sale',
        type: 'become',
        position: { x: 100, y: 220 },
        data: { 
          entity: 'product:laptop',
          transform: 'stock - 10',
          trigger: 'order event',
          narrative: "🌊 10 laptops sold",
          status: 'idle'
        },
      },
      {
        id: 'cease-outofstock',
        type: 'cease',
        position: { x: 100, y: 390 },
        data: { 
          entity: 'product:laptop',
          condition: 'stock <= 0',
          action: 'terminate',
          narrative: "🧱 Out of stock - remove listing",
          status: 'idle'
        },
      },
      {
        id: 'become-restock',
        type: 'become',
        position: { x: 400, y: 220 },
        data: { 
          entity: 'product:laptop',
          transform: 'stock + 100',
          trigger: 'restock event',
          narrative: "🌊 Restocked with 100 units",
          status: 'idle'
        },
      },
    ],
    edges: [
      { id: 'e1', source: 'begin-product', target: 'become-sale', animated: true, style: { stroke: '#10B981', strokeWidth: 2 } },
      { id: 'e2', source: 'become-sale', target: 'cease-outofstock', animated: true, style: { stroke: '#3B82F6', strokeWidth: 2 } },
      { id: 'e3', source: 'become-sale', target: 'become-restock', animated: true, style: { stroke: '#3B82F6', strokeWidth: 2 } },
    ],
  },

  // Game Universe
  {
    id: 'game-player',
    name: 'Game Player Lifecycle',
    description: 'Player level-up with death and respawn mechanics',
    category: 'game',
    icon: '🎮',
    nodes: [
      {
        id: 'begin-player',
        type: 'begin',
        position: { x: 100, y: 50 },
        data: { 
          entity: 'player:hero',
          properties: { hp: 100, level: 1, xp: 0 },
          narrative: "🌱 Hero spawns at level 1",
          status: 'idle'
        },
      },
      {
        id: 'become-damage',
        type: 'become',
        position: { x: 100, y: 220 },
        data: { 
          entity: 'player:hero',
          transform: 'hp - 30',
          trigger: 'enemy attack',
          narrative: "🌊 Takes 30 damage",
          status: 'idle'
        },
      },
      {
        id: 'cease-death',
        type: 'cease',
        position: { x: 100, y: 390 },
        data: { 
          entity: 'player:hero',
          condition: 'hp <= 0',
          action: 'fork',
          narrative: "🧱 Death detected - fork respawn universe",
          status: 'idle'
        },
      },
      {
        id: 'become-levelup',
        type: 'become',
        position: { x: 400, y: 220 },
        data: { 
          entity: 'player:hero',
          transform: 'level + 1',
          trigger: 'xp > 1000',
          narrative: "🌊 Level up!",
          status: 'idle'
        },
      },
      {
        id: 'transcend-endgame',
        type: 'transcend',
        position: { x: 400, y: 390 },
        data: { 
          entity: 'player:hero',
          portal: 'universe:endgame',
          condition: 'level >= 10',
          narrative: "🌀 Transcend to endgame content",
          status: 'idle'
        },
      },
    ],
    edges: [
      { id: 'e1', source: 'begin-player', target: 'become-damage', animated: true, style: { stroke: '#10B981', strokeWidth: 2 } },
      { id: 'e2', source: 'become-damage', target: 'cease-death', animated: true, style: { stroke: '#3B82F6', strokeWidth: 2 } },
      { id: 'e3', source: 'begin-player', target: 'become-levelup', animated: true, style: { stroke: '#10B981', strokeWidth: 2 } },
      { id: 'e4', source: 'become-levelup', target: 'transcend-endgame', animated: true, style: { stroke: '#8B5CF6', strokeWidth: 2 } },
    ],
  },

  // Simple Demo
  {
    id: 'demo-simple',
    name: 'Simple Demo',
    description: 'Minimal example showing all four operators',
    category: 'demo',
    icon: '✨',
    nodes: [
      {
        id: 'begin-1',
        type: 'begin',
        position: { x: 100, y: 100 },
        data: { 
          entity: 'entity:demo',
          properties: { value: 0 },
          narrative: "🌱 Demo entity begins",
          status: 'idle'
        },
      },
      {
        id: 'become-1',
        type: 'become',
        position: { x: 300, y: 100 },
        data: { 
          entity: 'entity:demo',
          transform: 'value + 1',
          trigger: 'increment',
          narrative: "🌊 Value increments",
          status: 'idle'
        },
      },
      {
        id: 'cease-1',
        type: 'cease',
        position: { x: 100, y: 300 },
        data: { 
          entity: 'entity:demo',
          condition: 'value > 10',
          action: 'terminate',
          narrative: "🧱 Terminate at 10",
          status: 'idle'
        },
      },
      {
        id: 'transcend-1',
        type: 'transcend',
        position: { x: 300, y: 300 },
        data: { 
          entity: 'entity:demo',
          portal: 'universe:next',
          condition: 'value === 5',
          narrative: "🌀 Portal at 5",
          status: 'idle'
        },
      },
    ],
    edges: [
      { id: 'e1', source: 'begin-1', target: 'become-1', animated: true, style: { stroke: '#10B981', strokeWidth: 2 } },
      { id: 'e2', source: 'become-1', target: 'cease-1', animated: true, style: { stroke: '#3B82F6', strokeWidth: 2 } },
      { id: 'e3', source: 'become-1', target: 'transcend-1', animated: true, style: { stroke: '#3B82F6', strokeWidth: 2 } },
    ],
  },

  // Social Media Automation
  {
    id: 'automation-social-media',
    name: 'Social Media Automation',
    description: 'Weekly content pipeline: ChatGPT → Calendar → Daily Posts → Completion',
    category: 'automation',
    icon: '📱',
    nodes: [
      {
        id: 'begin-campaign',
        type: 'begin',
        position: { x: 100, y: 50 },
        data: { 
          entity: 'campaign:weekly',
          properties: { 
            status: 'initialized',
            postsGenerated: 0,
            postsScheduled: 0,
            postsPublished: 0,
            currentDay: 0
          },
          narrative: "🌱 Social media campaign initialized",
          status: 'idle'
        },
      },
      {
        id: 'become-generate-posts',
        type: 'become',
        position: { x: 100, y: 220 },
        data: { 
          entity: 'campaign:weekly',
          transform: 'status = "generating", postsGenerated = 7',
          trigger: 'request ChatGPT API for 7 posts',
          narrative: "🤖 ChatGPT generates 7 posts for the week",
          status: 'idle'
        },
      },
      {
        id: 'become-schedule-calendar',
        type: 'become',
        position: { x: 100, y: 390 },
        data: { 
          entity: 'campaign:weekly',
          transform: 'status = "scheduled", postsScheduled = 7',
          trigger: 'add posts to calendar (Mon-Sun)',
          narrative: "📅 Posts scheduled to calendar for each day",
          status: 'idle'
        },
      },
      {
        id: 'become-post-daily',
        type: 'become',
        position: { x: 100, y: 560 },
        data: { 
          entity: 'campaign:weekly',
          transform: 'postsPublished++, currentDay++',
          trigger: 'daily trigger (24h interval)',
          narrative: "📤 Daily post published (repeats 7 times)",
          status: 'idle'
        },
      },
      {
        id: 'cease-week-complete',
        type: 'cease',
        position: { x: 100, y: 730 },
        data: { 
          entity: 'campaign:weekly',
          condition: 'postsPublished === 7',
          action: 'send notification',
          narrative: "✅ Week complete! Send completion message to user",
          status: 'idle'
        },
      },
      {
        id: 'transcend-next-week',
        type: 'transcend',
        position: { x: 400, y: 730 },
        data: { 
          entity: 'campaign:weekly',
          portal: 'campaign:next-week',
          condition: 'status === "completed"',
          narrative: "🔄 Start new week's campaign automatically",
          status: 'idle'
        },
      },
    ],
    edges: [
      { id: 'e1', source: 'begin-campaign', target: 'become-generate-posts', animated: true, style: { stroke: '#10B981', strokeWidth: 2 } },
      { id: 'e2', source: 'become-generate-posts', target: 'become-schedule-calendar', animated: true, style: { stroke: '#3B82F6', strokeWidth: 2 } },
      { id: 'e3', source: 'become-schedule-calendar', target: 'become-post-daily', animated: true, style: { stroke: '#3B82F6', strokeWidth: 2 } },
      { id: 'e4', source: 'become-post-daily', target: 'become-post-daily', animated: true, style: { stroke: '#F59E0B', strokeWidth: 2, strokeDasharray: '5,5' }, label: 'Loop 7x' },
      { id: 'e5', source: 'become-post-daily', target: 'cease-week-complete', animated: true, style: { stroke: '#3B82F6', strokeWidth: 2 } },
      { id: 'e6', source: 'cease-week-complete', target: 'transcend-next-week', animated: true, style: { stroke: '#8B5CF6', strokeWidth: 2 } },
    ],
  },
]

/**
 * Get template by ID
 */
export function getTemplate(id: string): Template | undefined {
  return templates.find(t => t.id === id)
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: Template['category']): Template[] {
  return templates.filter(t => t.category === category)
}
