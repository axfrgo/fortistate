"use client";
import { useStore } from "fortistate";
import { useState, useEffect, useRef, useCallback } from "react";

export default function Home() {
  // @ts-expect-error dynamic store proxy - runtime provides `demoA` and `demoB`
  // `useStore.demoA()` and `useStore.demoB()` return [state, utils]. We'll
  // bind the UI to `demoA` so swapping `demoA` with `demoB` in the inspector
  // demonstrates the swap feature live.
  const [stateA, demoA] = useStore.demoA();
  // @ts-expect-error dynamic store proxy - runtime provides demoB
  const [, demoB] = useStore.demoB();
  const [snapshot, setSnapshot] = useState<string | null>(null)
  const [showInspector, setShowInspector] = useState(false)
  const [inspectorStores, setInspectorStores] = useState<Record<string, unknown> | null>(null)
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [editorText, setEditorText] = useState<string>('')
  const [locateResults, setLocateResults] = useState<Array<{ path: string; line: number; preview: string }>>([])
  const [pickMode, setPickMode] = useState(false)
  const [selectorsMap, setSelectorsMap] = useState<Record<string, string>>(() => {
    try { return JSON.parse(localStorage.getItem('fortistate:selectors') || '{}') } catch { return {} }
  })
  const hoverElRef = useRef<HTMLElement | null>(null)
  const modalRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    if (!pickMode) return
    function onMove(e: MouseEvent) {
      const el = (e.target as HTMLElement | null)
      if (!el) return
      if (modalRef.current && modalRef.current.contains(el)) return
      // highlight
      try {
        if (hoverElRef.current && hoverElRef.current !== el) {
          hoverElRef.current.style.outline = ''
        }
        el.style.outline = '2px solid rgba(59,130,246,0.9)'
        hoverElRef.current = el
      } catch {}
    }
    function onClick(e: MouseEvent) {
      e.preventDefault()
      e.stopPropagation()
      const el = (e.target as HTMLElement | null)
      if (!el) return
      if (modalRef.current && modalRef.current.contains(el)) return
      // build a unique-ish selector: try id, then data-testid, else tag.class
      let sel = ''
      try {
        if (el.id) sel = `#${el.id}`
        else if (el.getAttribute('data-testid')) sel = `[data-testid="${el.getAttribute('data-testid')}"]`
        else {
          const parts: string[] = []
          if (el.tagName) parts.push(el.tagName.toLowerCase())
          if (el.className && typeof el.className === 'string') parts.push('.' + el.className.trim().split(/\s+/).join('.'))
          sel = parts.join('') || el.tagName.toLowerCase()
        }
        if (selectedKey) {
          const next = Object.assign({}, selectorsMap || {})
          next[selectedKey] = sel
          setSelectorsMap(next)
          try { localStorage.setItem('fortistate:selectors', JSON.stringify(next)) } catch {}
        }
      } catch {}
      // exit pick mode
      setPickMode(false)
    }
    document.addEventListener('mousemove', onMove, { capture: true })
    document.addEventListener('click', onClick, { capture: true })
    return () => {
      document.removeEventListener('mousemove', onMove, { capture: true })
      document.removeEventListener('click', onClick, { capture: true })
      try { if (hoverElRef.current) hoverElRef.current.style.outline = '' } catch {}
      hoverElRef.current = null
    }
  }, [pickMode, selectedKey, selectorsMap, setSelectorsMap])
  const wsRef = useRef<WebSocket | null>(null)
  // helper to extract a numeric score field from the store value
  const getScore = (s: unknown): number => {
    if (!s) return 0
    try {
      if (typeof s === 'number') return s
      const obj = s as Record<string, unknown>
      if (typeof obj.score === 'number') return obj.score as number
      if (typeof obj.value === 'number') return obj.value as number
      const n = Number(String(obj))
      return Number.isFinite(n) ? n : 0
    } catch { return 0 }
  }
  const initialStateARef = useRef<number>(getScore(stateA))

  // normalize displayed score to a finite number
  const rawScore = getScore(stateA)
  const displayScore = Number.isFinite(Number(rawScore)) ? Number(rawScore) : 0

  const palette = { accent: '#3b82f6', muted: '#64748b', bgStart: '#ffffff', bgEnd: 'rgba(241,245,249,0.9)' }
  const styles = {
  page: { fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial', padding: '2rem', color: '#071023', background: `linear-gradient(180deg, ${palette.bgStart}, ${palette.bgEnd})` } as React.CSSProperties,
  card: { background: 'linear-gradient(180deg, rgba(255,255,255,0.9), rgba(243,246,249,0.85))', padding: 20, borderRadius: 12, boxShadow: '0 8px 30px rgba(16,24,40,0.06)', maxWidth: 760, border: `1px solid rgba(59,130,246,0.06)`, transition: 'transform .18s ease, box-shadow .18s ease' } as React.CSSProperties,
    header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 } as React.CSSProperties,
    controls: { display: 'flex', gap: 8, marginTop: 12 } as React.CSSProperties,
    bigCount: { fontSize: 48, fontWeight: 700, margin: '12px 0', color: '#0b1220' } as React.CSSProperties,
    btnPrimary: { background: palette.accent, color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 10, cursor: 'pointer', transition: 'transform .12s ease, box-shadow .12s ease' } as React.CSSProperties,
    btnGhost: { background: 'transparent', border: '1px solid rgba(16,24,40,0.06)', padding: '8px 12px', borderRadius: 10, cursor: 'pointer', color: '#0b1220', transition: 'transform .12s ease' } as React.CSSProperties,
    snapshotBox: { background: 'linear-gradient(180deg, rgba(255,255,255,0.92), rgba(243,246,249,0.9))', color: '#0f1724', padding: 12, borderRadius: 8, marginTop: 12, maxHeight: 320, overflow: 'auto', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, "Roboto Mono", monospace', border: '1px solid rgba(16,24,40,0.04)' } as React.CSSProperties
  }

  function openInspector() {
    // open the inline inspector modal instead of a separate window
    setShowInspector(true)
  }

  // helper to build headers (supports optional window-injected token)
  const inspectorHeaders = useCallback((): Record<string,string> => {
    const headers: Record<string,string> = { 'Content-Type': 'application/json' }
    const w = typeof window !== 'undefined' ? (window as unknown as { __FORTISTATE_INSPECTOR_TOKEN?: string }) : undefined
    if (w && w.__FORTISTATE_INSPECTOR_TOKEN) headers['x-fortistate-token'] = w.__FORTISTATE_INSPECTOR_TOKEN
    return headers
  }, [])

  const registerDemoStores = useCallback(async () => {
    try {
      await fetch('http://localhost:4000/register', {
        method: 'POST', headers: inspectorHeaders(), body: JSON.stringify({ key: 'demoA', initial: { name: 'Alice', score: initialStateARef.current } })
      })
    } catch {}
    try {
      await fetch('http://localhost:4000/register', {
        method: 'POST', headers: inspectorHeaders(), body: JSON.stringify({ key: 'demoB', initial: { name: 'Bob', score: 7 } })
      })
    } catch {}
  }, [inspectorHeaders])

  // register once on mount
  useEffect(() => { registerDemoStores() }, [registerDemoStores])

  // open a long-lived WS to the inspector and apply remote changes in real time
  useEffect(() => {
    let ws: WebSocket | null = null
    try {
      ws = new WebSocket('ws://localhost:4000')
      ws.addEventListener('message', (ev) => {
        try {
          const data = JSON.parse(ev.data as string)
          if (!data) return
          console.debug('[inspector.ws] message', data)
          // apply changes to demoA/demoB stores if relevant
          if ((data.type === 'store:change' || data.type === 'store:create') && (data.key === 'demoA' || data.key === 'demoB')) {
              try {
              const d = data as Record<string, unknown>
              let incoming = (data.type === 'store:change') ? data.value : (d.initial ?? d.value)
              // normalize numeric primitives to shape { score: n }
              if (typeof incoming === 'number') incoming = { score: incoming }
              if (data.key === 'demoA') demoA.set(incoming)
              if (data.key === 'demoB') demoB.set(incoming)
            } catch (e) { console.error(e) }
          }
        } catch { }
      })
  } catch { }

  return () => { try { if (ws) ws.close() } catch { } }
  }, [demoA, demoB])

  const requestSnapshot = useCallback(async () => {
    try {
      const ws = new WebSocket('ws://localhost:4000')
      ws.onopen = () => { try { ws.send('req:snapshot') } catch {} }
      ws.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data as string)
          if (data && data.type === 'snapshot') {
                setSnapshot(JSON.stringify(data.stores, null, 2))
                setInspectorStores(data.stores)
                // set selectedKey to demoA if present
                try {
                  const stores = data.stores as Record<string, unknown> | undefined
                  if (stores && stores.demoA) setSelectedKey((cur) => cur ?? 'demoA')
                } catch {}
                ws.close()
              }
        } catch {}
      }
      ws.onerror = () => setSnapshot('error')
    } catch {
      setSnapshot('error')
    }
  }, [])


  // when the modal opens, request a snapshot and open a WS for live updates
  useEffect(() => {
    if (!showInspector) return;
    requestSnapshot()
    try {
      const ws = new WebSocket('ws://localhost:4000')
      wsRef.current = ws
      ws.addEventListener('message', (ev) => {
        try {
          const data = JSON.parse(ev.data as string)
          if (!data) return
            if ((data.type === 'store:change' || data.type === 'store:create') && data.key) {
            const val = (data.type === 'store:change') ? (data.value as unknown) : (((data as unknown) as { initial?: unknown }).initial ?? ((data as unknown) as { value?: unknown }).value)
            setInspectorStores((prev) => {
              const next: Record<string, unknown> = Object.assign({}, prev || {})
              next[data.key] = val
              return next
            })
            // ensure we select a key if none is selected, using functional updater to avoid stale closures
            setSelectedKey((cur) => cur ?? data.key)
          }
        } catch { /* ignore */ }
      })
  } catch { /* ignore */ }
    return () => {
      try { if (wsRef.current) wsRef.current.close() } catch {}
      wsRef.current = null
    }
  }, [showInspector, requestSnapshot])
  useEffect(() => {
    // when selectedKey changes, update editorText to pretty JSON of that store
    if (!selectedKey || !inspectorStores) return
    try {
      setEditorText(JSON.stringify(inspectorStores[selectedKey], null, 2))
    } catch {
      setEditorText(String(inspectorStores[selectedKey]))
    }
  }, [selectedKey, inspectorStores])

  async function locateSource(key: string) {
    try {
    const r = await fetch(`http://localhost:4000/locate-source?key=${encodeURIComponent(key)}`)
      if (!r.ok) return setLocateResults([])
      const j = await r.json()
      setLocateResults(j || [])
    } catch {
      setLocateResults([])
    }
  }

  // When selecting a store in the inline inspector, swap it into demoA so
  // the main demo UI (which binds to `demoA`) reflects the selected store.
  async function selectStore(key: string) {
    try {
      setSelectedKey(key)
      // if selecting a different key than demoA, request a server-side swap
      if (key && key !== 'demoA') {
        await fetch('http://localhost:4000/swap-stores', {
          method: 'POST',
          headers: inspectorHeaders(),
          body: JSON.stringify({ keyA: 'demoA', keyB: key })
        })
        // optimistic UI swap in the snapshot view and in-memory stores
        setInspectorStores((prev) => {
          const next = Object.assign({}, prev || {}) as Record<string, unknown>
          try {
            const a = next['demoA']
            const b = next[key]
            next['demoA'] = b
            next[key] = a
            // also update runtime demo stores so the UI (bound to demoA) updates immediately
            try {
              if (b !== undefined) demoA.set(b)
              if (a !== undefined && typeof demoB?.set === 'function') demoB.set(a)
            } catch { /* ignore runtime update errors */ }
          } catch { /* ignore */ }
          return next
        })
      }
    } catch {
      // ignore network errors
    }
  }

  async function updateInspectorValue(key: string, rawText: string) {
    let parsed: unknown = undefined
    try { parsed = JSON.parse(rawText) } catch {
      // fallback: try to coerce to number or keep as string
      const n = Number(rawText)
      parsed = Number.isFinite(n) ? n : rawText
    }
    try {
      await fetch('http://localhost:4000/change', { method: 'POST', headers: inspectorHeaders(), body: JSON.stringify({ key, value: parsed }) })
      // optimistic local update
      setInspectorStores((prev: Record<string, unknown> | null) => {
        const next = Object.assign({}, prev || {}) as Record<string, unknown>
        next[key] = parsed
        return next
      })
    } catch {
      // ignore network errors for now
    }
  }

  return (
    <main style={styles.page}>
      <div className="demo-frame">
        <div className="macbook-shell">
          <div className="macbook-notch">Fortistate Demo</div>
          <div className="obs-badge">OBS</div>
          <div style={styles.card}>
        <div style={styles.header}>
          <div>
            <div style={{color:'#475569',marginTop:6}}>Tiny demo of the <strong>fortistate</strong> inspector & runtime</div>
          </div>
          <div>
            <button type="button" aria-label="open-inspector" title="Open inspector" onClick={openInspector} className="icon-btn ghost" style={{marginRight:8}}>
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 3v18M3 12h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
        </div>

            <div style={{display:'flex',alignItems:'center',gap:20, marginTop:18}}>
          <div>
            <div style={{color:'#6b7280'}}>{selectedKey ? `${selectedKey} score` : 'Demo A score'}</div>
            <div style={styles.bigCount}>{displayScore}</div>
            <div style={styles.controls}>
              <button type="button" aria-label="increment" onMouseDown={(e) => (e.currentTarget.style.transform = 'translateY(1px)')} onMouseUp={(e) => (e.currentTarget.style.transform = '')} onClick={() => {
                try {
                  // increment demoA or demoB depending on selection
                  try {
                    if (selectedKey === 'demoB') demoB.inc()
                    else demoA.inc()
                    const active = selectedKey || 'demoA'
                    // post change to inspector for snapshot sync
                    try { fetch('http://localhost:4000/change', { method: 'POST', headers: inspectorHeaders(), body: JSON.stringify({ key: active, value: (selectedKey === 'demoB' ? undefined : undefined) }) }) } catch {}
                  } catch {}
                } catch { }
              }} className="icon-btn primary" title="Increment"> <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg></button>

              <button type="button" aria-label="decrement" onMouseDown={(e) => (e.currentTarget.style.transform = 'translateY(1px)')} onMouseUp={(e) => (e.currentTarget.style.transform = '')} onClick={() => {
                try {
                  try {
                    if (selectedKey === 'demoB') demoB.dec()
                    else demoA.dec()
                    const active = selectedKey || 'demoA'
                    try { fetch('http://localhost:4000/change', { method: 'POST', headers: inspectorHeaders(), body: JSON.stringify({ key: active, value: undefined }) }) } catch {}
                  } catch {}
                } catch { }
      }} className="icon-btn ghost" title="Decrement"> <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19 7L5 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
  <button type="button" aria-label="reset" title="Reset" onMouseDown={(e) => (e.currentTarget.style.transform = 'translateY(1px)')} onMouseUp={(e) => (e.currentTarget.style.transform = '')} onClick={() => {
                try {
                  try {
                    if (selectedKey === 'demoB') demoB.set({ score: 0 })
                    else demoA.set({ score: 0 })
                    const active = selectedKey || 'demoA'
                    try { fetch('http://localhost:4000/change', { method: 'POST', headers: inspectorHeaders(), body: JSON.stringify({ key: active, value: { score: 0 } }) }) } catch {}
                  } catch {}
                } catch {}
              }} className="icon-btn ghost"> <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 12a9 9 0 1 0-3.2 6.8L21 21" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
                    {/* Try VSCode button removed from this control area (belongs in locate results) */}
            </div>
          </div>

          <div style={{marginLeft:'auto', minWidth:260}}>
            <div style={{color:'#6b7280', marginBottom:8}}>Inspector</div>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              <button type="button" aria-label="register-demo-stores" title="Register demo stores" onClick={registerDemoStores} className="icon-btn ghost">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              
            </div>
            {snapshot && <pre style={styles.snapshotBox}>{snapshot}</pre>}
          </div>
        </div>
          </div>
        </div>
      </div>
      {showInspector && (
        <div style={{position:'fixed',inset:0,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(2,6,23,0.45)',zIndex:1200}}>
          <div className="inline-inspector" ref={modalRef}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between', gap:12}}>
              <h3 style={{margin:0}}>Inspector (inline)</h3>
                <div style={{display:'flex',gap:8}}>
                <button type="button" aria-label="close-inspector" title="Close" onClick={() => { setShowInspector(false) }} className="icon-btn primary"> <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
              </div>
            </div>
            <div style={{display:'flex',gap:12,marginTop:12}}>
              <div style={{width:260}}>
                <div style={{fontSize:12,color:palette.muted,marginBottom:8}}>Stores</div>
                <div style={{background:'#f8fafc',padding:8,borderRadius:8,maxHeight:420,overflow:'auto'}}>
                  {inspectorStores ? Object.keys(inspectorStores).map((k) => (
                    <div key={k} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'6px 8px',borderRadius:8,marginBottom:6,background:k===selectedKey? 'rgba(59,130,246,0.06)': 'transparent',cursor:'pointer'}} onClick={() => selectStore(k)}>
                      <div style={{fontSize:13}}>{k}</div>
                      <div style={{fontSize:12,color:palette.muted}}>{typeof inspectorStores[k]}</div>
                    </div>
                  )) : <div style={{color:palette.muted}}>No snapshot</div>}
                </div>
              </div>
              <div style={{flex:1,display:'flex',flexDirection:'column'}}>
                <div style={{fontSize:12,color:palette.muted,marginBottom:8}}>Edit store value (JSON)</div>
                <textarea value={editorText} onChange={(e) => setEditorText(e.target.value)} style={{width:'100%',minHeight:220,fontFamily:'ui-monospace, SFMono-Regular, Menlo, Monaco, "Roboto Mono", monospace',padding:12,borderRadius:8,border:'1px solid rgba(2,6,23,0.06)'}} />
                <div style={{display:'flex',gap:8,marginTop:10}}>
                  <button type="button" aria-label="update-store" title="Update store" onClick={() => { if (selectedKey) updateInspectorValue(selectedKey, editorText) }} className="icon-btn primary"> <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 7h16M4 12h8M4 17h8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
                    <button type="button" aria-label="locate-source" title="Locate in source" onClick={() => { if (selectedKey) locateSource(selectedKey) }} className="icon-btn ghost"> <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="1.4"/><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg></button>
                    <button type="button" aria-label="pick-element" title="Pick element" onClick={() => {
                      // toggle pick mode
                      setPickMode((s) => !s)
                    }} className="icon-btn ghost" style={{ background: pickMode ? 'rgba(59,130,246,0.06)' : undefined}}> <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2v20M2 12h20" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
                </div>
                {selectedKey && selectorsMap[selectedKey] && (
                  <div style={{marginTop:8,fontSize:13}}>
                    <strong>Mapped element:</strong>{' '}
                    <code style={{fontFamily:'ui-monospace'}}>{selectorsMap[selectedKey]}</code>
                    <button type="button"
                      aria-label="copy-selector"
                      onClick={() => {
                        const copy = selectorsMap[selectedKey];
                        try {
                          if (navigator.clipboard) navigator.clipboard.writeText(copy);
                        } catch {}
                      }}
                      className="icon-btn ghost"
                      title="Copy selector"
                      style={{ marginLeft:8 }}
                    >
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 7h10v10H8zM5 4h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                  </div>
                )}
                  {locateResults.length > 0 && (
                    <div style={{marginTop:12}}>
                      <div style={{fontSize:12,color:palette.muted}}>Source candidates</div>
                      <div style={{background:'#fff',padding:8,borderRadius:8,border:'1px solid rgba(2,6,23,0.04)',maxHeight:180,overflow:'auto',marginTop:8}}>
                        {locateResults.map((r) => (
                          <div key={`${r.path}:${r.line}`} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'6px 8px',borderRadius:8,marginBottom:6}}>
                            <div style={{fontSize:13}}>{r.path}:{r.line}</div>
                            <div style={{display:'flex',gap:8}}>
                              <button type="button" aria-label="copy-path" title="Copy path" onClick={async () => { try { if (navigator.clipboard) await navigator.clipboard.writeText(`${r.path}:${r.line}`) } catch {} }} className="icon-btn ghost"> <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 7h10v10H8zM5 4h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
                              <button type="button" aria-label="try-vscode" title="Open in editor" onClick={async () => { try { const res = await fetch('http://localhost:4000/open-source', { method: 'POST', headers: inspectorHeaders(), body: JSON.stringify({ path: r.path, line: r.line }) }); console.debug('[open-source] status', res.status); } catch (e) { console.error(e) } }} className="icon-btn primary"> <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 3v18l9-9-9-9z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="currentColor"/></svg></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                <div style={{marginTop:12}}>
                  <div style={{fontSize:12,color:palette.muted}}>Live snapshot</div>
                  <pre style={{...styles.snapshotBox, marginTop:8}}>{inspectorStores ? JSON.stringify(inspectorStores, null, 2) : 'no snapshot'}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
