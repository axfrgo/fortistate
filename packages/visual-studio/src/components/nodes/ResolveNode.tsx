/**
 * 🔄 RESOLVE Node - vX Ontogenetic Component
 * 
 * Automatic conflict resolution node that applies resolution strategies
 * when multiple conflicting states converge.
 * 
 * Strategies:
 * - merge: Combine properties from all inputs
 * - first-wins: Keep the first value encountered
 * - last-wins: Keep the last value encountered (overwrite)
 * - manual: User selects which input wins
 */

import { memo } from 'react'
import { Handle, Position } from 'reactflow'
import './OntogeneticNodes.css'

interface ResolveNodeData {
  entity: string
  strategy: 'merge' | 'first-wins' | 'last-wins' | 'manual'
  narrative?: string
  status?: 'idle' | 'executing' | 'success' | 'error'
  conflictCount?: number
  resolvedValue?: Record<string, unknown>
}

interface ResolveNodeProps {
  data: ResolveNodeData
  selected?: boolean
}

function ResolveNode({ data, selected }: ResolveNodeProps) {
  const { entity, strategy, narrative, status = 'idle', conflictCount = 0, resolvedValue } = data

  const strategyIcons: Record<string, string> = {
    'merge': '🔀',
    'first-wins': '🥇',
    'last-wins': '🏁',
    'manual': '👤'
  }

  const strategyLabels: Record<string, string> = {
    'merge': 'Merge',
    'first-wins': 'First Wins',
    'last-wins': 'Last Wins',
    'manual': 'Manual'
  }

  return (
    <div className={`ontogenetic-node resolve-node ${status} ${selected ? 'selected' : ''}`}>
      {/* Top Handle - receives multiple inputs */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="node-handle handle-target"
        style={{ background: '#f59e0b' }}
      />
      
      {/* Visual Metaphor - Conflict Resolution */}
      <div className="node-metaphor">
        <div className="resolve-icon spin-pulse">{strategyIcons[strategy]}</div>
        {conflictCount > 0 && (
          <div className="conflict-badge">{conflictCount}</div>
        )}
      </div>
      
      {/* Node Content */}
      <div className="node-content">
        <div className="node-header">
          <span className="node-type">RESOLVE</span>
          <span className="node-operator">{strategyLabels[strategy]}</span>
        </div>
        
        <div className="node-entity">{entity}</div>
        
        {narrative && (
          <div className="node-narrative">{narrative}</div>
        )}
        
        <div className="node-strategy">
          <strong>Strategy:</strong> {strategyLabels[strategy]}
        </div>
        
        {resolvedValue && (
          <div className="node-properties">
            {Object.entries(resolvedValue).slice(0, 2).map(([key, value]) => (
              <div key={key} className="property-item">
                <span className="property-key">{key}:</span>
                <span className="property-value">{JSON.stringify(value)}</span>
              </div>
            ))}
          </div>
        )}
        
        {status === 'executing' && (
          <div className="node-status">
            <div className="spinner"></div>
            <span>Resolving...</span>
          </div>
        )}
        
        {status === 'success' && (
          <div className="node-status success">
            ✅ Resolved
          </div>
        )}
        
        {status === 'error' && (
          <div className="node-status error">
            ❌ Failed
          </div>
        )}
      </div>
      
      {/* Bottom Handle - outputs resolved state */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="node-handle handle-source"
        style={{ background: '#10b981' }}
      />
    </div>
  )
}

export default memo(ResolveNode)
