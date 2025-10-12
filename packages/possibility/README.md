# @fortistate/possibility

> Possibility Algebra for Fortistate v3.0 - Define what CAN exist before instantiation

[![Tests](https://img.shields.io/badge/tests-104%2F104%20passing-brightgreen)](./test)
[![Version](https://img.shields.io/badge/version-3.0.0--alpha.0-blue)]()

## 📖 Overview

The **Possibility Algebra** is the foundation of Fortistate v3.0's type system. It provides primitives for defining entity schemas, constraints, validation rules, **state transition laws**, and **quantum substrate features** (superposition, entanglement, observers) - essentially creating "Platonic forms" that describe what CAN exist and how states CAN change before actual instances are created.

Think of it as a meta-layer above your state: instead of just storing data, you first define the **possibility space** of what that data can be.

## 🚀 Quick Start

```bash
npm install @fortistate/possibility
# or
pnpm add @fortistate/possibility
```

### Basic Example

```typescript
import { defineEntity, defineConstraint } from '@fortistate/possibility'

// Define what a User CAN be
const UserEntity = defineEntity({
  name: 'User',
  properties: {
    id: { type: 'uuid' },
    email: { type: 'email', unique: true },
    age: { type: 'number', min: 0, max: 150 },
    role: { type: 'enum', values: ['admin', 'user', 'guest'] }
  },
  constraints: [
    defineConstraint(
      'age-verified',
      (user) => user.age >= 13,
      'User must be 13 or older'
    )
  ]
})

// Validate an instance
const result = UserEntity.validate({
  id: '550e8400-e29b-41d4-a716-446655440000',
  email: 'alice@example.com',
  age: 25,
  role: 'admin'
})

console.log(result.valid) // true
```

## 🧩 Core Concepts

### Entity Definitions

An **Entity** is a template that describes the structure and rules for a type of data:

```typescript
const ProductEntity = defineEntity({
  name: 'Product',
  properties: {
    id: { type: 'uuid' },
    name: { type: 'string', min: 1, max: 100 },
    price: { type: 'number', min: 0 },
    sku: { type: 'string', pattern: /^[A-Z]{3}-\d{6}$/ },
    category: { type: 'enum', values: ['electronics', 'clothing', 'food'] },
    inStock: { type: 'boolean', default: true }
  },
  metadata: {
    description: 'E-commerce product',
    version: '1.0.0',
    tags: ['commerce', 'inventory']
  }
})
```

### Constraints

**Constraints** are custom validation rules beyond basic type checking:

```typescript
import { defineConstraint, nonNegativeConstraint, rangeConstraint } from '@fortistate/possibility'

// Custom constraint
const minimumPurchase = defineConstraint(
  'minimum-purchase',
  (cart) => cart.total >= 10,
  'Cart total must be at least $10',
  {
    severity: 'medium',
    category: 'business-rule'
  }
)

// Built-in constraint helpers
const ageRange = rangeConstraint('age', 18, 65)
const balance = nonNegativeConstraint('balance')
```

### Validation

Entities provide rich validation with detailed error reporting:

```typescript
const result = UserEntity.validate({
  email: 'not-an-email',
  age: 10
})

if (!result.valid) {
  console.log(result.errors)
  // [
  //   { message: 'Invalid email', type: 'schema', path: ['email'] },
  //   { message: 'User must be 13 or older', type: 'constraint' }
  // ]
}
```

## 📚 API Reference

### defineEntity(definition, options?)

Creates an entity schema from a definition.

**Parameters:**
- `definition: EntityDefinition` - The entity structure
  - `name: string` - Unique entity name
  - `properties: Record<string, PropertyDefinition>` - Property definitions
  - `constraints?: ConstraintDefinition[]` - Custom constraints
  - `metadata?: PossibilityMetadata` - Optional metadata
- `options?: DefineEntityOptions`
  - `autoRepair?: boolean` - Auto-fix violations when possible
  - `trackUniqueness?: boolean` - Track unique values globally

**Returns:** `EntitySchema<T>`

### Property Types

Supported property types:

| Type | Description | Options |
|------|-------------|---------|
| `string` | Text values | `min`, `max`, `pattern` |
| `number` | Numeric values | `min`, `max` |
| `boolean` | True/false | - |
| `email` | Email addresses | - |
| `uuid` | UUID strings | - |
| `enum` | Fixed set of values | `values` |
| `date` | Date objects | - |

### defineConstraint(name, check, message?, options?)

Creates a custom constraint.

**Parameters:**
- `name: string` - Unique constraint identifier
- `check: (instance: any) => boolean` - Validation function
- `message?: string` - Error message
- `options?`
  - `repair?: (instance: any) => any` - Auto-repair function
  - `severity?: 'low' | 'medium' | 'high' | 'critical'`
  - `category?: string` - Grouping category

**Returns:** `ConstraintDefinition`

### Built-in Constraint Helpers

```typescript
// Range validation with auto-repair
const ageRange = rangeConstraint('age', 0, 150)

// Property equality check
const passwordMatch = equalityConstraint('password', 'confirmPassword')

// Regex pattern validation
const phonePattern = patternConstraint('phone', /^\d{3}-\d{3}-\d{4}$/)

// Non-negative with auto-repair
const balance = nonNegativeConstraint('balance')

// Custom logic
const custom = customConstraint(
  'complex-rule',
  (obj) => obj.x + obj.y > 10,
  { message: 'Sum must exceed 10', severity: 'low' }
)
```

## 🎯 Use Cases

### 1. Type-Safe State Management

```typescript
const AppStateEntity = defineEntity({
  name: 'AppState',
  properties: {
    userId: { type: 'uuid' },
    theme: { type: 'enum', values: ['light', 'dark'] },
    notifications: { type: 'number', min: 0, default: 0 }
  }
})

// Before updating state
const result = AppStateEntity.validate(newState)
if (!result.valid) {
  console.error('Invalid state update:', result.errors)
}
```

### 2. API Validation

```typescript
const CreateUserRequest = defineEntity({
  name: 'CreateUserRequest',
  properties: {
    email: { type: 'email' },
    password: { type: 'string', min: 8 },
    age: { type: 'number', min: 13 }
  },
  constraints: [
    defineConstraint(
      'password-strength',
      (req) => /[A-Z]/.test(req.password) && /\d/.test(req.password),
      'Password must contain uppercase and number'
    )
  ]
})
```

### 3. Auto-Repair Invalid Data

```typescript
const CartEntity = defineEntity({
  name: 'Cart',
  properties: {
    items: { type: 'number', min: 0 },
    total: { type: 'number' }
  },
  constraints: [
    defineConstraint(
      'non-negative-total',
      (cart) => cart.total >= 0,
      'Total cannot be negative',
      {
        repair: (cart) => ({ ...cart, total: Math.max(0, cart.total) })
      }
    )
  ]
}, { autoRepair: true })

const result = CartEntity.validate({ items: 3, total: -10 })
console.log(result.valid) // true
console.log(result.repaired.total) // 0
```

## 🔬 Advanced Patterns

### Compositional Constraints

```typescript
const constraints = [
  rangeConstraint('age', 18, 65),
  patternConstraint('email', /@company\.com$/),
  customConstraint('department-match', 
    (emp) => emp.department === 'Engineering' && emp.level >= 3,
    { message: 'Senior engineers only' }
  )
]

const EmployeeEntity = defineEntity({
  name: 'Employee',
  properties: { /* ... */ },
  constraints
})
```

### Schema Compatibility

```typescript
import { areEntitiesCompatible } from '@fortistate/possibility'

const UserV1 = defineEntity({ /* ... */ })
const UserV2 = defineEntity({ /* ... */ })

if (areEntitiesCompatible(UserV1, UserV2)) {
  console.log('Schemas are compatible - safe to migrate')
}
```

### Property Introspection

```typescript
import { getEntityProperties, getPropertyType } from '@fortistate/possibility'

const props = getEntityProperties(UserEntity)
// ['id', 'email', 'age', 'role']

const emailType = getPropertyType(UserEntity, 'email')
// 'string'
```

## 🧪 Testing

```bash
# Run tests
npm test

# With coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

**Test Results:** 67/67 passing ✅

## 🎯 Core Primitives

### `defineLaw` - State Transition Rules

Laws define **how state can change**. They're declarative rules with inputs, outputs, and validation logic.

#### Basic Law

```typescript
import { defineLaw } from '@fortistate/possibility'

// Define a simple transformation law
const doubleValue = defineLaw({
  name: 'double-value',
  inputs: ['value'],
  output: 'result',
  enforce: (value: number) => value * 2
})

const result = doubleValue.execute(5)
// { success: true, value: 10 }
```

#### Laws with Preconditions

```typescript
const divideValues = defineLaw({
  name: 'safe-divide',
  inputs: ['numerator', 'denominator'],
  output: 'quotient',
  precondition: (n: number, d: number) => d !== 0,
  enforce: (n: number, d: number) => n / d
})

divideValues.execute(10, 2)  // ✅ { success: true, value: 5 }
divideValues.execute(10, 0)  // ❌ { success: false, preconditionMet: false }
```

#### Laws with Postconditions

```typescript
const ensurePositive = defineLaw({
  name: 'ensure-positive',
  inputs: ['value'],
  output: 'result',
  enforce: (value: number) => value * 2,
  postcondition: (result: number) => result > 0
})

ensurePositive.execute(5)   // ✅ { success: true, value: 10 }
ensurePositive.execute(-5)  // ❌ { success: false, postconditionMet: false }
```

#### Real-World Example: Shopping Cart

```typescript
const calculateTotal = defineLaw({
  name: 'calculate-total',
  inputs: ['cart', 'prices'],
  output: 'cart',
  enforce: (cart: any, prices: any) => ({
    ...cart,
    total: cart.items.reduce((sum: number, item: any) => 
      sum + (prices[item.id] || 0) * item.qty, 0
    )
  }),
  complexity: 'O(n)' // Optional performance annotation
})

const cart = {
  items: [
    { id: 'apple', qty: 3 },
    { id: 'banana', qty: 2 }
  ]
}

const result = calculateTotal.execute(cart, { apple: 1.5, banana: 0.75 })
// { success: true, value: { items: [...], total: 6 } }
```

### Law Composition

Combine multiple laws into sequential pipelines:

```typescript
import { composeLaws, executeComposition } from '@fortistate/possibility'

const double = defineLaw({
  name: 'double',
  inputs: ['value'],
  output: 'doubled',
  enforce: (value: number) => value * 2
})

const addTen = defineLaw({
  name: 'add-ten',
  inputs: ['doubled'],
  output: 'result',
  enforce: (doubled: number) => doubled + 10
})

const pipeline = composeLaws('process-value', [double, addTen])
const result = executeComposition(pipeline, { value: 5 })
// { success: true, value: { result: 20 } }  // (5 * 2) + 10
```

### Conflict Detection

Automatically detect when laws conflict:

```typescript
import { detectConflicts } from '@fortistate/possibility'

const setA = defineLaw({
  name: 'set-a',
  inputs: [],
  output: 'value',
  enforce: () => 'A'
})

const setB = defineLaw({
  name: 'set-b',
  inputs: [],
  output: 'value',  // Same output!
  enforce: () => 'B'
})

const conflicts = detectConflicts([setA, setB])
// [{ laws: ['set-a', 'set-b'], reason: 'Both write to output: value', severity: 'high' }]
```

### Law Helper Functions

Convenience functions for common patterns:

```typescript
import { constantLaw, transformLaw, conditionalLaw } from '@fortistate/possibility'

// Constant values
const pi = constantLaw('pi', 'PI', 3.14159)

// Simple transformations
const square = transformLaw('square', 'x', 'result', (x: number) => x * x)

// Conditional logic
const doubleIfPositive = conditionalLaw(
  'double-if-positive',
  ['value'],
  'result',
  (value: number) => value > 0,
  (value: number) => value * 2
)
```

## 🧪 Testing

```bash
# Run tests
npm test

# With coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

**Test Results:** 104/104 passing ✅

## 🌌 Quantum Substrate (Week 3-4)

Fortistate v3.0 includes quantum mechanics-inspired features for modeling uncertainty, entanglement, and probabilistic states.

### `defineSuperposition` - Multiple Simultaneous States

Superposition allows properties to exist in multiple states at once until observed:

```typescript
import { defineSuperposition, uniformSuperposition } from '@fortistate/possibility'

// Quantum state that collapses on observation
const electronSpin = defineSuperposition({
  name: 'electron-spin',
  initialStates: [
    { value: 'up', amplitude: 0.7 },    // 70% probability
    { value: 'down', amplitude: 0.3 }   // 30% probability
  ]
})

console.log(electronSpin.isCollapsed())  // false

const spin = electronSpin.observe()      // Collapses to 'up' or 'down'
console.log(electronSpin.isCollapsed())  // true
```

#### Helper Functions

```typescript
// Binary 50/50 superposition
const coin = binarySuperposition('coin-flip', 'heads', 'tails')

// Weighted superposition
const weather = weightedSuperposition('weather', [
  { value: 'sunny', weight: 70 },
  { value: 'rainy', weight: 30 }
])

// Uniform distribution
const dice = uniformSuperposition('dice', [1, 2, 3, 4, 5, 6])
```

#### Decoherence

Superpositions can auto-collapse after a time limit:

```typescript
const unstableState = defineSuperposition({
  name: 'unstable',
  initialStates: [
    { value: 'stable', amplitude: 0.6 },
    { value: 'decayed', amplitude: 0.4 }
  ],
  decoherenceTime: 5000,  // Auto-collapse after 5 seconds
  allowResuperposition: true
})
```

### `defineEntanglement` - Linked Properties

Entanglement creates quantum correlations between properties:

```typescript
import { defineEntanglement, oppositeEntanglement } from '@fortistate/possibility'

// Opposite correlation (spin pair)
const spinPair = oppositeEntanglement(
  'particle-spin',
  { entity: 'particle-1', property: 'spin' },
  { entity: 'particle-2', property: 'spin' }
)

// When particle 1 is 'up', particle 2 is instantly 'down'
const particle2Spin = spinPair.applyCorrelation('up')
console.log(particle2Spin)  // → 'down'
```

#### Correlation Types

```typescript
// Identical: both properties have same value
const identical = identicalEntanglement(...)

// Opposite: values are negated
const opposite = oppositeEntanglement(...)

// Complementary: sum to 1
const complementary = defineEntanglement({
  correlation: 'complementary',
  ...
})

// Custom: user-defined correlation
const custom = customEntanglement(
  'custom',
  propA,
  propB,
  (valueA) => valueA * 2  // B is always 2× A
)
```

#### Persistence

```typescript
// Non-persistent: breaks after first measurement
const ephemeral = defineEntanglement({
  name: 'ephemeral',
  propertyA: {...},
  propertyB: {...},
  correlation: 'opposite',
  persistent: false
})
```

### `defineObserver` - Measurement Strategies

Observers define how quantum states collapse:

```typescript
import { defineObserver, deterministicObserver } from '@fortistate/possibility'

// Standard Born rule observer
const physicist = standardObserver('physicist')

// Deterministic observer (always picks max amplitude)
const determinist = deterministicObserver('determinist')

// Restricted observer (can only observe certain properties)
const limited = restrictedObserver('limited', ['spin', 'position'])

// Measure a superposition
const spin = electronSpin.observe()
const result = physicist.observe(electronSpin)
```

### Real-World Quantum Examples

#### Schrödinger's Form State

Form that is simultaneously valid/invalid until validation:

```typescript
const formState = defineSuperposition({
  name: 'form-validation',
  initialStates: [
    { value: 'valid', amplitude: 0.6 },
    { value: 'invalid', amplitude: 0.4 }
  ]
})

// Form exists in superposition...
expect(formState.isCollapsed()).toBe(false)

// User submits - collapses to definite state
const validator = standardObserver('validator')
const result = validator.observe(formState)  // 'valid' or 'invalid'
```

#### Entangled User Sessions

Two users with opposite online status:

```typescript
const sessionPair = oppositeEntanglement(
  'session-link',
  { entity: 'user-1', property: 'isOnline' },
  { entity: 'user-2', property: 'isOnline' }
)

// User 1 comes online → User 2 instantly goes offline
const user2Status = sessionPair.applyCorrelation(true)  // false
```

#### Quantum Recommendation Engine

Product exists in multiple categories until user interaction:

```typescript
const productCategory = uniformSuperposition(
  'product-category',
  ['electronics', 'books', 'clothing', 'home']
)

// User clicks - collapses to specific category
const category = productCategory.observe()
```

## 🧪 Testing

```bash
# Run tests
npm test

# With coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

**Test Results:** 104/104 passing ✅
- 27 entity tests
- 18 constraint tests
- 22 law tests
- 37 quantum tests

## 🗺️ Roadmap

The Possibility Algebra is **Weeks 1-4** of the Fortistate v3.0 12-month roadmap:

- ✅ **Week 1**: Core entity/constraint primitives  
- ✅ **Week 2**: `defineLaw` primitive for state transitions
- ✅ **Week 3-4**: Quantum substrate (superposition, entanglement, observers)
- 📅 **Week 5-6**: Relativistic substrate (observer frames)
- 📅 **Week 7-8**: Meta-laws engine

See [V3_VISUAL_ROADMAP.md](../../V3_VISUAL_ROADMAP.md) for complete timeline.

## 🤝 Contributing

This is part of Fortistate v3.0's transformation into a visual universe studio. See [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

## 📄 License

ISC © Fortistate Core Team

## 🔗 Links

- [Main Repository](https://github.com/axfrgo/fortistate)
- [v2.0 Documentation](../../docs/)
- [v3.0 Technical Spec](../../V3_TECHNICAL_SPEC.md)
- [v3.0 AI Agent Guide](../../V3_AI_AGENT_GUIDE.md)

---

**Built with ❤️ as part of Fortistate v3.0 - The Visual Universe Studio**
