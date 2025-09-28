import path from 'path'
import createJitServer from '../dist/jit.js'
import { loadPlugins } from '../dist/loader.js'
import { globalStoreFactory } from '../dist/storeFactory.js'

async function run() {
  const jit = createJitServer({ port: 3333 })
  await jit.start()

  // load example config in examples/
  const repoRoot = path.resolve(new URL('..', import.meta.url).pathname)
  const examplesDir = path.resolve(repoRoot, '..', 'examples')
  const configFile = path.resolve(repoRoot, '..', 'examples', 'fortistate.config.cjs')
  // load plugin(s) by passing the examples directory as cwd
  const result = await loadPlugins(path.dirname(configFile))
  // ensure at least one plugin loaded
  // create a new store programmatically to exercise create event
  globalStoreFactory.create('jit-test', { value: 1 })
  // update it to fire change
  const s = globalStoreFactory.get('jit-test')
  if (s) s.set({ value: 2 })

  // quick wait for console logs
  await new Promise((r) => setTimeout(r, 200))
  await jit.stop()

  // eslint-disable-next-line no-console
  console.log('jit smoke finished', result)
}

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('jit smoke failed', err)
  process.exit(1)
})
