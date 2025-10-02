import { createInspectorServer } from '../dist/inspector.js'
import net from 'net'
import http from 'http'
import fs from 'fs'
import path from 'path'

async function main(){
  const cwd = fs.mkdtempSync(path.join((process.env.TMPDIR||process.env.TEMP||'.'), 'fgt-'))
  const port = 54001
  const srv = createInspectorServer({ port, quiet: false, cwd })
  await srv.start()
  // wait for port
  await new Promise((res) => setTimeout(res, 200))
  console.log('server started on', port)
  const body = JSON.stringify({ role: 'editor' })
  const req = http.request({ hostname: '127.0.0.1', port, method: 'POST', path: '/session/create', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } }, (res) => {
    let buf=''
    res.on('data', c=>buf+=c)
    res.on('end', ()=>{ console.log('response', res.statusCode, buf); srv.stop().then(()=>process.exit(0)) })
  })
  req.on('error', (e)=>{ console.error('request error', e); srv.stop().then(()=>process.exit(1)) })
  req.write(body)
  req.end()
}
main()
