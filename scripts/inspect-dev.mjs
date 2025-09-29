#!/usr/bin/env node
// Minimal dev watcher that restarts the inspector on file changes.
import { spawn } from 'child_process'
import chokidar from 'chokidar'
import path from 'path'

const projectRoot = process.cwd()
let child = null

function start() {
  stop()
  // Prefer built CLI if available, else run ts-node loader
  const built = path.join(projectRoot, 'dist', 'cli.js')
  const useBuilt = false
  const cmd = useBuilt ? 'node' : 'node'
  const args = useBuilt ? [built, 'inspect'] : ['--loader', 'ts-node/esm', 'src/cli.ts', 'inspect']
  child = spawn(cmd, args, { stdio: 'inherit', shell: true })
}

function stop() {
  if (child && !child.killed) {
    try { child.kill() } catch (e) { }
    child = null
  }
}

start()

const watcher = chokidar.watch(['src/**/*.ts', 'src/**/*.js', 'dist/**/*.js'], { ignoreInitial: true })
watcher.on('all', (evt, p) => {
  console.log('[inspect-dev] change detected:', evt, p)
  start()
})

process.on('SIGINT', () => { stop(); process.exit(0) })
process.on('SIGTERM', () => { stop(); process.exit(0) })
