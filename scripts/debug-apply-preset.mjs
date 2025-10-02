import createInspector from '../dist/inspector.js'
import http from 'http'

(async () => {
  process.on('uncaughtException', (err) => { console.error('UNCAUGHT', err && err.stack ? err.stack : err); })
  process.on('unhandledRejection', (r) => { console.error('UNHANDLEDREJ', r) })
  const port = 60001
  const srv = createInspector({ port, quiet: true })
  await srv.start()
  console.log('server started on', port)
  const body = JSON.stringify({ name: 'counter' })
  const req = http.request({ hostname: '127.0.0.1', port, method: 'POST', path: '/apply-preset', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } }, res => {
    let d = ''
    res.on('data', c => d += c)
    res.on('end', () => {
      console.log('RESPONSE', res.statusCode, d)
      srv.stop().then(() => console.log('server stopped')).catch(() => {})
    })
  })
  req.on('error', e => { console.error('REQERR', e); srv.stop().catch(()=>{}) })
  // no client timeout to allow server to finish
  req.write(body)
  req.end()
})().catch(e => console.error(e))
