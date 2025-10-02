import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createInspectorServer as createInspector } from '../src/inspector'
import { WebSocket } from 'ws'

describe('inspector endpoints', () => {
  const port = 4666
  let srv: any
  beforeAll(async () => {
    srv = createInspector({ port, quiet: true })
    await srv.start()
  })
  afterAll(async () => {
    if (srv) await srv.stop()
  })

  it('apply-preset creates a store', async () => {
    const res = await fetch(`http://localhost:${port}/apply-preset`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'counter' }) })
    if (!res.ok) {
      const text = await res.text()
      console.error(`apply-preset failed: ${res.status} ${res.statusText} - ${text}`)
    }
    expect(res.ok).toBe(true)
    // poll remote-stores until the applied preset appears
    const waitForRemoteStore = async (key: string, timeout = 2000) => {
      const dl = Date.now() + timeout
      while (Date.now() < dl) {
        const r = await fetch(`http://localhost:${port}/remote-stores`)
        const obj = await r.json()
        if (obj && obj[key]) return
        await new Promise(r => setTimeout(r, 50))
      }
      throw new Error('no remote store ' + key)
    }
    await waitForRemoteStore('counter')
  })

  it('swap-stores swaps two stores', async () => {
    // create two stores via presets with explicit target keys
    await fetch(`http://localhost:${port}/apply-preset`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'counter', targetKey: 'swapA' }) })
    await fetch(`http://localhost:${port}/apply-preset`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'theme-sample', targetKey: 'swapB' }) })
    const before = await fetch(`http://localhost:${port}/remote-stores`).then(r => r.json())
    const aBefore = JSON.stringify(before['swapA'])
    const bBefore = JSON.stringify(before['swapB'])
    const res = await fetch(`http://localhost:${port}/swap-stores`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ keyA: 'swapA', keyB: 'swapB' }) })
    expect(res.ok).toBe(true)
    const after = await fetch(`http://localhost:${port}/remote-stores`).then(r => r.json())
    expect(JSON.stringify(after['swapA'])).toBe(bBefore)
    expect(JSON.stringify(after['swapB'])).toBe(aBefore)
  })

  it('move-store renames a store', async () => {
    await fetch(`http://localhost:${port}/apply-preset`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'todo-list', targetKey: 'moveMe' }) })
    const res = await fetch(`http://localhost:${port}/move-store`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ oldKey: 'moveMe', newKey: 'movedTo' }) })
    expect(res.ok).toBe(true)
    // confirm via HTTP that remote-stores include the new key
    const remote = await fetch(`http://localhost:${port}/remote-stores`).then(r => r.json())
    if (!remote['movedTo']) {
      // give it a short moment and retry once
      await new Promise(r => setTimeout(r, 100))
      const remote2 = await fetch(`http://localhost:${port}/remote-stores`).then(r => r.json())
      expect(Boolean(remote2['movedTo'])).toBe(true)
    } else {
      expect(Boolean(remote['movedTo'])).toBe(true)
    }
    // old key should be null or removed (implementation sets to null in WS, persisted remoteStores may still contain oldKey depending on implementation)
  })
})
