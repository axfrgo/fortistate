"use client";
import { useStore } from "fortistate";
import { useState, useEffect } from "react";

export default function Home() {
  // @ts-expect-error dynamic store proxy - runtime provides `counter`
  const [count, counter] = useStore.counter();
  const [snapshot, setSnapshot] = useState<string | null>(null)

  function openInspector() {
    // open the HTTP inspector UI (default port 4555)
    window.open('http://localhost:4555', '_blank')
  }

  // register the counter store with the inspector so snapshots include it
  async function registerCounter() {
    try {
      const headers: Record<string,string> = { 'Content-Type': 'application/json' }
  // support optional token injected into window for local testing
  const w = typeof window !== 'undefined' ? (window as unknown as { __FORTISTATE_INSPECTOR_TOKEN?: string }) : undefined
  if (w && w.__FORTISTATE_INSPECTOR_TOKEN) headers['x-fortistate-token'] = w.__FORTISTATE_INSPECTOR_TOKEN
      await fetch('http://localhost:4555/register', {
        method: 'POST',
        headers,
        body: JSON.stringify({ key: 'counter', initial: { value: count } })
      })
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    // auto-register on first load (best-effort)
    try {
      registerCounter()
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function requestSnapshot() {
    try {
      const ws = new WebSocket('ws://localhost:4555')
      ws.onopen = () => {
        try { ws.send('req:snapshot') } catch { /* ignore */ }
      }
      ws.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data as string)
          if (data && data.type === 'snapshot') {
            setSnapshot(JSON.stringify(data.stores, null, 2))
            ws.close()
          }
        } catch { /* ignore */ }
      }
      ws.onerror = () => setSnapshot('error')
    } catch {
      setSnapshot('error')
    }
  }

  return (
    <main style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Fortistate Counter Demo</h1>
      <p>Count: {count}</p>
      <button onClick={() => { counter.inc(); try { fetch('http://localhost:4555/change', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: 'counter', value: { value: count + 1 } }) }) } catch {} }}>{'+'}</button>
      <button onClick={() => { counter.dec(); try { fetch('http://localhost:4555/change', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: 'counter', value: { value: count - 1 } }) }) } catch {} }}>{'-'}</button>
      <button onClick={() => { counter.set(0); try { fetch('http://localhost:4555/change', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: 'counter', value: { value: 0 } }) }) } catch {} }}>Reset</button>
      <div style={{ marginTop: 8 }}>
        <button onClick={registerCounter}>Register Counter with Inspector</button>
      </div>
      <div style={{ marginTop: 20 }}>
        <button onClick={openInspector} style={{ marginRight: 8 }}>Open Inspector</button>
        <button onClick={requestSnapshot}>Request Snapshot</button>
        {snapshot && (
          <pre style={{ background: '#f6f6f6', padding: 8, marginTop: 12, maxHeight: 300, overflow: 'auto' }}>{snapshot}</pre>
        )}
      </div>
    </main>
  );
}
