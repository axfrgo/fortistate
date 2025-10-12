/**
 * 🌊 BECOME Node (Flow) - vX Ontogenetic Component
 * 
 * Visual representation of the BECOME operator.
 * Metaphor: A flowing transformation.
 */

import { memo } from 'react'
import { Handle, Position } from 'reactflow'
import './OntogeneticNodes.css'

interface BecomeNodeData {
  entity: string
  transform: string
  trigger?: string
  narrative?: string
  status?: 'idle' | 'executing' | 'success' | 'error'
}

interface BecomeNodeProps {
  data: BecomeNodeData
  selected?: boolean
}

function BecomeNode({ data, selected }: BecomeNodeProps) {
  const { entity, transform, trigger, narrative, status = 'idle' } = data

  return (
    <div className={`ontogenetic-node become-node ${status} ${selected ? 'selected' : ''}`}>
      {/* Top Handle - receives from previous nodes */}
      <Handle 
        type="target" 
        position={Position.Top} 
        id="in"
        className="handle-target"
      />
      
      {/* Visual Metaphor */}
      <div className="node-metaphor">
        <div className="flow-icon wave">🌊</div>
      </div>
      
      {/* Node Content */}
      <div className="node-content">
        <div className="node-header">
          <span className="node-type">BECOME</span>
          <span className="node-operator">Flow</span>
        </div>
        
        <div className="node-entity">{entity}</div>
        
        {narrative && (
          <div className="node-narrative">{narrative}</div>
        )}
        
        <div className="node-transform">
          <div className="transform-label">Transform:</div>
          <div className="transform-code">{transform}</div>
        </div>
        
        {trigger && (
          <div className="node-trigger">
            <span className="trigger-label">When:</span>
            <span className="trigger-value">{trigger}</span>
          </div>
        )}
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

export default memo(BecomeNode)
