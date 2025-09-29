#!/usr/bin/env node
// Minimal CLI scaffold for fortistate
import { fileURLToPath } from 'url'
import path from 'path'
import loadPlugins from './loader.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function main(argv = process.argv.slice(2)) {
  const cmd = argv[0] || 'help'
  if (cmd === 'help') {
    console.log('fortistate — CLI')
    console.log('Commands:')
    console.log('  init     Create an example fortistate.config.js')
    console.log('  build    Run compilation or JIT (placeholder)')
    console.log('  inspect  Start inspector (placeholder)')
    return
  }

  if (cmd === 'init') {
    // create a sample config in CWD
    const dest = path.resolve(process.cwd(), 'fortistate.config.js')
    const sample = `module.exports = { presets: [], plugins: [] }`;
    try {
      await import('fs/promises').then(fs => fs.writeFile(dest, sample, { flag: 'wx' }))
      console.log('Created', dest)
    } catch (err) {
      // err is unknown in TS; stringify safely
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      console.error('Could not create config:', (err && typeof err === 'object' && 'message' in err) ? (err as any).message : String(err))
      process.exit(1)
    }
    return
  }

  if (cmd === 'load') {
    const dir = argv[1] ? path.resolve(process.cwd(), argv[1]) : process.cwd()
    console.log('Loading plugins from', dir)
    try {
      const res = await loadPlugins(dir)
      console.log('plugins loaded:', res)
      process.exit(0)
    } catch (err) {
      console.error('Error loading plugins:', (err && typeof err === 'object' && 'message' in err) ? (err as any).message : String(err))
      process.exit(1)
    }
  }

  if (cmd === 'dev') {
    // start jit dev server
    const { default: createJitServer } = await import('./jit-server.js')
    // parse optional flags: [port] and --quiet
    const port = argv[1] && !argv[1].startsWith('--') ? Number(argv[1]) : undefined
    const quiet = argv.includes('--quiet')
  const jit = (createJitServer as any)({ port, quiet })
    await jit.start()
    console.log('Press Ctrl+C to stop')
    process.on('SIGINT', async () => {
      console.log('Stopping...')
      await jit.stop()
      process.exit(0)
    })
    return
  }

  if (cmd === 'inspect') {
    const { default: createInspector } = await import('./inspector.js')
    const port = argv[1] && !argv[1].startsWith('--') ? Number(argv[1]) : undefined
    const quiet = argv.includes('--quiet')
    // parse --token <token> and --allow-origin <origin> (can be repeated comma-separated)
    const tokenFlagIndex = argv.indexOf('--token')
    const token = tokenFlagIndex >= 0 ? argv[tokenFlagIndex + 1] : undefined
    const allowOriginFlagIndex = argv.indexOf('--allow-origin')
    const allowOrigin = allowOriginFlagIndex >= 0 ? argv[allowOriginFlagIndex + 1] : undefined
    const allowOriginStrict = argv.includes('--allow-origin-strict')
    const devClientFlagIndex = argv.indexOf('--dev-client')
    const devClient = devClientFlagIndex >= 0 || process.env.FORTISTATE_INSPECTOR_DEV_CLIENT === '1'
    const hostFlagIndex = argv.indexOf('--host')
    const host = hostFlagIndex >= 0 ? argv[hostFlagIndex + 1] : undefined
  const srv = (createInspector as any)({ port, quiet, token, allowOrigin, allowOriginStrict, devClient, host })
    await srv.start()
    if (!quiet) console.log('Inspector running - open http://localhost:' + (port || 4000))
    process.on('SIGINT', async () => {
      await srv.stop()
      process.exit(0)
    })
    return
  }

  console.log('Command not implemented:', cmd)
  process.exit(2)
}

// If invoked directly (ts or compiled js), run main
if (process.argv[1] && (process.argv[1].endsWith('cli.ts') || process.argv[1].endsWith('cli.js'))) {
  main().catch(err => {
    console.error(err)
    process.exit(1)
  })
}

export default main
