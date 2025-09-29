<template>
  <div class="card">
    <h2>Counter</h2>
    <div class="count">{{ state.count }}</div>
    <button class="btn" @click="inc">+1</button>
  </div>
</template>

<script setup>
import { createStore, useStore } from 'fortistate'

const counter = createStore({ count: 0 })
const [state, setState] = useStore(counter)
const inc = () => setState(s => ({ count: s.count + 1 }))
</script>

<script setup>
// attach websocket so inspector updates apply to this store in real time
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
          setState(incoming)
        } catch { }
      }
    } catch { }
  })
} catch {}
</script>

<style scoped>
.card{background:linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01));padding:16px;border-radius:10px;color:#eaf2ff;box-shadow:0 8px 30px rgba(2,6,23,0.6);max-width:300px}
.count{font-size:20px;font-weight:700;margin:8px 0}
.btn{background:#7c3aed;color:#fff;border:none;padding:8px 12px;border-radius:8px;cursor:pointer}
</style>
