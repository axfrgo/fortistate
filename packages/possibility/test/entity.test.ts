/**
 * Tests for defineEntity primitive
 */

import { describe, it, expect } from 'vitest'
import { defineEntity, getEntityProperties, getPropertyType, areEntitiesCompatible } from '../src/defineEntity'
import { defineConstraint } from '../src/defineConstraint'

describe('defineEntity - Basic Schema Creation', () => {
  it('creates an entity schema with simple properties', () => {
    const UserEntity = defineEntity({
      name: 'User',
      properties: {
        id: { type: 'uuid' },
        name: { type: 'string' },
        age: { type: 'number' }
      }
    })

    expect(UserEntity.name).toBe('User')
    expect(UserEntity.zodSchema).toBeDefined()
    expect(UserEntity.validate).toBeDefined()
  })

  it('validates a correct instance', () => {
    const UserEntity = defineEntity({
      name: 'User',
      properties: {
        id: { type: 'uuid' },
        email: { type: 'email' },
        age: { type: 'number' }
      }
    })

    const result = UserEntity.validate({
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'alice@example.com',
      age: 25
    })

    expect(result.valid).toBe(true)
    expect(result.errors).toBeUndefined()
  })

  it('rejects invalid instance', () => {
    const UserEntity = defineEntity({
      name: 'User',
      properties: {
        email: { type: 'email' },
        age: { type: 'number' }
      }
    })

    const result = UserEntity.validate({
      email: 'not-an-email',
      age: 'not-a-number'
    })

    expect(result.valid).toBe(false)
    expect(result.errors).toBeDefined()
    expect(result.errors!.length).toBeGreaterThan(0)
  })
})

describe('defineEntity - Property Types', () => {
  it('validates string properties', () => {
    const Entity = defineEntity({
      name: 'Test',
      properties: {
        name: { type: 'string' }
      }
    })

    expect(Entity.validate({ name: 'Alice' }).valid).toBe(true)
    expect(Entity.validate({ name: 123 }).valid).toBe(false)
  })

  it('validates string with min/max length', () => {
    const Entity = defineEntity({
      name: 'Test',
      properties: {
        username: { type: 'string', min: 3, max: 20 }
      }
    })

    expect(Entity.validate({ username: 'alice' }).valid).toBe(true)
    expect(Entity.validate({ username: 'ab' }).valid).toBe(false)
    expect(Entity.validate({ username: 'a'.repeat(25) }).valid).toBe(false)
  })

  it('validates string with pattern', () => {
    const Entity = defineEntity({
      name: 'Test',
      properties: {
        username: { type: 'string', pattern: /^[a-z0-9_]+$/ }
      }
    })

    expect(Entity.validate({ username: 'alice_123' }).valid).toBe(true)
    expect(Entity.validate({ username: 'Alice!' }).valid).toBe(false)
  })

  it('validates number properties', () => {
    const Entity = defineEntity({
      name: 'Test',
      properties: {
        age: { type: 'number' }
      }
    })

    expect(Entity.validate({ age: 25 }).valid).toBe(true)
    expect(Entity.validate({ age: '25' }).valid).toBe(false)
  })

  it('validates number with min/max', () => {
    const Entity = defineEntity({
      name: 'Test',
      properties: {
        age: { type: 'number', min: 0, max: 150 }
      }
    })

    expect(Entity.validate({ age: 25 }).valid).toBe(true)
    expect(Entity.validate({ age: -5 }).valid).toBe(false)
    expect(Entity.validate({ age: 200 }).valid).toBe(false)
  })

  it('validates boolean properties', () => {
    const Entity = defineEntity({
      name: 'Test',
      properties: {
        active: { type: 'boolean' }
      }
    })

    expect(Entity.validate({ active: true }).valid).toBe(true)
    expect(Entity.validate({ active: false }).valid).toBe(true)
    expect(Entity.validate({ active: 'true' }).valid).toBe(false)
  })

  it('validates email properties', () => {
    const Entity = defineEntity({
      name: 'Test',
      properties: {
        email: { type: 'email' }
      }
    })

    expect(Entity.validate({ email: 'alice@example.com' }).valid).toBe(true)
    expect(Entity.validate({ email: 'not-an-email' }).valid).toBe(false)
  })

  it('validates uuid properties', () => {
    const Entity = defineEntity({
      name: 'Test',
      properties: {
        id: { type: 'uuid' }
      }
    })

    expect(Entity.validate({ id: '550e8400-e29b-41d4-a716-446655440000' }).valid).toBe(true)
    expect(Entity.validate({ id: 'not-a-uuid' }).valid).toBe(false)
  })

  it('validates enum properties', () => {
    const Entity = defineEntity({
      name: 'Test',
      properties: {
        role: { type: 'enum', values: ['admin', 'user', 'guest'] }
      }
    })

    expect(Entity.validate({ role: 'admin' }).valid).toBe(true)
    expect(Entity.validate({ role: 'user' }).valid).toBe(true)
    expect(Entity.validate({ role: 'invalid' }).valid).toBe(false)
  })

  it('validates date properties', () => {
    const Entity = defineEntity({
      name: 'Test',
      properties: {
        createdAt: { type: 'date' }
      }
    })

    expect(Entity.validate({ createdAt: new Date() }).valid).toBe(true)
    expect(Entity.validate({ createdAt: '2024-01-01' }).valid).toBe(false)
  })
})

describe('defineEntity - Optional Properties', () => {
  it('allows optional properties to be omitted', () => {
    const Entity = defineEntity({
      name: 'Test',
      properties: {
        name: { type: 'string' },
        nickname: { type: 'string', required: false }
      }
    })

    expect(Entity.validate({ name: 'Alice' }).valid).toBe(true)
    expect(Entity.validate({ name: 'Alice', nickname: 'Ally' }).valid).toBe(true)
  })

  it('requires properties by default', () => {
    const Entity = defineEntity({
      name: 'Test',
      properties: {
        name: { type: 'string' }
      }
    })

    expect(Entity.validate({}).valid).toBe(false)
    expect(Entity.validate({ name: 'Alice' }).valid).toBe(true)
  })
})

describe('defineEntity - Default Values', () => {
  it('applies default values in create()', () => {
    const Entity = defineEntity({
      name: 'Test',
      properties: {
        name: { type: 'string' },
        role: { type: 'string', default: 'user' }
      }
    })

    const result = Entity.create({ name: 'Alice' })
    expect(result.valid).toBe(true)
  })
})

describe('defineEntity - Custom Constraints', () => {
  it('validates custom constraints', () => {
    const UserEntity = defineEntity({
      name: 'User',
      properties: {
        age: { type: 'number' }
      },
      constraints: [
        defineConstraint(
          'age-verified',
          (user) => user.age >= 13,
          'User must be 13 or older'
        )
      ]
    })

    expect(UserEntity.validate({ age: 15 }).valid).toBe(true)
    expect(UserEntity.validate({ age: 10 }).valid).toBe(false)
  })

  it('reports constraint violations', () => {
    const UserEntity = defineEntity({
      name: 'User',
      properties: {
        age: { type: 'number' }
      },
      constraints: [
        defineConstraint('age-verified', (user) => user.age >= 13, 'Too young')
      ]
    })

    const result = UserEntity.validate({ age: 10 })
    expect(result.valid).toBe(false)
    expect(result.errors).toBeDefined()
    expect(result.errors!.some(e => e.message === 'Too young')).toBe(true)
  })

  it('applies multiple constraints', () => {
    const UserEntity = defineEntity({
      name: 'User',
      properties: {
        age: { type: 'number' }
      },
      constraints: [
        defineConstraint('min-age', (u) => u.age >= 13, 'Too young'),
        defineConstraint('max-age', (u) => u.age <= 120, 'Too old')
      ]
    })

    expect(UserEntity.validate({ age: 25 }).valid).toBe(true)
    expect(UserEntity.validate({ age: 10 }).valid).toBe(false)
    expect(UserEntity.validate({ age: 150 }).valid).toBe(false)
  })
})

describe('defineEntity - Auto-Repair', () => {
  it('auto-repairs constraint violations when enabled', () => {
    const Entity = defineEntity({
      name: 'Test',
      properties: {
        value: { type: 'number' }
      },
      constraints: [
        defineConstraint(
          'non-negative',
          (obj) => obj.value >= 0,
          'Value must be non-negative',
          {
            repair: (obj) => ({ ...obj, value: Math.abs(obj.value) })
          }
        )
      ]
    }, { autoRepair: true })

    const result = Entity.validate({ value: -10 })
    expect(result.valid).toBe(true)
    expect(result.repaired).toBeDefined()
    expect(result.repaired!.value).toBe(10)
  })

  it('does not auto-repair when disabled', () => {
    const Entity = defineEntity({
      name: 'Test',
      properties: {
        value: { type: 'number' }
      },
      constraints: [
        defineConstraint(
          'non-negative',
          (obj) => obj.value >= 0,
          'Value must be non-negative',
          {
            repair: (obj) => ({ ...obj, value: Math.abs(obj.value) })
          }
        )
      ]
    }, { autoRepair: false })

    const result = Entity.validate({ value: -10 })
    expect(result.valid).toBe(false)
    expect(result.repaired).toBeUndefined()
  })
})

describe('defineEntity - Helper Functions', () => {
  it('gets entity properties', () => {
    const Entity = defineEntity({
      name: 'Test',
      properties: {
        id: { type: 'uuid' },
        name: { type: 'string' },
        age: { type: 'number' }
      }
    })

    const props = getEntityProperties(Entity)
    expect(props).toContain('id')
    expect(props).toContain('name')
    expect(props).toContain('age')
  })

  it('checks entity compatibility', () => {
    const Entity1 = defineEntity({
      name: 'A',
      properties: {
        id: { type: 'uuid' },
        name: { type: 'string' }
      }
    })

    const Entity2 = defineEntity({
      name: 'B',
      properties: {
        id: { type: 'uuid' },
        name: { type: 'string' }
      }
    })

    const Entity3 = defineEntity({
      name: 'C',
      properties: {
        id: { type: 'uuid' }
      }
    })

    expect(areEntitiesCompatible(Entity1, Entity2)).toBe(true)
    expect(areEntitiesCompatible(Entity1, Entity3)).toBe(false)
  })
})

describe('defineEntity - Metadata', () => {
  it('stores entity metadata', () => {
    const Entity = defineEntity({
      name: 'User',
      properties: {
        id: { type: 'uuid' }
      },
      metadata: {
        description: 'A user entity',
        author: 'Test Author',
        tags: ['user', 'identity']
      }
    })

    expect(Entity.metadata.name).toBe('User')
    expect(Entity.metadata.description).toBe('A user entity')
    expect(Entity.metadata.author).toBe('Test Author')
    expect(Entity.metadata.tags).toEqual(['user', 'identity'])
  })
})

describe('defineEntity - matches()', () => {
  it('quickly checks if instance matches schema', () => {
    const Entity = defineEntity({
      name: 'Test',
      properties: {
        name: { type: 'string' },
        age: { type: 'number' }
      }
    })

    expect(Entity.matches({ name: 'Alice', age: 25 })).toBe(true)
    expect(Entity.matches({ name: 'Alice', age: 'not-a-number' })).toBe(false)
  })
})

describe('defineEntity - create()', () => {
  it('creates valid instances', () => {
    const Entity = defineEntity({
      name: 'Test',
      properties: {
        name: { type: 'string' }
      }
    })

    const result = Entity.create({ name: 'Alice' })
    expect(result.valid).toBe(true)
  })

  it('validates created instances', () => {
    const Entity = defineEntity({
      name: 'Test',
      properties: {
        email: { type: 'email' }
      }
    })

    const result = Entity.create({ email: 'not-an-email' })
    expect(result.valid).toBe(false)
  })
})
