import fs from 'fs'
import path from 'path'

export interface AuditEntry {
  time: string
  action: string
  sessionId?: string | null
  role?: string | null
  details?: Record<string, unknown>
}

export interface AuditOptions {
  rootDir: string
  rotationMaxSizeBytes?: number
  rotationMaxAgeDays?: number
  debug?: boolean
}

const AUDIT_FILE = '.fortistate-audit.log'

export class AuditLog {
  private readonly filePath: string
  private readonly rotationMaxSize: number
  private readonly rotationMaxAge: number
  private readonly debug: boolean

  constructor(options: AuditOptions) {
    this.filePath = path.resolve(options.rootDir, AUDIT_FILE)
    this.rotationMaxSize = options.rotationMaxSizeBytes ?? 1024 * 1024 // 1 MB
    this.rotationMaxAge = options.rotationMaxAgeDays ?? 30 // 30 days
    this.debug = Boolean(options.debug)
  }

  append(entry: AuditEntry): void {
    const enriched: AuditEntry = {
      ...entry,
      time: entry.time || new Date().toISOString(),
    }
    const line = JSON.stringify(enriched)
    try {
      this.rotateIfNeeded(line.length)
      fs.appendFileSync(this.filePath, line + '\n', 'utf-8')
    } catch (e) {
      if (this.debug) {
        // eslint-disable-next-line no-console
        console.error('[fortistate][audit] Failed to append audit entry:', e)
      }
    }
  }

  private rotateIfNeeded(incomingLength: number): void {
    try {
      const stats = fs.existsSync(this.filePath) ? fs.statSync(this.filePath) : null
      if (!stats) return

      // Check age-based rotation
      const ageMs = Date.now() - stats.mtimeMs
      const ageDays = ageMs / (1000 * 60 * 60 * 24)
      const shouldRotateByAge = ageDays >= this.rotationMaxAge

      // Check size-based rotation
      const shouldRotateBySize = stats.size + incomingLength > this.rotationMaxSize

      if (!shouldRotateByAge && !shouldRotateBySize) return

      const dir = path.dirname(this.filePath)
      const base = path.basename(this.filePath, '.log')
      const ts = new Date().toISOString().replace(/[:.]/g, '-')
      const target = path.join(dir, `${base}-${ts}.log`)
      fs.renameSync(this.filePath, target)
    } catch (e) {
      if (this.debug) {
        // eslint-disable-next-line no-console
        console.error('[fortistate][audit] Failed to rotate audit log:', e)
      }
    }
  }
}
