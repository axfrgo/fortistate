import { describe, it, expect } from 'vitest'
import createInspector from '../dist/inspector.js'
import { WebSocket } from 'ws'
import { createStore } from '../dist/storeFactory.js'

describe('inspector server', () => {
  it('serves client and broadcasts events', async () => {
  const srv = createInspector({ port: 4555, quiet: true })
    await srv.start()
    // create a store before connecting so the snapshot includes it
    createStore('inspector:test', { value: { a: 1 } })
    const ws = new WebSocket('ws://localhost:4555')
    const msgs: any[] = []

    // attach message handler immediately to avoid missed messages
    ws.on('message', (m) => {
      try { const parsed = JSON.parse(m.toString()); msgs.push(parsed); } catch (e) { msgs.push(m.toString()); }
    })

    await new Promise<void>((resolve, reject) => {
      ws.on('open', () => {
        // request snapshot explicitly
        try { ws.send('req:snapshot') } catch (e) { /* ignore */ }
        resolve()
      })
      ws.on('error', reject)
    })

    // wait for a snapshot message by polling msgs (attached earlier)
    await new Promise<void>((resolve, reject) => {
      const deadline = Date.now() + 5000
      const iv = setInterval(() => {
        if (msgs.some(m => m && m.type === 'snapshot' && m.stores && m.stores['inspector:test'])) {
          clearInterval(iv)
          resolve()
          return
        }
        if (Date.now() > deadline) {
          clearInterval(iv)
              // (silent in CI)
          reject(new Error('no snapshot'))
        }
      }, 50)
      ws.on('error', (e) => { clearInterval(iv); reject(e) })
    })

  // (silent in CI)

    // close client first so server.close doesn't hang waiting for active sockets
    await new Promise<void>((resolve) => {
      if (ws.readyState === ws.CLOSED) return resolve()
      ws.on('close', () => resolve())
      try { ws.close() } catch (e) { resolve() }
      // safety timeout
      setTimeout(() => resolve(), 2000)
    })
    await srv.stop()
    expect(msgs.some(m => m && m.type === 'snapshot' && m.stores && m.stores['inspector:test'])).toBe(true)
  }, 10000)
})
