/**
 * Time Travel Counter Demo
 * 
 * Demonstrates basic temporal capabilities:
 * - Automatic event recording
 * - Time travel queries
 * - History replay
 */

import { StoreFactory } from '../../dist/storeFactory.js'
import { createCausalStore } from '../../dist/temporal/causalStore.js'

// Create base store
const factory = new StoreFactory()
const baseStore = factory.create('counter', { value: { count: 0 } })

// Wrap in causal store
const counter = createCausalStore(baseStore, 'counter', {
  initialUniverse: 'universe-main',
  observerId: 'demo-user'
})

console.log('🕐 Time Travel Counter Demo\n')

// Make some changes
console.log('Making changes...')
const timestamps = []

counter.set({ count: 1 })
console.log(`  [${new Date().toISOString()}] Set to 1`)
await sleep(100)
timestamps.push(Date.now())

counter.set({ count: 5 })
console.log(`  [${new Date().toISOString()}] Set to 5`)
await sleep(100)
timestamps.push(Date.now())

counter.set({ count: 10 })
console.log(`  [${new Date().toISOString()}] Set to 10`)
await sleep(100)
timestamps.push(Date.now())

counter.set({ count: 3 })
console.log(`  [${new Date().toISOString()}] Set to 3`)
timestamps.push(Date.now())

console.log(`\n📜 Full history (${counter.history.length} events):`)
counter.history.forEach((event, i) => {
  console.log(`  ${i}. [${event.type}] count=${event.value.count} (${event.id.slice(0, 8)}...)`)
})

console.log('\n⏪ Time travel queries:')
console.log(`  Current state: ${counter.get().count}`)
console.log(`  State at timestamp[0]: ${counter.at(timestamps[0])?.count}`)
console.log(`  State at timestamp[1]: ${counter.at(timestamps[1])?.count}`)
console.log(`  State at timestamp[2]: ${counter.at(timestamps[2])?.count}`)

console.log('\n📊 Statistics:')
const stats = counter.getStats()
console.log(`  Total events: ${stats.totalEvents}`)
console.log(`  Universes: ${stats.universeCount}`)
console.log(`  Max depth: ${stats.maxDepth}`)

console.log('\n💾 Export history:')
const exported = counter.exportHistory()
console.log(`  Exported ${exported.length} bytes`)
console.log(`  First 200 chars: ${exported.slice(0, 200)}...`)

console.log('\n✅ Demo complete!')

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
