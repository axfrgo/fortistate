import { createInspectorServer } from '../dist/inspector.js'
import fs from 'fs'
import path from 'path'
import { tmpdir } from 'os'
const cwd = fs.mkdtempSync(path.join(tmpdir(), 'fi-'))
const port = 54123
const srv = createInspectorServer({ port, quiet: false, cwd })
await srv.start()
console.log('inspector running', port, cwd)
// keep process alive
setInterval(()=>{}, 1<<30)
