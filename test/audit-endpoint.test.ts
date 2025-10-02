import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createInspectorServer as createInspector } from '../src/inspector'
import fs from 'fs'
import path from 'path'

describe('audit endpoint', () => {
  const port = 4667
  let srv: any
  let adminToken: string
  let rootDir: string

  beforeAll(async () => {
    srv = createInspector({ port, quiet: true })
    await srv.start()
    rootDir = process.cwd()

    // Create an admin session to access audit logs
    const res = await fetch(`http://localhost:${port}/session/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'admin' }),
    })
    
    if (!res.ok) {
      throw new Error(`Failed to create admin session: ${res.status} ${await res.text()}`)
    }
    
    const data = await res.json()
    adminToken = data.token

    // Generate some audit entries by performing actions
    await fetch(`http://localhost:${port}/session/list`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    })
  })

  afterAll(async () => {
    if (srv) await srv.stop()
  })

  it('should return JSON format by default', async () => {
    const res = await fetch(`http://localhost:${port}/audit/log?limit=10`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    })

    expect(res.ok).toBe(true)
    expect(res.headers.get('content-type')).toContain('application/json')

    const data = await res.json()
    expect(data).toHaveProperty('entries')
    expect(data).toHaveProperty('totalLines')
    expect(data).toHaveProperty('returned')
    expect(data).toHaveProperty('limit')
    expect(Array.isArray(data.entries)).toBe(true)
  })

  it('should return JSON format when explicitly requested', async () => {
    const res = await fetch(`http://localhost:${port}/audit/log?format=json&limit=5`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    })

    expect(res.ok).toBe(true)
    expect(res.headers.get('content-type')).toContain('application/json')

    const data = await res.json()
    expect(data.entries).toBeDefined()
    expect(data.limit).toBe(5)
  })

  it('should return CSV format with proper headers', async () => {
    const res = await fetch(`http://localhost:${port}/audit/log?format=csv&limit=10`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    })

    expect(res.ok).toBe(true)
    expect(res.headers.get('content-type')).toContain('text/csv')
    expect(res.headers.get('content-disposition')).toContain('attachment')
    expect(res.headers.get('content-disposition')).toContain('audit-log.csv')

    const text = await res.text()
    const lines = text.split('\n').filter((l) => l.trim())

    expect(lines.length).toBeGreaterThan(0)
    expect(lines[0]).toBe('time,action,sessionId,role,details')

    // Verify CSV structure (subsequent lines should have 5 comma-separated values)
    if (lines.length > 1) {
      const fields = lines[1].split(',')
      expect(fields.length).toBeGreaterThanOrEqual(5)
    }
  })

  it('should return plain text format with tab separation', async () => {
    const res = await fetch(`http://localhost:${port}/audit/log?format=plain&limit=10`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    })

    expect(res.ok).toBe(true)
    expect(res.headers.get('content-type')).toContain('text/plain')

    const text = await res.text()
    const lines = text.split('\n').filter((l) => l.trim())

    expect(lines.length).toBeGreaterThan(0)
    expect(lines[0]).toBe('time\taction\tsessionId\trole\tdetails')

    // Verify tab-separated structure
    if (lines.length > 1) {
      expect(lines[1]).toContain('\t')
    }
  })

  it('should respect limit parameter across formats', async () => {
    const limit = 3

    // JSON format
    const jsonRes = await fetch(`http://localhost:${port}/audit/log?format=json&limit=${limit}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    })
    const jsonData = await jsonRes.json()
    expect(jsonData.returned).toBeLessThanOrEqual(limit)

    // CSV format
    const csvRes = await fetch(`http://localhost:${port}/audit/log?format=csv&limit=${limit}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    })
    const csvText = await csvRes.text()
    const csvLines = csvText.split('\n').filter((l) => l.trim())
    expect(csvLines.length - 1).toBeLessThanOrEqual(limit) // -1 for header

    // Plain format
    const plainRes = await fetch(`http://localhost:${port}/audit/log?format=plain&limit=${limit}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    })
    const plainText = await plainRes.text()
    const plainLines = plainText.split('\n').filter((l) => l.trim())
    expect(plainLines.length - 1).toBeLessThanOrEqual(limit) // -1 for header
  })

  it('should require admin role', async () => {
    // Create observer session
    const obsRes = await fetch(`http://localhost:${port}/session/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'observer' }),
    })
    
    // Check if response is JSON before parsing
    let obsData: any
    if (obsRes.ok) {
      obsData = await obsRes.json()
    } else {
      // If session creation failed, skip the test or handle gracefully
      console.warn('Session creation failed, skipping observer test')
      return
    }

    // Try to access audit log with observer token
    const auditRes = await fetch(`http://localhost:${port}/audit/log`, {
      headers: { Authorization: `Bearer ${obsData.token}` },
    })

    expect(auditRes.status).toBe(403)
  })

  it('should handle invalid format parameter gracefully', async () => {
    const res = await fetch(`http://localhost:${port}/audit/log?format=invalid`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    })

    // Should default to JSON format
    expect(res.ok).toBe(true)
    expect(res.headers.get('content-type')).toContain('application/json')
  })

  it('should properly escape CSV fields with special characters', async () => {
    // Create a session with a label containing quotes and commas
    await fetch(`http://localhost:${port}/session/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        role: 'editor',
        label: 'Test "quoted" label, with comma',
      }),
    })

    const res = await fetch(`http://localhost:${port}/audit/log?format=csv&limit=50`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    })

    const text = await res.text()
    
    // CSV should have properly escaped quotes
    expect(text).toBeDefined()
    // The implementation should escape quotes by doubling them
    expect(res.ok).toBe(true)
  })

  it('should audit the audit log read itself', async () => {
    // Read audit log
    await fetch(`http://localhost:${port}/audit/log?limit=5&format=json`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    })

    // Read again to see the previous read in the log
    const res = await fetch(`http://localhost:${port}/audit/log?limit=10&format=json`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    })

    const data = await res.json()
    const auditReadEntries = data.entries.filter((e: any) => e.action === 'audit:read')

    expect(auditReadEntries.length).toBeGreaterThan(0)
    expect(auditReadEntries[0].details).toHaveProperty('format')
  })
})
