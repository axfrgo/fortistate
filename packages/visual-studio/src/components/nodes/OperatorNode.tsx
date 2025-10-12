import { memo } from 'react'
import { Handle, Position, type NodeProps } from 'reactflow'
import './OperatorNode.css'

interface OperatorNodeData {
  operator: 'AND' | 'OR' | 'IMPLIES' | 'SEQUENCE' | 'PARALLEL'
  color: string
}

const operatorIcons = {
  AND: '∧',
  OR: '∨',
  IMPLIES: '⇒',
  SEQUENCE: '→',
  PARALLEL: '⇉',
}

function OperatorNode({ data }: NodeProps<OperatorNodeData>) {
  return (
    <div className="operator-node" style={{ backgroundColor: data.color }}>
      <Handle type="target" position={Position.Top} />
      
      <div className="operator-icon">
        {operatorIcons[data.operator]}
      </div>
      <div className="operator-name">{data.operator}</div>
      
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}

export default memo(OperatorNode)
