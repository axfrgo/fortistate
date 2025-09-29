import fs from 'fs'
import path from 'path'
import { globalStoreFactory } from './storeFactory.js'

export type Preset = {
  name: string
  description?: string
  initial: any
  css?: string
}

const presets = new Map<string, Preset>()

export function registerPreset(name: string, preset: Omit<Preset, 'name'>) {
  presets.set(name, Object.assign({ name }, preset))
}

export function getPreset(name: string): Preset | undefined {
  return presets.get(name)
}

export function listPresets(): string[] {
  return Array.from(presets.keys())
}

export function listPresetObjects(): Array<{ name: string; description?: string }> {
  return Array.from(presets.values()).map(p => ({ name: p.name, description: p.description }))
}

// Apply a preset: create a store with the preset initial value (or overwrite)
export function applyPreset(name: string, targetKey?: string) {
  const p = presets.get(name)
  if (!p) throw new Error('preset not found: ' + name)
  const key = targetKey || name
  try {
    const existing = globalStoreFactory.get(key)
    if (existing) existing.set(p.initial)
    else globalStoreFactory.create(key, { value: p.initial })
  } catch (e) {
    // best-effort
  }
  return { key, css: p.css }
}

// Write a preset's CSS into the given directory (safe, no overwrite by default)
export function installPresetCss(name: string, destDir: string, options: { overwrite?: boolean } = {}) {
  const p = presets.get(name)
  if (!p || !p.css) return false
  const fileName = `${name}.fortistate.css`
  const dest = path.resolve(destDir, fileName)
  if (fs.existsSync(dest) && !options.overwrite) return false
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  fs.writeFileSync(dest, p.css, 'utf-8')
  return dest
}

// register a small built-in couple presets (example)
registerPreset('counter', {
  description: 'Simple numeric counter preset',
  initial: { value: 0 },
  css: `.fortistate-counter { font-weight: 700; font-size: 1.25rem; } .fortistate-counter .btn { background: #3b82f6; color: #fff; padding: 6px 10px; border-radius: 6px; }`
})

registerPreset('todo-list', {
  description: 'Sample todo list with nested items',
  initial: { todos: [{ id: 1, text: 'Buy milk', done: false }, { id: 2, text: 'Write tests', done: false }], nextId: 3 },
  css: `.fortistate-todo { font-family: sans-serif } .fortistate-todo .done { text-decoration: line-through; color:#888 }`
})

registerPreset('auth-user', {
  description: 'Authenticated user profile sample',
  initial: { user: { id: 'u_1', name: 'Alice', email: 'alice@example.com', roles: ['admin'] }, loggedIn: true },
  css: `.fortistate-auth { color:#111 }`
})

registerPreset('theme-sample', {
  description: 'Theme toggle sample',
  initial: { theme: 'light', palette: { primary: '#06b6d4', accent: '#ea580c' } },
  css: `.fortistate-theme { padding:8px; border-radius:6px }`
})

export default { registerPreset, getPreset, listPresets, listPresetObjects, applyPreset, installPresetCss }
