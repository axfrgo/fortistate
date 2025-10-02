import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { AuditLog, type AuditEntry } from '../src/audit.js'

describe('AuditLog', () => {
  let tempDir: string
  let auditLog: AuditLog

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'audit-test-'))
  })

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true })
    }
  })

  it('should append audit entries to log file', () => {
    auditLog = new AuditLog({ rootDir: tempDir })
    const entry: AuditEntry = {
      time: '2025-10-01T12:00:00.000Z',
      action: 'session:create',
      sessionId: 'test-session',
      role: 'editor',
      details: { foo: 'bar' },
    }

    auditLog.append(entry)

    const logPath = path.join(tempDir, '.fortistate-audit.log')
    expect(fs.existsSync(logPath)).toBe(true)

    const content = fs.readFileSync(logPath, 'utf-8')
    const parsed = JSON.parse(content.trim())
    expect(parsed.action).toBe('session:create')
    expect(parsed.sessionId).toBe('test-session')
    expect(parsed.role).toBe('editor')
  })

  it('should rotate log based on size', () => {
    const maxSize = 100 // Very small to trigger rotation
    auditLog = new AuditLog({
      rootDir: tempDir,
      rotationMaxSizeBytes: maxSize,
    })

    // Write entries until rotation occurs
    for (let i = 0; i < 10; i++) {
      auditLog.append({
        time: new Date().toISOString(),
        action: 'test:action',
        details: { iteration: i },
      })
    }

    const files = fs.readdirSync(tempDir)
    const rotatedFiles = files.filter((f) => f.startsWith('.fortistate-audit-') && f.endsWith('.log'))
    expect(rotatedFiles.length).toBeGreaterThan(0)
  })

  it('should rotate log based on age', () => {
    const logPath = path.join(tempDir, '.fortistate-audit.log')
    
    // Create an old log file
    fs.writeFileSync(logPath, '{"action":"old:entry","time":"2020-01-01T00:00:00.000Z"}\n')
    
    // Set the modification time to 60 days ago
    const sixtyDaysAgo = Date.now() - 60 * 24 * 60 * 60 * 1000
    fs.utimesSync(logPath, new Date(sixtyDaysAgo), new Date(sixtyDaysAgo))

    auditLog = new AuditLog({
      rootDir: tempDir,
      rotationMaxAgeDays: 30, // 30 days
    })

    auditLog.append({
      time: new Date().toISOString(),
      action: 'new:entry',
    })

    const files = fs.readdirSync(tempDir)
    const rotatedFiles = files.filter((f) => f.startsWith('.fortistate-audit-') && f.endsWith('.log'))
    expect(rotatedFiles.length).toBe(1) // Old file should be rotated

    // New log should contain only new entry
    const newContent = fs.readFileSync(logPath, 'utf-8')
    expect(newContent).toContain('new:entry')
    expect(newContent).not.toContain('old:entry')
  })

  it('should not rotate when under both thresholds', () => {
    auditLog = new AuditLog({
      rootDir: tempDir,
      rotationMaxSizeBytes: 1024 * 1024, // 1 MB
      rotationMaxAgeDays: 30,
    })

    auditLog.append({
      time: new Date().toISOString(),
      action: 'test:action',
    })

    const files = fs.readdirSync(tempDir)
    const rotatedFiles = files.filter((f) => f.startsWith('.fortistate-audit-') && f.endsWith('.log'))
    expect(rotatedFiles.length).toBe(0)
  })

  it('should handle missing log file gracefully', () => {
    auditLog = new AuditLog({ rootDir: tempDir })
    
    // Should not throw
    expect(() => {
      auditLog.append({
        time: new Date().toISOString(),
        action: 'first:entry',
      })
    }).not.toThrow()

    const logPath = path.join(tempDir, '.fortistate-audit.log')
    expect(fs.existsSync(logPath)).toBe(true)
  })

  it('should enrich entries with timestamp if missing', () => {
    auditLog = new AuditLog({ rootDir: tempDir })
    
    auditLog.append({
      action: 'test:action',
      time: '', // Empty time should be enriched
    })

    const logPath = path.join(tempDir, '.fortistate-audit.log')
    const content = fs.readFileSync(logPath, 'utf-8')
    const parsed = JSON.parse(content.trim())
    
    expect(parsed.time).toBeTruthy()
    expect(parsed.time).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  it('should use default rotation values', () => {
    auditLog = new AuditLog({ rootDir: tempDir })
    
    // Should use defaults: 1 MB size, 30 days age
    // This is implicit - just verify construction doesn't throw
    expect(auditLog).toBeDefined()
  })

  it('should handle rotation errors gracefully with debug off', () => {
    auditLog = new AuditLog({
      rootDir: '/nonexistent/path/that/does/not/exist',
      debug: false,
    })

    // Should not throw even if rotation fails
    expect(() => {
      auditLog.append({
        time: new Date().toISOString(),
        action: 'test:action',
      })
    }).not.toThrow()
  })
})
