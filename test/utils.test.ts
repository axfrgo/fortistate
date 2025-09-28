import { describe, it, expect } from 'vitest'
import { atom, derived } from '../dist/utils.js'

describe('utils primitives', () => {
  it('atom and derived work', async () => {
    const a = atom('ux:a', 2)
    const d = derived('ux:double', ['ux:a'], (n: number) => n * 2)
    expect(a.get()).toBe(2)
    expect(d.get()).toBe(4)
    a.set(3)
    expect(d.get()).toBe(6)
  })
})
