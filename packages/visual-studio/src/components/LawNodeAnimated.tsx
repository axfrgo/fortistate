import { motion } from 'framer-motion'
import { Handle, Position, type NodeProps } from 'reactflow'
import type { ExecutionResult } from '../executionEngine.ts'
import './LawNodeAnimated.css'

interface LawNodeData {
  name: string
  executionResult?: ExecutionResult
  isExecuting?: boolean
}

export default function LawNode({ data, selected }: NodeProps<LawNodeData>) {
  const { name, executionResult, isExecuting } = data

  // Determine node state for styling and animation
  const getNodeState = () => {
    if (isExecuting) return 'executing'
    if (executionResult?.success) return 'success'
    if (executionResult && !executionResult.success) return 'error'
    return 'idle'
  }

  const nodeState = getNodeState()

  return (
    <motion.div
      className={`law-node ${nodeState} ${selected ? 'selected' : ''}`}
      initial={{ scale: 1 }}
      animate={{
        scale: isExecuting ? [1, 1.05, 1] : 1,
        boxShadow: isExecuting
          ? [
              '0 0 0 0 rgba(168, 85, 247, 0.4)',
              '0 0 0 10px rgba(168, 85, 247, 0)',
              '0 0 0 0 rgba(168, 85, 247, 0)'
            ]
          : undefined
      }}
      transition={{
        duration: isExecuting ? 1.5 : 0.3,
        repeat: isExecuting ? Infinity : 0,
        ease: 'easeInOut'
      }}
    >
      <Handle type="target" position={Position.Left} />
      
      <div className="law-node-header">
        <span className="law-node-icon">⚖️</span>
        <span className="law-node-name">{name}</span>
      </div>

      {executionResult && (
        <motion.div
          className="law-node-result"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="result-status">
            {executionResult.success ? '✓' : '✗'}
          </div>
          <div className="result-duration">
            {executionResult.duration.toFixed(0)}ms
          </div>
        </motion.div>
      )}

      <Handle type="source" position={Position.Right} />
    </motion.div>
  )
}
