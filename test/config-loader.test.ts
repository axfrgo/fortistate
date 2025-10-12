import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { tmpdir } from 'os'
import { fileURLToPath } from 'url'
import { createInspectorServer as createInspector } from '../src/inspector'

const here = path.dirname(fileURLToPath(import.meta.url))

function setupExampleConfig() {
  const dir = fs.mkdtempSync(path.join(tmpdir(), 'fortistate-config-'))
  const configSrc = path.resolve(here, '..', 'examples', 'fortistate.config.cjs')
  const presetSrc = path.resolve(here, '..', 'examples', 'presets', 'example-preset', 'index.cjs')
  const configDest = path.resolve(dir, 'fortistate.config.cjs')
  const presetDestDir = path.resolve(dir, 'presets', 'example-preset')
  fs.mkdirSync(presetDestDir, { recursive: true })
  const presetDest = path.resolve(presetDestDir, 'index.cjs')
  fs.copyFileSync(configSrc, configDest)
  fs.copyFileSync(presetSrc, presetDest)
  return { dir, configDest, presetDest }
}

async function waitForCondition<T>(fn: () => Promise<T>, check: (value: T) => boolean, timeout = 4000, interval = 100): Promise<T> {
  const deadline = Date.now() + timeout
  let last: T
  do {
    last = await fn()
    if (check(last)) return last
    await new Promise(res => setTimeout(res, interval))
  } while (Date.now() < deadline)
  throw new Error('timeout')
}

describe('inspector config loader', () => {
  it('loads plugin stores from config on startup', async () => {
  const { dir } = setupExampleConfig()
    const port = 4781
    const srv = createInspector({ port, quiet: true, cwd: dir })
    try {
      await srv.start()
      const stores = await waitForCondition(
        () => fetch(`http://localhost:${port}/remote-stores`).then(r => r.json()),
        (js: Record<string, any>) => Boolean(js.example && js.example.hello === 'world')
      )
      expect(stores.example).toEqual({ hello: 'world' })
    } finally {
      await srv.stop().catch(() => {})
      fs.rmSync(dir, { recursive: true, force: true })
    }
  })

  it('reloads plugin store changes when presets update', async () => {
    const { dir, presetDest } = setupExampleConfig()
    const port = 4782
    const srv = createInspector({ port, quiet: true, cwd: dir })
    try{
      await srv.start()
      await waitForCondition(
        () => fetch(`http://localhost:${port}/remote-stores`).then(r => r.json()),
        (js: Record<string, any>) => Boolean(js.example)
      )
      const updatedPreset = `module.exports = function examplePreset() {\n  return {\n    plugins: [\n      function registerExample(api) {\n        api.registerStore('example', { hello: 'universe' })\n      }\n    ]\n  }\n}`
      fs.writeFileSync(presetDest, updatedPreset, 'utf-8')
      const stores = await waitForCondition(
        () => fetch(`http://localhost:${port}/remote-stores`).then(r => r.json()),
        (js: Record<string, any>) => js.example && js.example.hello === 'universe'
      )
      expect(stores.example.hello).toBe('universe')
    } finally {
      await srv.stop().catch(() => {})
      fs.rmSync(dir, { recursive: true, force: true })
    }
  })

  it('removes plugin stores when config stops including them', async () => {
    const { dir, configDest } = setupExampleConfig()
    const port = 4783
    const srv = createInspector({ port, quiet: true, cwd: dir })
    try {
      await srv.start()
      await waitForCondition(
        () => fetch(`http://localhost:${port}/remote-stores`).then(r => r.json()),
        (js: Record<string, any>) => Boolean(js.example)
      )
      const newConfig = `module.exports = { presets: [], plugins: [] }`
      fs.writeFileSync(configDest, newConfig, 'utf-8')
      const stores = await waitForCondition(
        () => fetch(`http://localhost:${port}/remote-stores`).then(r => r.json()),
        (js: Record<string, any>) => !('example' in js)
      )
      expect(stores.example).toBeUndefined()
    } finally {
      await srv.stop().catch(() => {})
      fs.rmSync(dir, { recursive: true, force: true })
    }
  })
})
