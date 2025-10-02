const inspectorClientHtml = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Fortistate Inspector (embedded)</title>
    <meta name="viewport" content="width=device-width,initial-scale=1" />
      <!-- To set a favicon for the embedded inspector, place a file at /favicon.ico served by the inspector server
           or update this href to point to a reachable icon URL (absolute or relative to the inspector host). -->
      <link rel="icon" href="/favicon.ico" />
    <style>
      :root{--bg:#0f1724;--card:#0f1724;--muted:#64748b;--accent:#3b82f6}
      html,body{height:100%}
      body{font-family:Inter, system-ui, -apple-system, 'Segoe UI', Roboto, Arial;margin:0;background:linear-gradient(180deg,#f8fafc,#eef2ff);color:#0f1724}
      .wrap{padding:14px;max-width:920px;margin:auto}
      .header{display:flex;align-items:center;gap:12px;margin-bottom:12px}
      h1{font-size:16px;margin:0;font-weight:600}
      .subtitle{color:var(--muted);font-size:12px}
      .topbar{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}
      .preset-panel{background:#fff;padding:12px;border-radius:10px;box-shadow:0 6px 20px rgba(15,23,42,0.06);border:1px solid rgba(2,6,23,0.04)}
      .preset-panel h3{margin:0 0 8px 0;font-size:13px}
      .controls-row{display:flex;gap:8px;align-items:center}
      .store-list{margin-top:12px;display:grid;grid-template-columns:1fr;gap:10px}
      .store-item{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;padding:10px;border-radius:10px;background:#fff;border:1px solid rgba(2,6,23,0.04);box-shadow:0 4px 18px rgba(16,24,40,0.03)}
      .store-left{display:flex;flex-direction:column}
      .store-key{font-weight:700;font-size:13px}
      .store-type{font-size:12px;color:var(--muted)}
      .store-value{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,'Roboto Mono',monospace;font-size:12px;margin-top:8px;white-space:pre-wrap;max-height:120px;overflow:auto;padding:8px;border-radius:6px;background:#f8fafc;border:1px solid rgba(2,6,23,0.02)}
      .store-controls{display:flex;gap:8px;align-items:center}
      .btn{padding:6px 10px;border-radius:8px;border:1px solid rgba(2,6,23,0.06);background:transparent;cursor:pointer;font-size:13px}
      .btn .icon{margin-right:8px;display:inline-block}
      .btn.primary{background:var(--accent);color:white;border:0}
      .btn.secondary{background:#eef2ff;color:var(--accent);border:0}
      .btn.ghost{background:transparent}
      /* variants for small icon buttons in the preset panel */
      .btn.small{padding:6px 8px;border-radius:8px;font-size:13px}
      #apply-btn{min-width:84px}
      #css-btn{min-width:110px}
      #set-token-btn{min-width:96px}
      /* token input styling to match other controls */
      #token-input{padding:8px;border-radius:8px;border:1px solid rgba(2,6,23,0.06);background:#fff}
      .btn.primary{background:var(--accent);color:white;border:0}
      
      .filter{width:100%;padding:8px;border-radius:8px;border:1px solid rgba(2,6,23,0.06);background:#fff}
      .no-stores{color:var(--muted);padding:12px;text-align:center}
      select, input, textarea{font-size:13px}
      a{color:var(--accent)}
    </style>
  </head>
  <body>
    <div class="wrap">
    <div class="topbar" role="banner">
      <div>
        <h1 id="title">Fortistate Inspector</h1>
        <div class="subtitle">Embedded inspector — remote stores & presets</div>
      </div>
      <div style="display:flex;gap:8px;align-items:center">
        <input id="store-filter" class="filter" placeholder="Filter stores (name or type)" aria-label="Filter stores" />
        <button id="dark-toggle" class="btn ghost" aria-pressed="false" title="Toggle dark mode">Dark</button>
        <button id="timeline-toggle" class="btn ghost" aria-expanded="false" title="Show history timeline">Timeline</button>
        <button id="telemetry-toggle" class="btn ghost" aria-expanded="false" title="Show law telemetry">Telemetry</button>
      </div>
    </div>
    <div class="preset-panel">
      <h3>Presets</h3>
        <div style="display:flex;gap:8px;align-items:center">
        <select id="preset-select" style="min-width:140px"></select>
  <input type="text" id="preset-target" placeholder="target key (optional)" style="padding:8px;border-radius:8px;border:1px solid rgba(2,6,23,0.06)" />
  <button id="apply-btn" class="btn primary small" onclick="applyPreset()"><span class="icon"></span>Apply</button>
  <button id="css-btn" class="btn secondary small" onclick="installPresetCss()"><span class="icon"></span>Install CSS</button>
      </div>
      <div style="margin-top:8px"><small id="preset-desc" style="color:#666"></small></div>
      <div style="margin-top:8px;display:flex;gap:8px;align-items:center">
        <input id="token-input" placeholder="Inspector token (optional)" style="flex:1" />
        <button id="set-token-btn" class="btn primary" onclick="setToken()">Set Token</button>
      </div>
    </div>
  <div id="stores" class="store-list"></div>
  <div id="timeline" style="margin-top:12px;display:none">
    <h3>State History</h3>
    <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px">
      <button id="replay-prev" class="btn small">◀ Prev</button>
      <button id="replay-play" class="btn primary small">Play</button>
      <button id="replay-next" class="btn small">Next ▶</button>
      <div id="timeline-status" style="margin-left:8px;color:#666;font-size:13px"></div>
    </div>
    <div id="history-list" style="max-height:240px;overflow:auto;border-radius:8px;background:#fff;padding:8px;border:1px solid rgba(2,6,23,0.04)" role="list"></div>
  </div>
  <div id="telemetry-panel" style="margin-top:12px;display:none">
    <h3>Law Telemetry <span id="telemetry-status" style="font-size:12px;color:#666;margin-left:8px">(connecting...)</span></h3>
    <div id="telemetry-list" style="max-height:300px;overflow:auto;border-radius:8px;background:#fff;padding:8px;border:1px solid rgba(2,6,23,0.04)" role="list"></div>
  </div>
    <script>
      let stores = {}
  let ws = null
  let presets = []
  // deterministic handshake key set via postMessage or window.fortistate.setActiveKey
  let activeKeyHint = undefined
  // expose programmatic API for deterministic selection
  try { if (typeof window !== 'undefined') { window.fortistate = window.fortistate || {}; window.fortistate.setActiveKey = function(k){ activeKeyHint = String(k); console.debug('[inspector.client] activeKey set via API',k); }; } } catch(e){}

  // listen for postMessage handshake from host page
  if (typeof window !== 'undefined' && window.addEventListener) {
    window.addEventListener('message', (ev) => {
      try {
        const d = ev && ev.data
        if (d && d.type === 'fortistate:setActiveKey' && d.key) {
          activeKeyHint = String(d.key)
          console.debug('[inspector.client] activeKey set via postMessage', d.key)
        }
      } catch (e) { }
    }, false)
  }

      async function tryFetch(url) {
        try {
          const res = await fetch(url, { credentials: 'include' })
          if (!res.ok) throw new Error('bad status ' + res.status)
          return await res.json()
        } catch (e) {
          console.debug('[inspector.client] fetch failed', url, e && e.message)
          return null
        }
      }

      async function loadRemoteStores() {
        // Try same-origin first, then common fallbacks (useful when the client
        // is embedded into another app or opened from a different origin).
        const candidates = [
          '/remote-stores',
          location.protocol + '//' + location.hostname + (location.port ? ':' + location.port : '') + '/remote-stores',
          'http://localhost:4000/remote-stores',
          'http://127.0.0.1:4000/remote-stores'
        ]
        let js = null
        for (const u of candidates) {
          js = await tryFetch(u)
          if (js && Object.keys(js).length > 0) break
        }
        stores = js || {}
        renderStores()
        // show hint when empty
        if (!stores || Object.keys(stores).length === 0) {
          const el = document.getElementById('stores')
          if (el) el.innerHTML = '<div style="color:#666">No stores found. Ensure the inspector server is running and this client is loaded from the inspector (http://localhost:4000/). You can also try opening <a href="/remote-stores">/remote-stores</a> directly.</div>'
        }
      }

      async function loadPresets() {
        try {
          const res = await fetch('/presets')
          if (!res.ok) return
          presets = await res.json()
          const sel = document.getElementById('preset-select')
          sel.innerHTML = presets.map(function(p){ return '<option value="'+p.name+'">'+p.name+'</option>'; }).join('')
          updatePresetDesc()
        } catch (e) { console.error('presets load', e) }
      }

      function updatePresetDesc() {
        const name = document.getElementById('preset-select').value
        const desc = document.getElementById('preset-desc')
        try {
          const found = presets.find(function(x){ return x && x.name === name })
          desc.innerText = (found && found.description) ? found.description : ''
        } catch (e) { desc.innerText = '' }
      }

      function renderStores() {
        const el = document.getElementById('stores')
        const filter = (document.getElementById('store-filter') && document.getElementById('store-filter').value || '').toLowerCase()
        const keys = Object.keys(stores || {})
        const visible = keys.filter(function(k){
          const t = String(typeof stores[k] || '')
          return !filter || k.toLowerCase().includes(filter) || t.toLowerCase().includes(filter) || JSON.stringify(stores[k]).toLowerCase().includes(filter)
        })
        el.innerHTML = visible.map(function(key){
          const v = JSON.stringify(stores[key], null, 2)
          let out = '<div class="store-item">'
          out += '<div class="store-left">'
          out += '<div class="store-key">' + escapeHtml(String(key)) + '</div>'
          out += '<div class="store-type">' + escapeHtml(String(typeof stores[key])) + '</div>'
          out += '<pre class="store-value">' + escapeHtml(v) + '</pre>'
          out += '</div>'
          out += '<div class="store-controls">'
          out += '<button class="btn" class="dup-btn" data-key="' + encodeURIComponent(String(key)) + '">Duplicate</button>'
          out += '<button class="btn" class="swap-btn" data-key="' + encodeURIComponent(String(key)) + '">Swap</button>'
          out += '<button class="btn ghost" class="move-btn" data-key="' + encodeURIComponent(String(key)) + '">Move</button>'
          out += '</div>'
          out += '</div>'
          return out
        }).join('')

        // attach event listeners
        if (el) {
          Array.from(el.querySelectorAll('[data-key]')).forEach(function(b){
            const cls = b.className || ''
            const k = (b.getAttribute('data-key') || '')
            if (cls.indexOf('dup-btn') >= 0 || cls.indexOf('dup-btn') === 0) {
              b.addEventListener('click', function(){ duplicateStore(decodeURIComponent(k)) })
            }
            if (cls.indexOf('swap-btn') >= 0 || cls.indexOf('swap-btn') === 0) {
              b.addEventListener('click', function(){ swapStore(decodeURIComponent(k)) })
            }
            if (cls.indexOf('move-btn') >= 0 || cls.indexOf('move-btn') === 0) {
              b.addEventListener('click', function(){ moveStore(decodeURIComponent(k)) })
            }
          })
        }
      }

      function escapeHtml(s) {
        return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      }

      async function applyPreset() {
        const name = document.getElementById('preset-select').value
        const targetKey = document.getElementById('preset-target').value.trim() || undefined
        try {
          const res = await fetch('/apply-preset', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, targetKey })
          })
          if (res.ok) {
            loadRemoteStores()
          } else {
            alert('Failed to apply preset')
          }
        } catch (e) { alert('Error: ' + e.message) }
      }

      async function installPresetCss() {
        const name = document.getElementById('preset-select').value
        try {
          const token = document.getElementById('token-input').value.trim()
          const headers = { 'Content-Type': 'application/json' }
          if (token) headers['x-fortistate-token'] = token
          const res = await fetch('/apply-preset', {
            method: 'POST',
            headers,
            body: JSON.stringify({ name, installCss: true })
          })
          if (res.ok) {
            alert('CSS installed')
          } else {
            alert('Failed to install CSS')
          }
        } catch (e) { alert('Error: ' + e.message) }
      }

      async function setToken() {
        const t = document.getElementById('token-input').value.trim()
        if (!t) return alert('Enter a token')
        try {
          const res = await fetch('/set-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: t })
          })
          if (res.ok) alert('Token set')
          else alert('Failed to set token')
        } catch (e) { alert('Error: ' + e.message) }
      }

      async function duplicateStore(sourceKey) {
        const destKey = prompt('New key for duplicate:')
        if (!destKey) return
        try {
          const res = await fetch('/duplicate-store', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sourceKey, destKey })
          })
          if (res.ok) {
            loadRemoteStores()
          } else {
            alert('Failed to duplicate store')
          }
        } catch (e) { alert('Error: ' + e.message) }
      }

      async function swapStore(keyA) {
        // try to auto-detect the currently active store key in the host app
          const auto = detectActiveKey(keyA) || keyA
        const keyB = auto
        if (!keyB || !stores[keyB]) {
          alert('Could not determine target key to swap with')
          return
        }
        try {
          const res = await fetch('/swap-stores', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ keyA, keyB })
          })
          if (res.ok) {
            loadRemoteStores()
          } else {
            alert('Failed to swap stores')
          }
        } catch (e) { alert('Error: ' + e.message) }
      }

  // Heuristic to detect an "active" store key from the host app.
  // Checks: URL search param 'fortistate', data-active-key on body, a global
  // window.__FORTISTATE_ACTIVE__ value, or common keys present in the stores list.
      function detectActiveKey(fallbackKey) {
        try {
          // deterministic hint first
          if (activeKeyHint && stores[activeKeyHint]) return activeKeyHint
          // 1) URL param: ?fortistate=key
          try {
            const u = new URL(location.href)
            const k = u.searchParams.get('fortistate')
            if (k && stores[k]) return k
          } catch (e) { /* ignore */ }

          // 2) data-active-key attribute on body or html
          const bodyAttr = document.body && document.body.getAttribute && document.body.getAttribute('data-active-key')
          if (bodyAttr && stores[bodyAttr]) return bodyAttr
          const htmlAttr = document.documentElement && document.documentElement.getAttribute && document.documentElement.getAttribute('data-active-key')
          if (htmlAttr && stores[htmlAttr]) return htmlAttr

          // 3) global window hint (legacy)
          if (typeof window !== 'undefined' && window.__FORTISTATE_ACTIVE__) {
            const g = window.__FORTISTATE_ACTIVE__
            if (typeof g === 'string' && stores[g]) return g
          }

          // 4) common key names: try friendly names that many demos use
          const common = ['demoA', 'demoB', 'counter', 'state', 'appState', 'store']
          for (const c of common) if (stores[c]) return c

          // 5) fallback: if only two stores exist and one matches the passed fallbackKey, pick the other
          const keys = Object.keys(stores || {})
          if (keys.length === 2 && fallbackKey) {
            if (keys[0] === fallbackKey) return keys[1]
            if (keys[1] === fallbackKey) return keys[0]
          }
        } catch (e) { /* ignore heuristics */ }
        return undefined
      }

      async function moveStore(oldKey) {
        const newKey = prompt('New key:')
        if (!newKey) return
        try {
          const res = await fetch('/move-store', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ oldKey, newKey })
          })
          if (res.ok) {
            loadRemoteStores()
          } else {
            alert('Failed to move store')
          }
        } catch (e) { alert('Error: ' + e.message) }
      }

      // WebSocket for real-time updates
      function connectWS() {
        const hosts = [location.host, 'localhost:4000', '127.0.0.1:4000']
        let idx = 0
        function tryNext() {
          if (idx >= hosts.length) {
            // retry full cycle after a pause
            idx = 0
            setTimeout(tryNext, 2000)
            return
          }
          const h = hosts[idx++]
          try {
            ws = new WebSocket('ws://' + h)
          } catch (e) {
            setTimeout(tryNext, 200)
            return
          }
          ws.onopen = () => console.debug('[inspector.client] ws open', h)
          ws.onmessage = (e) => {
            try {
              const msg = JSON.parse(e.data)
              if (msg.type === 'store:create' || msg.type === 'store:change') {
                stores[msg.key] = msg.initial || msg.value
                renderStores()
              }
            } catch (err) { console.error('ws msg error', err) }
          }
          ws.onclose = () => {
            console.debug('[inspector.client] ws closed for', h)
            // try next host
            setTimeout(tryNext, 200)
          }
          ws.onerror = () => {
            console.debug('[inspector.client] ws error for', h)
            try { ws.close() } catch (e) {}
          }
        }
        tryNext()
      }

  loadRemoteStores()
  loadPresets()
  setInterval(loadRemoteStores, 3000)
  connectWS()

  // history / timeline support
  let historyEntries = []
  let replayIndex = -1
  async function loadHistory() {
    try {
      const res = await fetch('/history')
      if (!res.ok) return
      historyEntries = await res.json()
      renderHistory()
    } catch (e) { console.debug('history load', e && e.message) }
  }

  function renderHistory() {
    const container = document.getElementById('history-list')
    if (!container) return
    container.innerHTML = historyEntries.map(function(h, i){
      return '<div role="listitem" tabindex="0" data-idx="'+i+'" style="padding:8px;border-bottom:1px solid #f0f0f0"><strong>'+escapeHtml(String(h.action || ''))+'</strong> <small style="color:#666">'+new Date(h.ts||0).toLocaleString()+'</small><div style="font-family:monospace;margin-top:6px;white-space:pre-wrap">'+escapeHtml(JSON.stringify(h, null, 2))+'</div></div>'
    }).join('')
    // simple keyboard support for selecting entries
    Array.from(container.querySelectorAll('[data-idx]')).forEach(function(el){
      el.addEventListener('click', function(){ replayIndex = Number(el.getAttribute('data-idx')); applyHistoryEntry(replayIndex) })
      el.addEventListener('keydown', function(e){ if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); replayIndex = Number(el.getAttribute('data-idx')); applyHistoryEntry(replayIndex) } })
    })
  }

  function applyHistoryEntry(idx) {
    const h = historyEntries[idx]
    if (!h) return
    // for replay, if change action with key/value, POST to /change
    if (h.action === 'change' && h.key) {
      fetch('/change', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: h.key, value: h.value }) }).then(r => { if (r.ok) showToast('Replayed change') })
    }
    // other actions are informational
    const status = document.getElementById('timeline-status')
  if (status) status.innerText = 'Selected ' + (idx+1) + '/' + historyEntries.length
  }

  document.getElementById('timeline-toggle').addEventListener('click', function(){
    const el = document.getElementById('timeline')
    if (!el) return
    const expanded = el.style.display !== 'none'
    el.style.display = expanded ? 'none' : 'block'
    this.setAttribute('aria-expanded', (!expanded).toString())
    if (!expanded) { loadHistory() }
  })

  document.getElementById('replay-play').addEventListener('click', async function(){
    // simple play through changes
    if (historyEntries.length === 0) return
    for (let i = 0; i < historyEntries.length; i++) {
      await new Promise(r => setTimeout(r, 250))
      replayIndex = i
      applyHistoryEntry(i)
    }
    showToast('Replay finished')
  })
  document.getElementById('replay-prev').addEventListener('click', function(){ if (replayIndex>0) { replayIndex--; applyHistoryEntry(replayIndex) } })
  document.getElementById('replay-next').addEventListener('click', function(){ if (replayIndex < historyEntries.length-1) { replayIndex++; applyHistoryEntry(replayIndex) } })

  // dark mode toggle
  document.getElementById('dark-toggle').addEventListener('click', function(){
    const pressed = this.getAttribute('aria-pressed') === 'true'
    this.setAttribute('aria-pressed', (!pressed).toString())
    if (!pressed) document.body.style.background = 'linear-gradient(180deg,#0f1724,#0b1220)', document.body.style.color = '#e6eef6'
    else document.body.style.background = 'linear-gradient(180deg,#f8fafc,#eef2ff)', document.body.style.color = '#0f1724'
  })

  // minimal toast system
  function showToast(msg) {
    let t = document.getElementById('fortistate-toast')
    if (!t) {
      t = document.createElement('div'); t.id = 'fortistate-toast'; t.style.position='fixed'; t.style.right='16px'; t.style.bottom='16px'; t.style.padding='10px 14px'; t.style.borderRadius='8px'; t.style.background='rgba(15,23,42,0.9)'; t.style.color='#fff'; t.style.zIndex='9999'; document.body.appendChild(t)
    }
    t.innerText = msg
    setTimeout(()=>{ try{ t.parentNode && t.parentNode.removeChild(t) } catch(e){} }, 3000)
  }

  // telemetry SSE stream
  let telemetrySource = null
  const telemetryEntries = []
  const MAX_TELEMETRY_DISPLAY = 50

  function connectTelemetry() {
    if (telemetrySource) return
    const status = document.getElementById('telemetry-status')
    try {
      telemetrySource = new EventSource('/telemetry/stream')
      if (status) status.innerText = '(connected)'
      
      telemetrySource.onmessage = function(e) {
        try {
          const entry = JSON.parse(e.data)
          telemetryEntries.push(entry)
          if (telemetryEntries.length > MAX_TELEMETRY_DISPLAY) telemetryEntries.shift()
          renderTelemetry()
        } catch (err) { console.debug('telemetry parse', err) }
      }
      
      telemetrySource.onerror = function() {
        if (status) status.innerText = '(disconnected)'
        if (telemetrySource) telemetrySource.close()
        telemetrySource = null
      }
    } catch (e) {
      if (status) status.innerText = '(error)'
    }
  }

  function renderTelemetry() {
    const container = document.getElementById('telemetry-list')
    if (!container) return
    container.innerHTML = telemetryEntries.slice().reverse().map(function(entry){
      const severityColor = entry.severity === 'error' ? '#dc2626' : entry.severity === 'warn' ? '#f59e0b' : '#10b981'
      const typeLabel = entry.type || 'event'
      return '<div style="padding:8px;border-bottom:1px solid #f0f0f0;font-size:13px"><div style="display:flex;gap:8px;align-items:center"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:'+severityColor+'"></span><strong>'+escapeHtml(entry.lawName || 'unknown')+'</strong><span style="color:#666">'+typeLabel+'</span><span style="color:#999;font-size:11px;margin-left:auto">'+new Date(entry.timestamp||0).toLocaleTimeString()+'</span></div><div style="margin-top:4px;color:#666">'+escapeHtml(entry.message || '')+'</div>'+(entry.details ? '<div style="margin-top:4px;font-family:monospace;font-size:11px;color:#999">'+escapeHtml(JSON.stringify(entry.details))+'</div>' : '')+'</div>'
    }).join('')
  }

  document.getElementById('telemetry-toggle').addEventListener('click', function(){
    const panel = document.getElementById('telemetry-panel')
    if (!panel) return
    const expanded = panel.style.display !== 'none'
    panel.style.display = expanded ? 'none' : 'block'
    this.setAttribute('aria-expanded', (!expanded).toString())
    if (!expanded) { connectTelemetry(); renderTelemetry() }
  })

    </script>
  </body>
</html>`

export default inspectorClientHtml
