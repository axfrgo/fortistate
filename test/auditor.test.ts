/**
 * Tests for the constraint auditor runtime
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { StoreFactory } from '../src/storeFactory.js'
import { createCausalStore } from '../src/temporal/causalStore.js'
import {
  createSubstrate,
  nonNegativeCounter,
} from '../src/algebra/substrate.js'
import { defineLaw } from '../src/cosmogenesis/laws.js'
import { ConstraintAuditor } from '../src/cosmogenesis/auditor.js'

const delay = () => new Promise((resolve) => setTimeout(resolve, 0))

describe('ConstraintAuditor', () => {
  let factory: StoreFactory

  beforeEach(() => {
    factory = new StoreFactory()
  })

  it('auto-repairs violations and emits telemetry', async () => {
    const baseStore = factory.create('counter', { value: { value: 1 } })
    const causalStore = createCausalStore(baseStore, 'counter')

    const law = defineLaw('non-negative', nonNegativeCounter)
    const constraints = new Map([
      ['counter', nonNegativeCounter],
    ])
    const laws = new Map([
      ['counter', [law]],
    ])

    const substrate = createSubstrate('test', constraints, undefined, { laws })

    const telemetry: any[] = []
    const auditor = new ConstraintAuditor({
      substrate,
      stores: new Map([['counter', causalStore]]),
      telemetrySink: (entry) => telemetry.push(entry),
    })

    auditor.start()
    await auditor.scan()

    causalStore.set({ value: -5 })
    await delay()

    expect(causalStore.get()).toEqual({ value: 0 })

    // allow auditor to record telemetry after repair event
    await delay()

    const types = telemetry.map((t) => t.type)
    expect(types).toContain('violation')
    expect(types).toContain('repair')

    auditor.stop()
  })
})
