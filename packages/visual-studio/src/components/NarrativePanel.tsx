import { useState, useEffect } from 'react'
import type { Node, Edge } from 'reactflow'
import './NarrativePanel.css'

interface NarrativePanelProps {
  nodes: Node[]
  edges: Edge[]
  isExecuting: boolean
  onExecute?: () => void
}

interface NarrativeEvent {
  id: string
  timestamp: number
  metaphor: string
  icon: string
  entity: string
  action: string
  status: 'pending' | 'executing' | 'complete' | 'error'
}

// @ts-expect-error - edges parameter reserved for future edge-based narrative features
export default function NarrativePanel({ nodes, edges, isExecuting, onExecute }: NarrativePanelProps) {
  const [narrative, setNarrative] = useState<NarrativeEvent[]>([])
  const [autoScroll, setAutoScroll] = useState(true)

  const canExecute = nodes.length > 0 && !isExecuting

  useEffect(() => {
    // Generate narrative events from nodes
    const events: NarrativeEvent[] = nodes.map((node, index) => {
      let metaphor = ''
      let icon = ''
      let action = ''

      switch (node.type) {
        case 'begin':
          metaphor = 'Seed'
          icon = '🌱'
          action = node.data.narrative || `${node.data.entity} begins with ${JSON.stringify(node.data.properties)}`
          break
        case 'become':
          metaphor = 'Flow'
          icon = '🌊'
          action = node.data.narrative || `${node.data.entity} transforms: ${node.data.transform}`
          break
        case 'cease':
          metaphor = 'Boundary'
          icon = '🧱'
          action = node.data.narrative || `${node.data.entity} boundary: ${node.data.condition} → ${node.data.action}`
          break
        case 'transcend':
          metaphor = 'Portal'
          icon = '🌀'
          action = node.data.narrative || `${node.data.entity} transcends to ${node.data.portal}`
          break
        default:
          metaphor = 'Law'
          icon = '⚖️'
          action = `Execute ${node.data.name}`
      }

      return {
        id: node.id,
        timestamp: Date.now() + index * 100,
        metaphor,
        icon,
        entity: node.data.entity || node.data.name || 'unknown',
        action,
        status: node.data.status || 'pending'
      }
    })

    setNarrative(events)
  }, [nodes])

  const handleClearNarrative = () => {
    setNarrative([])
  }

  return (
    <div className="narrative-panel">
      <div className="narrative-header">
        <div className="narrative-title">
          <span className="narrative-icon">📖</span>
          <h3>Execution Narrative</h3>
          {nodes.length > 0 && (
            <div className="operator-count">{nodes.length}</div>
          )}
        </div>
        <div className="narrative-controls">
          {onExecute && (
            <button 
              className={`control-btn execute-btn ${canExecute ? '' : 'disabled'}`}
              onClick={() => canExecute && onExecute()}
              disabled={!canExecute}
              title="Execute ontogenetic graph"
            >
              {isExecuting ? '⚡' : '▶️'}
            </button>
          )}
          <button 
            className={`control-btn ${autoScroll ? 'active' : ''}`}
            onClick={() => setAutoScroll(!autoScroll)}
            title="Auto-scroll"
          >
            {autoScroll ? '📜' : '📄'}
          </button>
          <button 
            className="control-btn"
            onClick={handleClearNarrative}
            title="Clear narrative"
          >
            🗑️
          </button>
        </div>
      </div>

      <div className="narrative-timeline">
        {narrative.length === 0 ? (
          <div className="narrative-empty">
            <span className="empty-icon">🌌</span>
            <p>No narrative yet...</p>
            <p className="empty-hint">Click "Load Example" or drag operators to the canvas</p>
          </div>
        ) : (
          narrative.map((event, index) => (
            <div 
              key={event.id} 
              className={`narrative-event ${event.status}`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="event-timeline">
                <div className="event-dot"></div>
                {index < narrative.length - 1 && <div className="event-line"></div>}
              </div>
              <div className="event-content">
                <div className="event-header">
                  <span className="event-icon">{event.icon}</span>
                  <span className="event-metaphor">{event.metaphor}</span>
                  <span className="event-entity">{event.entity}</span>
                  <span className={`event-status ${event.status}`}>
                    {event.status === 'executing' && '⚡'}
                    {event.status === 'complete' && '✓'}
                    {event.status === 'error' && '✗'}
                  </span>
                </div>
                <div className="event-action">{event.action}</div>
              </div>
            </div>
          ))
        )}
      </div>

      {isExecuting && (
        <div className="narrative-executing">
          <div className="executing-spinner"></div>
          <span>Executing ontogenetic operators...</span>
        </div>
      )}
    </div>
  )
}
