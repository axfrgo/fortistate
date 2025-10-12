/**
 * 🧱 CEASE Node (Boundary) - vX Ontogenetic Component
 * 
 * Visual representation of the CEASE operator.
 * Metaphor: A boundary wall or constraint field.
 */

import { memo } from 'react'
import { Handle, Position } from 'reactflow'
import './OntogeneticNodes.css'

interface CeaseNodeData {
  entity: string
  condition: string
  action: 'terminate' | 'repair' | 'fork'
  narrative?: string
  status?: 'idle' | 'executing' | 'success' | 'error'
}

interface CeaseNodeProps {
  data: CeaseNodeData
  selected?: boolean
}

function CeaseNode({ data, selected }: CeaseNodeProps) {
  const { entity, condition, action, narrative, status = 'idle' } = data

  const actionIcons = {
    terminate: '💀',
    repair: '🔧',
    fork: '🌀'
  }

  const actionLabels = {
    terminate: 'Terminate',
    repair: 'Repair',
    fork: 'Fork Universe'
  }

  return (
    <div className={`ontogenetic-node cease-node ${status} ${selected ? 'selected' : ''}`}>
      {/* Top Handle - receives from previous nodes */}
      <Handle 
        type="target" 
        position={Position.Top} 
        id="in"
        className="handle-target"
      />
      
      {/* Visual Metaphor */}
      <div className="node-metaphor">
        <div className="boundary-icon pulse-boundary">🧱</div>
      </div>
      
      {/* Node Content */}
      <div className="node-content">
        <div className="node-header">
          <span className="node-type">CEASE</span>
          <span className="node-operator">Boundary</span>
        </div>
        
        <div className="node-entity">{entity}</div>
        
        {narrative && (
          <div className="node-narrative">{narrative}</div>
        )}
        
        <div className="node-condition">
          <div className="condition-label">When:</div>
          <div className="condition-code">{condition}</div>
        </div>
        
        <div className="node-action">
          <span className="action-icon">{actionIcons[action]}</span>
          <span className="action-label">{actionLabels[action]}</span>
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
      
      {/* Bottom Handle - outputs to next nodes (if not terminate) */}
      {action !== 'terminate' && (
        <Handle 
          type="source" 
          position={Position.Bottom} 
          id="out"
          className="handle-source"
        />
      )}
      
      {/* Fork Handle - special output for universe forks */}
      {action === 'fork' && (
        <Handle 
          type="source" 
          position={Position.Right} 
          id="fork"
          className="handle-fork"
        />
      )}
    </div>
  )
}

export default memo(CeaseNode)
