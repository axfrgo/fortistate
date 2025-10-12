/**
 * 🌱 BEGIN Node (Seed) - vX Ontogenetic Component
 * 
 * Visual representation of the BEGIN operator.
 * Metaphor: A seed sprouting into existence.
 */

import { memo } from 'react'
import { Handle, Position } from 'reactflow'
import './OntogeneticNodes.css'

interface BeginNodeData {
  entity: string
  properties: Record<string, unknown>
  narrative?: string
  status?: 'idle' | 'executing' | 'success' | 'error'
}

interface BeginNodeProps {
  data: BeginNodeData
  selected?: boolean
}

function BeginNode({ data, selected }: BeginNodeProps) {
  const { entity, properties = {}, narrative, status = 'idle' } = data

  return (
    <div className={`ontogenetic-node begin-node ${status} ${selected ? 'selected' : ''}`}>
      {/* Top Handle - receives nothing (seeds are origins) */}
      
      {/* Visual Metaphor */}
      <div className="node-metaphor">
        <div className="seed-icon pulse">🌱</div>
      </div>
      
      {/* Node Content */}
      <div className="node-content">
        <div className="node-header">
          <span className="node-type">BEGIN</span>
          <span className="node-operator">Seed</span>
        </div>
        
        <div className="node-entity">{entity}</div>
        
        {narrative && (
          <div className="node-narrative">{narrative}</div>
        )}
        
        <div className="node-properties">
          {Object.entries(properties).slice(0, 3).map(([key, value]) => (
            <div key={key} className="property-item">
              <span className="prop-key">{key}:</span>
              <span className="prop-value">{String(value)}</span>
            </div>
          ))}
          {Object.keys(properties).length > 3 && (
            <div className="property-more">
              +{Object.keys(properties).length - 3} more
            </div>
          )}
        </div>
      </div>
      
      {/* Status Indicator */}
      {status !== 'idle' && (
        <div className={`status-indicator ${status}`}>
          {status === 'executing' && '⚡'}
          {status === 'success' && '✓'}
          {status === 'error' && '✗'}
        </div>
      )}
      
      {/* Bottom Handle - outputs to next nodes */}
      <Handle 
        type="source" 
        position={Position.Bottom} 
        id="out"
        className="handle-source"
      />
    </div>
  )
}

export default memo(BeginNode)
