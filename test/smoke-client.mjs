import WebSocket from 'ws'
import fs from 'fs'
import http from 'http'

function wait(ms){return new Promise(r=>setTimeout(r,ms))}

async function wsRequestSnapshot(){
  return new Promise((resolve, reject) => {
    const ws = new WebSocket('ws://localhost:4555')
    const msgs = []
    ws.on('open', () => {
      // no-op
    })
    ws.on('message', (m) => {
      try {
        const d = JSON.parse(m.toString())
        msgs.push(d)
        if (d.type === 'snapshot'){
          ws.close()
          resolve(d)
        }
      } catch (e){ }
    })
    ws.on('error', (err) => reject(err))
    setTimeout(()=>reject(new Error('timeout')), 5000)
  })
}

async function registerRemote(){
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ key: 'smoke', initial: { value: 42 } })
    const req = http.request({ method: 'POST', port: 4555, host: '127.0.0.1', path: '/register', headers: { 'Content-Type': 'application/json' } }, (res) => {
      res.on('data', ()=>{})
      res.on('end', ()=>resolve(true))
    })
    req.on('error', reject)
    req.write(payload)
    req.end()
  })
}

async function run(){
  console.log('requesting initial snapshot')
  try{
    const s1 = await wsRequestSnapshot()
    console.log('initial snapshot stores:', Object.keys(s1.stores || {}).slice(0,10))
  } catch (e){ console.error('snapshot1 fail', e.message) }

  console.log('registering remote store')
  await registerRemote()
  await wait(300)

  console.log('requesting snapshot after register')
  try{
    const s2 = await wsRequestSnapshot()
    console.log('post-register snapshot stores:', Object.keys(s2.stores || {}))
    if (s2.stores && s2.stores.smoke) console.log('smoke store value:', s2.stores.smoke)
  } catch (e){ console.error('snapshot2 fail', e.message) }

  // check persistence file
  const pf = './.fortistate-remote-stores.json'
  try{
    if (fs.existsSync(pf)){
      console.log('persistence file exists; contents:', fs.readFileSync(pf,'utf-8'))
    } else console.log('persistence file not present')
  } catch (e){ console.error('persistence check failed', e.message) }
}

run().catch(e=>{ console.error(e); process.exit(1) })
