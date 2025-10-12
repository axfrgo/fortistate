/**
 * 🌀 TRANSCEND Node (Portal) - vX Ontogenetic Component
 * 
 * Visual representation of the TRANSCEND operator.
 * Metaphor: A glowing portal to another universe.
 */

import { memo } from 'react'
import { Handle, Position } from 'reactflow'
import './OntogeneticNodes.css'

interface TranscendNodeData {
  entity: string
  portal: string
  condition: string
  narrative?: string
  status?: 'idle' | 'executing' | 'success' | 'error'
}

interface TranscendNodeProps {
  data: TranscendNodeData
  selected?: boolean
}

function TranscendNode({ data, selected }: TranscendNodeProps) {
  const { entity, portal, condition, narrative, status = 'idle' } = data

  return (
    <div className={`ontogenetic-node transcend-node ${status} ${selected ? 'selected' : ''}`}>
      {/* Top Handle - receives from previous nodes */}
      <Handle 
        type="target" 
        position={Position.Top} 
        id="in"
        className="handle-target"
      />
      
      {/* Visual Metaphor */}
      <div className="node-metaphor">
        <div className="portal-icon rotate-portal">🌀</div>
        <div className="portal-glow"></div>
      </div>
      
      {/* Node Content */}
      <div className="node-content">
        <div className="node-header">
          <span className="node-type">TRANSCEND</span>
          <span className="node-operator">Portal</span>
        </div>
        
        <div className="node-entity">{entity}</div>
        
        {narrative && (
          <div className="node-narrative">{narrative}</div>
        )}
        
        <div className="node-portal">
          <div className="portal-label">→ Destination:</div>
          <div className="portal-universe">{portal}</div>
        </div>
        
        <div className="node-condition">
          <div className="condition-label">When:</div>
          <div className="condition-code">{condition}</div>
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
      
      {/* Portal Handle - special output to other universe */}
      <Handle 
        type="source" 
        position={Position.Right} 
        id="portal"
        className="handle-portal"
      />
    </div>
  )
}

export default memo(TranscendNode)
