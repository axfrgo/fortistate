/**
 * 🌱 Fortistate vX Example: Banking Universe
 * 
 * This example demonstrates the new ontogenetic operators:
 * - BEGIN: Create user accounts
 * - BECOME: Process deposits and withdrawals
 * - CEASE: Enforce balance constraints with repair
 * - TRANSCEND: Upgrade to VIP universe
 */

import {
  createFabric,
  BEGIN,
  BECOME,
  CEASE,
  TRANSCEND,
  WHEN,
} from '../dist/ontogenesis/index.js'

console.log('🌱 Fortistate vX: Banking Universe Example\n')

// ═══════════════════════════════════════════════════════════════
// Create Law Fabric
// ═══════════════════════════════════════════════════════════════

const fabric = createFabric('universe:banking')

// ═══════════════════════════════════════════════════════════════
// Define Universe Laws (Ontogenetic Operators)
// ═══════════════════════════════════════════════════════════════

// BEGIN: Alice's account starts with $100
fabric.add(
  BEGIN('user:alice', { balance: 100, tier: 'basic', transactions: 0 }, {
    narrative: "🌱 Alice's account begins with $100 in the basic tier"
  })
)

// BEGIN: Bob's account starts with $5000
fabric.add(
  BEGIN('user:bob', { balance: 5000, tier: 'gold', transactions: 0 }, {
    narrative: "🌱 Bob's account begins with $5000 in the gold tier"
  })
)

// BECOME: Alice deposits $50
fabric.add(
  BECOME('user:alice',
    (state) => ({
      ...state,
      balance: state.balance + 50,
      transactions: state.transactions + 1,
      event: 'deposit'
    }),
    'IMMEDIATE',
    { narrative: "🌊 Alice deposits $50 - balance flows to $150" }
  )
)

// BECOME: Alice tries to withdraw $200 (will trigger CEASE)
fabric.add(
  BECOME('user:alice',
    (state) => ({
      ...state,
      balance: state.balance - 200,
      transactions: state.transactions + 1,
      event: 'withdrawal'
    }),
    'IMMEDIATE',
    { narrative: "🌊 Alice attempts to withdraw $200" }
  )
)

// CEASE: Balance cannot go negative - repair to 0
fabric.add(
  CEASE('user:alice',
    (state) => state.balance < 0,
    'repair',
    (state) => ({
      ...state,
      balance: 0,
      lastRepair: 'minimum_balance'
    }),
    { narrative: "🧱 Alice hits boundary - balance repaired to $0" }
  )
)

// BECOME: Bob makes a large deposit
fabric.add(
  BECOME('user:bob',
    (state) => ({
      ...state,
      balance: state.balance + 6000,
      transactions: state.transactions + 1
    }),
    'IMMEDIATE',
    { narrative: "🌊 Bob deposits $6000 - balance flows to $11,000" }
  )
)

// TRANSCEND: Bob transcends to VIP universe (balance > 10000)
fabric.add(
  TRANSCEND('user:bob',
    'universe:vip',
    (state) => state.balance > 10000,
    (state) => ({
      ...state,
      tier: 'platinum',
      benefits: ['concierge', 'zero-fees', 'priority-support']
    }),
    { narrative: "🌀 Bob transcends to VIP universe as platinum member" }
  )
)

// ═══════════════════════════════════════════════════════════════
// Execute Law Fabric
// ═══════════════════════════════════════════════════════════════

console.log('⚡ Executing Law Fabric...\n')

const result = fabric.execute()

// ═══════════════════════════════════════════════════════════════
// Display Narrative Story
// ═══════════════════════════════════════════════════════════════

console.log('📖 Execution Narrative:\n')
console.log('─'.repeat(60))

result.trace.forEach((step, i) => {
  console.log(`\n${i + 1}. ${step.narrative}`)
  
  if (step.before) {
    console.log(`   Before: ${JSON.stringify(step.before.properties)}`)
  }
  
  if (step.after) {
    console.log(`   After:  ${JSON.stringify(step.after.properties)}`)
  } else if (step.before && !step.after) {
    console.log(`   After:  [entity removed from universe]`)
  }
})

console.log('\n' + '─'.repeat(60))

// ═══════════════════════════════════════════════════════════════
// Display Final Reality
// ═══════════════════════════════════════════════════════════════

console.log('\n🌍 Final Reality State:\n')

const alice = result.reality.entities.get('user:alice')
if (alice) {
  console.log('👤 Alice:')
  console.log(`   Balance: $${alice.properties.balance}`)
  console.log(`   Tier: ${alice.properties.tier}`)
  console.log(`   Transactions: ${alice.properties.transactions}`)
  if (alice.properties.lastRepair) {
    console.log(`   Last Repair: ${alice.properties.lastRepair}`)
  }
} else {
  console.log('👤 Alice: [no longer in this universe]')
}

console.log()

const bob = result.reality.entities.get('user:bob')
if (bob) {
  console.log('👤 Bob:')
  console.log(`   Balance: $${bob.properties.balance}`)
  console.log(`   Tier: ${bob.properties.tier}`)
  console.log(`   Transactions: ${bob.properties.transactions}`)
} else {
  console.log('👤 Bob: [transcended to another universe]')
}

// ═══════════════════════════════════════════════════════════════
// Display Branched Universes
// ═══════════════════════════════════════════════════════════════

if (result.branches.length > 0) {
  console.log('\n🌌 Branched Universes:\n')
  
  result.branches.forEach((branch, i) => {
    console.log(`Universe ${i + 1}: ${branch.universeId}`)
    console.log(`  Entities: ${branch.entities.size}`)
    
    branch.entities.forEach((entity, id) => {
      console.log(`    - ${id}: ${JSON.stringify(entity.properties)}`)
    })
  })
}

// ═══════════════════════════════════════════════════════════════
// Display Performance Metrics
// ═══════════════════════════════════════════════════════════════

console.log('\n⚡ Performance:\n')
console.log(`   Propagation: ${result.performance.propagationMs.toFixed(2)}ms`)
console.log(`   Operations: ${result.trace.length}`)
console.log(`   Paradoxes: ${result.paradoxes.length}`)
console.log(`   Universe Forks: ${result.branches.length}`)

// ═══════════════════════════════════════════════════════════════
// Demonstrate Subscriptions
// ═══════════════════════════════════════════════════════════════

console.log('\n🔔 Demonstrating Reactive Subscriptions:\n')

const fabric2 = createFabric('universe:reactive')

const events = []

fabric2.subscribe('user:charlie', (state) => {
  events.push(`Charlie's balance changed to $${state.properties.balance}`)
})

fabric2
  .add(BEGIN('user:charlie', { balance: 1000 }))
  .add(BECOME('user:charlie', (s) => ({ ...s, balance: s.balance + 500 })))
  .add(BECOME('user:charlie', (s) => ({ ...s, balance: s.balance - 200 })))
  .execute()

events.forEach(event => console.log(`   📡 ${event}`))

// ═══════════════════════════════════════════════════════════════
// Demonstrate Paradox Resolution
// ═══════════════════════════════════════════════════════════════

console.log('\n🌀 Demonstrating Paradox Resolution (Universe Forking):\n')

const fabric3 = createFabric('universe:paradox')

fabric3
  .add(BEGIN('user:dave', { balance: 100 }))
  .add(BECOME('user:dave', (s) => ({ ...s, balance: -50 })))  // Violate constraint
  .add(CEASE('user:dave',
    (s) => s.balance < 0,
    'fork',  // Fork instead of repair
    (s) => ({ ...s, balance: 0 })
  ))

const result3 = fabric3.execute()

console.log(`   Paradoxes detected: ${result3.paradoxes.length}`)
console.log(`   Universes created: ${result3.branches.length}`)

if (result3.paradoxes.length > 0) {
  console.log('\n   Paradox details:')
  result3.paradoxes.forEach(p => {
    console.log(`     - Entity: ${p.entity}`)
    console.log(`       Constraint: ${p.constraint}`)
    console.log(`       Violation: ${p.violation}`)
  })
}

if (result3.branches.length > 0) {
  console.log('\n   Forked universes:')
  result3.branches.forEach((branch, i) => {
    const dave = branch.entities.get('user:dave')
    console.log(`     Universe ${i + 1} (${branch.universeId}):`)
    console.log(`       Dave's balance: $${dave?.properties.balance}`)
  })
}

// ═══════════════════════════════════════════════════════════════
// Conclusion
// ═══════════════════════════════════════════════════════════════

console.log('\n' + '═'.repeat(60))
console.log('\n✨ Fortistate vX Demonstration Complete!')
console.log('\nKey Features Demonstrated:')
console.log('  ✅ BEGIN - Seeded new entities into existence')
console.log('  ✅ BECOME - Transformed entities through causal flows')
console.log('  ✅ CEASE - Enforced boundaries with automatic repair')
console.log('  ✅ TRANSCEND - Moved entities between universes')
console.log('  ✅ Reactive Subscriptions - Real-time state notifications')
console.log('  ✅ Paradox Resolution - Universe forking on contradictions')
console.log('  ✅ Explainable Narratives - Human-readable execution stories')
console.log('\n🌱 → 🌊 → 🧱 → 🌀 → ∞')
console.log('\nWelcome to Generative Existence Theory (GET)')
console.log('═'.repeat(60) + '\n')
