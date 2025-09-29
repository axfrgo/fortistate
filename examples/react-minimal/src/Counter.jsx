import React from 'react'
import { createStore, useStore } from 'fortistate'

const counter = createStore({ count: 0 })

export default function Counter(){
  // use the store created above; useStore returns [state, set]
  const [state, setState] = useStore(counter)
  const cardStyle = {
    background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))',
    padding: 18,
    borderRadius: 12,
    boxShadow: '0 8px 30px rgba(2,6,23,0.6)',
    color: '#eaf2ff',
    maxWidth: 360,
  }

  const btn = {
    background: '#7c3aed',
    color: 'white',
    border: 'none',
    padding: '8px 12px',
    borderRadius: 8,
    cursor: 'pointer',
    marginTop: 10,
  }

  return (
    <div style={cardStyle}>
      <h2 style={{margin:0}}>Counter</h2>
      <div style={{marginTop:8,fontSize:20,fontWeight:600}}>{state.count}</div>
      <div style={{marginTop:10}}>
        <button style={btn} onClick={() => setState(s => ({ count: s.count + 1 }))}>+1</button>
      </div>
    </div>
  )
}

// attach a shared websocket listener so inspector-driven changes update this store in real time
try {
  const ws = new WebSocket('ws://localhost:4000')
  ws.addEventListener('message', (ev) => {
    try {
      const data = JSON.parse(ev.data)
      if (data && data.type === 'store:change' && data.key === 'counter') {
        try {
          let incoming = data.value
          if (typeof incoming === 'number') incoming = { value: incoming }
          else if (incoming && typeof incoming === 'object') {
            if (typeof incoming.value !== 'number' && typeof incoming.count !== 'number') {
              const n = Number(incoming)
              if (Number.isFinite(n)) incoming = { value: n }
            }
          } else {
            const n = Number(incoming)
            incoming = { value: Number.isFinite(n) ? n : 0 }
          }
          counter.set(incoming)
        } catch { }
      }
    } catch { }
  })
} catch {
  // best-effort in examples
}
