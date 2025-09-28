import { fileURLToPath, pathToFileURL } from 'url'
import path from 'path'

const pkgRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const loaderPath = pathToFileURL(path.resolve(pkgRoot, 'dist', 'loader.js')).href

async function run() {
  const loader = await import(loaderPath)
  // debug: inspect resolved config first
  const cfgModule = await import(pathToFileURL(path.resolve(pkgRoot, 'dist', 'config.js')).href)
  const resolved = cfgModule.default(path.resolve(pkgRoot, 'examples'))
  console.log('resolved config debug:', resolved)
  const result = await loader.loadPlugins(path.resolve(pkgRoot, 'examples'))
  console.log('load result:', result)
  const { getRegistered } = await import(pathToFileURL(path.resolve(pkgRoot, 'dist', 'plugins.js')).href)
  console.log('registered stores:', getRegistered())
  if (!getRegistered().example) {
    console.error('example store not registered')
    process.exitCode = 2
  } else {
    console.log('plugin smoke test: OK')
  }
}

run().catch(err => {
  console.error(err)
  process.exit(1)
})
