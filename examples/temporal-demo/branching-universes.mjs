/**
 * Branching Universes Demo
 * 
 * Demonstrates:
 * - Creating parallel universe branches
 * - Switching between branches
 * - Comparing outcomes
 * - Merging branches
 */

import { StoreFactory } from '../../dist/storeFactory.js'
import { createCausalStore } from '../../dist/temporal/causalStore.js'

const factory = new StoreFactory()
const baseStore = factory.create('game', { value: { score: 0, level: 1 } })

const gameState = createCausalStore(baseStore, 'game', {
  initialUniverse: 'universe-main',
  observerId: 'player-1'
})

console.log('🌿 Branching Universes Demo\n')

// Main universe: normal progression
console.log('📍 Main universe:')
gameState.set({ score: 10, level: 1 })
console.log(`  Score: ${gameState.get().score}, Level: ${gameState.get().level}`)

gameState.set({ score: 25, level: 2 })
console.log(`  Score: ${gameState.get().score}, Level: ${gameState.get().level}`)

// Create experimental branch
console.log('\n🔀 Creating experimental branch...')
const experimentId = gameState.branch('experiment-powerup')
console.log(`  Branch ID: ${experimentId}`)

// Switch to experiment and try different strategy
gameState.switchBranch(experimentId)
console.log('\n📍 Experimental universe:')
gameState.set({ score: 100, level: 2 })  // Imaginary power-up!
console.log(`  Score (with power-up): ${gameState.get().score}, Level: ${gameState.get().level}`)

gameState.set({ score: 150, level: 3 })
console.log(`  Score (with power-up): ${gameState.get().score}, Level: ${gameState.get().level}`)

// Switch back to main
console.log('\n🔙 Switching back to main universe:')
gameState.switchBranch('universe-main')
console.log(`  Score: ${gameState.get().score}, Level: ${gameState.get().level}`)

// List all branches
console.log('\n📋 All branches:')
const branches = gameState.listBranches()
branches.forEach(branch => {
  console.log(`  - ${branch.name} (${branch.id})`)
  console.log(`    Created: ${new Date(branch.createdAt).toISOString()}`)
  console.log(`    Last event: ${new Date(branch.lastEventTimestamp).toISOString()}`)
})

// Compare outcomes
console.log('\n🔍 Comparison:')
const mainHistory = gameState.query({ universeIds: ['universe-main'] })
const expHistory = gameState.query({ universeIds: [experimentId] })

console.log(`  Main universe: ${mainHistory.length} events`)
console.log(`    Final score: ${mainHistory[mainHistory.length - 1]?.value.score}`)

console.log(`  Experimental universe: ${expHistory.length} events`)
console.log(`    Final score: ${expHistory[expHistory.length - 1]?.value.score}`)

// Try merging (experiment has better score)
console.log('\n🔄 Merging experimental branch into main (strategy: theirs)...')
const mergeResult = gameState.merge(experimentId, 'theirs')

if (mergeResult.success) {
  console.log('  ✅ Merge successful!')
  console.log(`  New score: ${gameState.get().score}`)
} else {
  console.log('  ❌ Merge had conflicts:')
  mergeResult.conflicts.forEach(conflict => {
    console.log(`    Ours: ${JSON.stringify(conflict.ours)}`)
    console.log(`    Theirs: ${JSON.stringify(conflict.theirs)}`)
  })
}

console.log('\n✅ Demo complete!')
