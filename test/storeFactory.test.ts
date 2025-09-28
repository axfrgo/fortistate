import { describe, it, expect } from 'vitest'
import { StoreFactory } from '../src/storeFactory'

describe('StoreFactory basics', () => {
  it('creates and retrieves stores and notifies changes', () => {
    const f = new StoreFactory()
    const s = f.create('t1', { value: 1 })
    expect(f.has('t1')).toBe(true)
    expect(s.get()).toBe(1)
    let changed = 0
    f.subscribeChange((k, v) => {
      if (k === 't1') changed = v
    })
    s.set(2)
    expect(changed).toBe(2)
  })
})
