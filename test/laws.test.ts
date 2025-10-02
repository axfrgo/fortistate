/**
 * Tests for cosmogenesis law helpers
 */

import { describe, it, expect, vi } from 'vitest'
import {
  defineLaw,
  executeLaw,
  LawRegistry,
  type LawContext,
} from '../src/cosmogenesis/laws.js'
import {
  nonNegativeCounter,
  defineConstraint,
} from '../src/algebra/substrate.js'

const makeContext = (overrides: Partial<LawContext> = {}): LawContext => ({
  universeId: 'universe-main',
  timestamp: Date.now(),
  getState: vi.fn(),
  setState: vi.fn(),
  ...overrides,
})

describe('executeLaw', () => {
  it('should report violations and attempt repairs', async () => {
    const onViolation = vi.fn()
    const onRepair = vi.fn()
    const law = defineLaw('non-negative', nonNegativeCounter, {
      onViolation,
      onRepair,
    })

    const result = await executeLaw(law, {
      state: { value: -5 },
      storeKey: 'counter',
      attemptRepair: true,
    })

    expect(result.evaluation.valid).toBe(false)
    expect(result.valid).toBe(true)
    expect(result.repairedValue).toEqual({ value: 0 })
    expect(onViolation).toHaveBeenCalled()
    expect(onRepair).toHaveBeenCalled()
  })

  it('should not repair when constraint lacks repair handler', async () => {
    const immutableConstraint = defineConstraint<{ value: number }>(
      'immutable-positive',
      [
        {
          name: 'positive-only',
          check: (state) => state.value > 0,
        },
      ]
    )

    const law = defineLaw('immutable-law', immutableConstraint)

    const result = await executeLaw(law, {
      state: { value: -1 },
      storeKey: 'immutable',
      attemptRepair: true,
    })

    expect(result.valid).toBe(false)
    expect(result.repairedValue).toBeUndefined()
  })

  it('should execute reactions and apply context updates', async () => {
    const reaction = vi.fn().mockImplementation((state: { value: number }) => ({
      total: state.value * 2,
    }))

    const law = defineLaw('reaction-law', nonNegativeCounter, {
      reactions: {
        shadow: reaction,
      },
    })

    const setState = vi.fn()
    const context = makeContext({ setState })

    const result = await executeLaw(law, {
      state: { value: 5 },
      storeKey: 'counter',
      context,
      attemptRepair: false,
    })

    expect(reaction).toHaveBeenCalledTimes(1)
    expect(result.reactionEffects).toHaveLength(1)
    expect(result.reactionEffects[0]).toEqual({
      lawName: 'reaction-law',
      targetStore: 'shadow',
      nextState: { total: 10 },
    })

    expect(setState).toHaveBeenCalledWith(
      'shadow',
      { total: 10 },
      {
        source: 'law-reaction',
        tags: ['reaction-law'],
      }
    )
  })

  it('should respect applyReactions flag', async () => {
    const reaction = vi.fn().mockReturnValue({ count: 1 })
    const setState = vi.fn()
    const context = makeContext({ setState })

    const law = defineLaw('no-apply', nonNegativeCounter, {
      reactions: { other: reaction },
    })

    const result = await executeLaw(law, {
      state: { value: 1 },
      storeKey: 'counter',
      context,
      applyReactions: false,
    })

    expect(result.reactionEffects).toHaveLength(1)
    expect(setState).not.toHaveBeenCalled()
  })
})

describe('LawRegistry', () => {
  it('tracks laws per store and avoids duplicates', () => {
    const registry = new LawRegistry()
    const law = defineLaw('non-negative', nonNegativeCounter)

    registry.register('counter', law)
    registry.register('counter', law)

    expect(registry.get('counter')).toHaveLength(1)
    expect(registry.entries()).toEqual([
      ['counter', [law]],
    ])
  })
})
