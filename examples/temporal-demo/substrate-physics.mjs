/**
 * Substrate Physics Demo
 * 
 * Demonstrates:
 * - Defining existence constraints (laws of nature)
 * - Validating state against constraints
 * - Auto-repairing invalid states
 */

import { StoreFactory } from '../../dist/storeFactory.js'
import { createCausalStore } from '../../dist/temporal/causalStore.js'
import {
  defineConstraint,
  validateState,
  nonNegativeCounter,
  budgetConstraint,
  rangeConstraint,
} from '../../dist/algebra/substrate.js'

console.log('🔒 Substrate Physics Demo\n')

// Example 1: Non-negative counter
console.log('🔹 Example 1: Non-Negative Counter Constraint')
const factory = new StoreFactory()
const counterStore = factory.create('counter', { value: { value: 0 } })
const counter = createCausalStore(counterStore, 'counter')

console.log('  Setting counter to 5...')
counter.set({ value: 5 })
const valid5 = validateState(counter.get(), nonNegativeCounter)
console.log(`  Valid: ${valid5.valid ? '✅' : '❌'}`)

console.log('  Setting counter to -3...')
counter.set({ value: -3 })
const invalidNeg = validateState(counter.get(), nonNegativeCounter)
console.log(`  Valid: ${invalidNeg.valid ? '✅' : '❌'}`)
if (!invalidNeg.valid) {
  console.log(`  Violations: ${invalidNeg.violations[0].message}`)
  console.log(`  Repaired value: ${JSON.stringify(invalidNeg.repairedValue)}`)
}

// Example 2: Budget constraint
console.log('\n🔹 Example 2: Budget Constraint (expenses <= income)')
const budgetStore = factory.create('budget', { 
  value: { income: 5000, expenses: 3000, savings: 2000 }
})
const budget = createCausalStore(budgetStore, 'budget')

console.log('  Valid budget:')
console.log(`    Income: $${budget.get().income}`)
console.log(`    Expenses: $${budget.get().expenses}`)
console.log(`    Savings: $${budget.get().savings}`)

const validBudget = validateState(budget.get(), budgetConstraint)
console.log(`  Valid: ${validBudget.valid ? '✅' : '❌'}`)

console.log('\n  Invalid budget (expenses > income):')
budget.set({ income: 3000, expenses: 5000, savings: -2000 })
console.log(`    Income: $${budget.get().income}`)
console.log(`    Expenses: $${budget.get().expenses}`)
console.log(`    Savings: $${budget.get().savings}`)

const invalidBudget = validateState(budget.get(), budgetConstraint)
console.log(`  Valid: ${invalidBudget.valid ? '✅' : '❌'}`)
if (!invalidBudget.valid) {
  invalidBudget.violations.forEach(v => {
    console.log(`    ❌ ${v.message}`)
  })
}

console.log('\n  Auto-repairing savings...')
const repaired = invalidBudget.repairedValue
if (repaired) {
  console.log(`    Repaired savings: $${repaired.savings}`)
  console.log(`    (${repaired.income} - ${repaired.expenses} = ${repaired.savings})`)
}

// Example 3: Temperature constraint
console.log('\n🔹 Example 3: Temperature Range Constraint')
const tempConstraint = rangeConstraint('temperature', -50, 50, ['temp'])

const tempStore = factory.create('sensor', { 
  value: { temp: 25, humidity: 60 }
})
const sensor = createCausalStore(tempStore, 'sensor')

console.log('  Normal temperature:')
console.log(`    Temp: ${sensor.get().temp}°C`)
const validTemp = validateState(sensor.get(), tempConstraint)
console.log(`  Valid: ${validTemp.valid ? '✅' : '❌'}`)

console.log('\n  Extreme temperature (out of range):')
sensor.set({ temp: 150, humidity: 60 })
console.log(`    Temp: ${sensor.get().temp}°C`)
const invalidTemp = validateState(sensor.get(), tempConstraint)
console.log(`  Valid: ${invalidTemp.valid ? '✅' : '❌'}`)

if (invalidTemp.repairedValue) {
  console.log(`  Repaired (clamped): ${invalidTemp.repairedValue.temp}°C`)
}

// Example 4: Custom game physics constraint
console.log('\n🔹 Example 4: Custom Game Physics (no flying)')
const noFlyingConstraint = defineConstraint(
  'no-flying',
  [
    {
      name: 'player-on-ground',
      check: (state) => state.player.y <= 0,
      message: 'Player must be on the ground (y <= 0)',
    },
    {
      name: 'player-in-bounds',
      check: (state) => state.player.x >= 0 && state.player.x <= 100,
      message: 'Player must be within bounds (0 <= x <= 100)',
    },
  ],
  {
    repair: (state) => {
      return {
        ...state,
        player: {
          x: Math.max(0, Math.min(100, state.player.x)),
          y: Math.min(0, state.player.y),  // Clamp to ground
        },
      }
    },
  }
)

const gameStore = factory.create('game', { 
  value: { player: { x: 50, y: 0 } }
})
const game = createCausalStore(gameStore, 'game')

console.log('  Player on ground:')
console.log(`    Position: (${game.get().player.x}, ${game.get().player.y})`)
const validPos = validateState(game.get(), noFlyingConstraint)
console.log(`  Valid: ${validPos.valid ? '✅' : '❌'}`)

console.log('\n  Player flying (invalid):')
game.set({ player: { x: 50, y: 10 } })
console.log(`    Position: (${game.get().player.x}, ${game.get().player.y})`)
const flyingPos = validateState(game.get(), noFlyingConstraint)
console.log(`  Valid: ${flyingPos.valid ? '✅' : '❌'}`)

if (flyingPos.repairedValue) {
  const repaired = flyingPos.repairedValue.player
  console.log(`  Auto-repaired: (${repaired.x}, ${repaired.y}) - pulled to ground!`)
}

console.log('\n✅ Demo complete!')
console.log('\n💡 Key concepts:')
console.log('  - Constraints define the "laws" of your universe')
console.log('  - Invalid states can be auto-repaired')
console.log('  - Use constraints for: validation, physics, business rules')
console.log('  - Next: Combine constraints into Substrates (full universes)')
