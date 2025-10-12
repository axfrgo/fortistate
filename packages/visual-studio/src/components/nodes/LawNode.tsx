import { memo } from 'react'
import { Handle, Position, type NodeProps } from 'reactflow'
import './LawNode.css'

interface LawNodeData {
  name: string
  inputs: string[]
  output: string
  color: string
}

function LawNode({ data }: NodeProps<LawNodeData>) {
  return (
    <div className="law-node" style={{ borderColor: data.color }}>
      <Handle type="target" position={Position.Top} />
      
      <div className="law-node-header" style={{ backgroundColor: data.color }}>
        <span className="law-icon">⚖️</span>
        <span className="law-name">{data.name}</span>
      </div>
      
      <div className="law-node-body">
        <div className="law-section">
          <div className="law-label">Inputs</div>
          {data.inputs.map((input, i) => (
            <div key={i} className="law-param">{input}</div>
          ))}
        </div>
        
        <div className="law-section">
          <div className="law-label">Output</div>
          <div className="law-param">{data.output}</div>
        </div>
      </div>
      
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}

export default memo(LawNode)
