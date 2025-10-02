/**
 * Entropy Measurement Demo
 * 
 * Demonstrates:
 * - Shannon entropy calculation
 * - Causal complexity analysis
 * - Anomaly detection
 */

import { StoreFactory } from '../../dist/storeFactory.js'
import { createCausalStore } from '../../dist/temporal/causalStore.js'
import { measureEntropy, detectAnomaly } from '../../dist/algebra/entropy.js'

const factory = new StoreFactory()

console.log('📊 Entropy Measurement Demo\n')

// Example 1: Low entropy (predictable state)
console.log('🔹 Example 1: Low Entropy System (predictable counter)')
const lowEntropyStore = factory.create('low-entropy', { value: 0 })
const lowEntropyCausal = createCausalStore(lowEntropyStore, 'low-entropy')

// Predictable increments
for (let i = 1; i <= 10; i++) {
  lowEntropyCausal.set(i)
}

const lowEntropyMetrics = measureEntropy(lowEntropyCausal.causalGraph)
console.log(`  Shannon entropy: ${lowEntropyMetrics.shannon.toFixed(3)}`)
console.log(`  Causal complexity: ${lowEntropyMetrics.causalComplexity.toFixed(3)}`)
console.log(`  Unique states: ${lowEntropyMetrics.metadata.uniqueStates}`)
console.log(`  Avg branching: ${lowEntropyMetrics.metadata.avgBranchingFactor.toFixed(2)}`)

// Example 2: High entropy (chaotic state)
console.log('\n🔹 Example 2: High Entropy System (random changes)')
const highEntropyStore = factory.create('high-entropy', { value: 0 })
const highEntropyCausal = createCausalStore(highEntropyStore, 'high-entropy')

// Random changes
for (let i = 0; i < 10; i++) {
  highEntropyCausal.set(Math.floor(Math.random() * 100))
}

const highEntropyMetrics = measureEntropy(highEntropyCausal.causalGraph)
console.log(`  Shannon entropy: ${highEntropyMetrics.shannon.toFixed(3)}`)
console.log(`  Causal complexity: ${highEntropyMetrics.causalComplexity.toFixed(3)}`)
console.log(`  Unique states: ${highEntropyMetrics.metadata.uniqueStates}`)
console.log(`  Avg branching: ${highEntropyMetrics.metadata.avgBranchingFactor.toFixed(2)}`)

// Example 3: Branching complexity
console.log('\n🔹 Example 3: Branching Complexity (parallel universes)')
const branchStore = factory.create('branching', { value: { x: 0, y: 0 } })
const branchCausal = createCausalStore(branchStore, 'branching')

branchCausal.set({ x: 1, y: 0 })
branchCausal.set({ x: 2, y: 0 })

// Create multiple branches
const branch1 = branchCausal.branch('path-a')
branchCausal.switchBranch(branch1)
branchCausal.set({ x: 3, y: 5 })
branchCausal.set({ x: 4, y: 10 })

branchCausal.switchBranch('universe-main')
const branch2 = branchCausal.branch('path-b')
branchCausal.switchBranch(branch2)
branchCausal.set({ x: 3, y: -5 })
branchCausal.set({ x: 4, y: -10 })

const branchMetrics = measureEntropy(branchCausal.causalGraph)
console.log(`  Shannon entropy: ${branchMetrics.shannon.toFixed(3)}`)
console.log(`  Causal complexity: ${branchMetrics.causalComplexity.toFixed(3)}`)
console.log(`  Unique states: ${branchMetrics.metadata.uniqueStates}`)
console.log(`  Avg branching: ${branchMetrics.metadata.avgBranchingFactor.toFixed(2)}`)
console.log(`  Branch points: ${branchCausal.getStats().branchPoints}`)

// Example 4: Anomaly detection
console.log('\n🔹 Example 4: Anomaly Detection')
const normalStore = factory.create('normal', { value: 0 })
const normalCausal = createCausalStore(normalStore, 'normal')

// Normal behavior (small increments)
for (let i = 1; i <= 5; i++) {
  normalCausal.set(i)
}

const baselineMetrics = measureEntropy(normalCausal.causalGraph)
console.log(`  Baseline entropy: ${baselineMetrics.shannon.toFixed(3)}`)

// Anomalous behavior (sudden large jump)
for (let i = 0; i < 5; i++) {
  normalCausal.set(Math.floor(Math.random() * 1000))
}

const anomalousMetrics = measureEntropy(normalCausal.causalGraph)
console.log(`  Anomalous entropy: ${anomalousMetrics.shannon.toFixed(3)}`)

const isAnomaly = detectAnomaly(anomalousMetrics, baselineMetrics)
console.log(`  Anomaly detected: ${isAnomaly ? '⚠️  YES' : '✅ NO'}`)

// Show delta
const shannonDelta = anomalousMetrics.shannon - baselineMetrics.shannon
const ratio = baselineMetrics.shannon > 0 
  ? (anomalousMetrics.shannon / baselineMetrics.shannon).toFixed(2)
  : 'N/A'

console.log(`  Shannon delta: +${shannonDelta.toFixed(3)} (${ratio}x baseline)`)

console.log('\n✅ Demo complete!')
console.log('\n💡 Insights:')
console.log('  - Predictable systems have LOW entropy')
console.log('  - Random/chaotic systems have HIGH entropy')
console.log('  - Branching increases causal complexity')
console.log('  - Entropy can detect anomalous behavior')
