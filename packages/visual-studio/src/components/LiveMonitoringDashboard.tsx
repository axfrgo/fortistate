/**
 * 🎬 Live Monitoring Dashboard
 * 
 * Real-time visualization of active universe executions.
 * 
 * 🌌 Cosmogenesis Principles:
 * - Autogenic self-monitoring (system observes itself)
 * - Emergent behavior tracking (execution as living process)
 * - Physics-based metrics (execution velocity, energy, momentum)
 */

import React, { useEffect, useState, useRef } from 'react'
import useStore from '../../../../src/useStore.js'
import { universeRegistryStore } from '../universes/universeRegistryStore'
import type { SavedUniverseSummary } from '../integrations/types'
import './LiveMonitoringDashboard.css'

interface ExecutionLog {
  id: string
  universeId: string
  universeName: string
  timestamp: number
  type: 'info' | 'success' | 'error' | 'warning'
  message: string
  nodeId?: string
  duration?: number
}

export const LiveMonitoringDashboard: React.FC = () => {
  const [registryState] = useStore(universeRegistryStore)
  const universes = registryState.universes || []
  const [logs, setLogs] = useState<ExecutionLog[]>([])
  const [filter, setFilter] = useState<'all' | 'errors' | 'info'>('all')
  const [autoScroll, setAutoScroll] = useState(true)
  const logsEndRef = useRef<HTMLDivElement>(null)

  // Get active (live/paused) universes
  const liveUniverses = universes.filter(
    (u: SavedUniverseSummary) => u.deploymentStatus === 'live' || u.deploymentStatus === 'paused'
  )

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs, autoScroll])

  // Subscribe to universe execution events (mock for now, would be WebSocket in production)
  useEffect(() => {
    // Simulate execution progress updates
    const interval = setInterval(() => {
      liveUniverses.forEach((universe: SavedUniverseSummary) => {
        if (universe.deploymentStatus === 'live') {
          // Simulate progress
          const now = Date.now()
          const logId = `log-${universe.id}-${now}`
          
          setLogs(prev => [
            ...prev.slice(-100), // Keep last 100 logs
            {
              id: logId,
              universeId: universe.id,
              universeName: universe.label,
              timestamp: now,
              type: Math.random() > 0.9 ? 'error' : Math.random() > 0.7 ? 'warning' : 'success',
              message: generateRandomLogMessage(),
              nodeId: `node-${Math.floor(Math.random() * 10)}`,
              duration: Math.random() * 500
            }
          ])
        }
      })
    }, 3000)

    return () => clearInterval(interval)
  }, [liveUniverses])

  const filteredLogs = logs.filter(log => {
    if (filter === 'all') return true
    if (filter === 'errors') return log.type === 'error'
    if (filter === 'info') return log.type === 'info' || log.type === 'success'
    return true
  })

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    })
  }

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
    return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`
  }

  return (
    <div className="live-monitoring-dashboard">
      <div className="lmd-header">
        <h2>🎬 Live Monitoring</h2>
        <div className="lmd-stats">
          <div className="lmd-stat">
            <span className="lmd-stat-value">{liveUniverses.length}</span>
            <span className="lmd-stat-label">Active Universes</span>
          </div>
          <div className="lmd-stat">
            <span className="lmd-stat-value">{logs.length}</span>
            <span className="lmd-stat-label">Total Events</span>
          </div>
          <div className="lmd-stat">
            <span className="lmd-stat-value">
              {logs.filter(l => l.type === 'error').length}
            </span>
            <span className="lmd-stat-label">Errors</span>
          </div>
        </div>
      </div>

      <div className="lmd-content">
        {/* Active Executions Panel */}
        <div className="lmd-executions">
          <h3>🌌 Active Universes</h3>
          
          {liveUniverses.length === 0 ? (
            <div className="lmd-empty">
              <p>No active universes</p>
              <p className="lmd-empty-hint">Launch a universe from the dashboard to see it here</p>
            </div>
          ) : (
            <div className="lmd-execution-list">
              {liveUniverses.map((universe: SavedUniverseSummary) => (
                <div key={universe.id} className="lmd-execution-card">
                  <div className="lmd-exec-header">
                    <div className="lmd-exec-title">
                      <span className="lmd-exec-icon">🌍</span>
                      <span className="lmd-exec-name">{universe.label}</span>
                    </div>
                    <div className={`lmd-exec-status lmd-status-${universe.deploymentStatus}`}>
                      {universe.deploymentStatus === 'live' ? '▶ LIVE' : '⏸ PAUSED'}
                    </div>
                  </div>
                  
                  <div className="lmd-exec-metrics">
                    <div className="lmd-metric">
                      <span className="lmd-metric-label">Uptime</span>
                      <span className="lmd-metric-value">
                        {universe.lastLaunchedAt 
                          ? formatDuration(Date.now() - new Date(universe.lastLaunchedAt).getTime())
                          : 'N/A'
                        }
                      </span>
                    </div>
                    <div className="lmd-metric">
                      <span className="lmd-metric-label">Version</span>
                      <span className="lmd-metric-value">v{universe.versionIds.length}</span>
                    </div>
                    <div className="lmd-metric">
                      <span className="lmd-metric-label">Status</span>
                      <span className="lmd-metric-value">{universe.deploymentStatus}</span>
                    </div>
                  </div>

                  {universe.deploymentStatus === 'live' && (
                    <div className="lmd-exec-activity">
                      <div className="lmd-activity-pulse"></div>
                      <span>Processing nodes...</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Logs Panel */}
        <div className="lmd-logs">
          <div className="lmd-logs-header">
            <h3>📋 Execution Logs</h3>
            <div className="lmd-logs-controls">
              <div className="lmd-filter-group">
                <button
                  className={`lmd-filter-btn ${filter === 'all' ? 'active' : ''}`}
                  onClick={() => setFilter('all')}
                >
                  All
                </button>
                <button
                  className={`lmd-filter-btn ${filter === 'info' ? 'active' : ''}`}
                  onClick={() => setFilter('info')}
                >
                  Info
                </button>
                <button
                  className={`lmd-filter-btn ${filter === 'errors' ? 'active' : ''}`}
                  onClick={() => setFilter('errors')}
                >
                  Errors
                </button>
              </div>
              
              <label className="lmd-autoscroll">
                <input
                  type="checkbox"
                  checked={autoScroll}
                  onChange={(e) => setAutoScroll(e.target.checked)}
                />
                Auto-scroll
              </label>
              
              <button
                className="lmd-clear-btn"
                onClick={() => setLogs([])}
              >
                Clear
              </button>
            </div>
          </div>

          <div className="lmd-logs-container">
            {filteredLogs.length === 0 ? (
              <div className="lmd-logs-empty">
                <p>No logs to display</p>
              </div>
            ) : (
              <div className="lmd-logs-content">
                {filteredLogs.map(log => (
                  <div key={log.id} className={`lmd-log-entry lmd-log-${log.type}`}>
                    <span className="lmd-log-time">{formatTime(log.timestamp)}</span>
                    <span className={`lmd-log-badge lmd-badge-${log.type}`}>
                      {log.type === 'error' ? '❌' : log.type === 'warning' ? '⚠️' : '✅'}
                    </span>
                    <span className="lmd-log-universe">[{log.universeName}]</span>
                    <span className="lmd-log-message">{log.message}</span>
                    {log.duration && (
                      <span className="lmd-log-duration">{log.duration.toFixed(0)}ms</span>
                    )}
                  </div>
                ))}
                <div ref={logsEndRef} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper to generate realistic log messages
function generateRandomLogMessage(): string {
  const messages = [
    'Executing BEGIN operator for entity "user"',
    'Node transformation complete',
    'External API call to OpenAI succeeded',
    'Slack notification sent',
    'Rate limit constraint applied',
    'Token refreshed successfully',
    'Ontogenetic fabric updated',
    'BECOME operator applied',
    'Entity state synchronized',
    'Paradox detected and resolved',
    'External integration binding executed',
    'Twitter post published',
    'Instagram media uploaded',
    'Anthropic Claude API response received'
  ]
  
  return messages[Math.floor(Math.random() * messages.length)]
}
