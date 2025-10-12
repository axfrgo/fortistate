import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useReactFlow } from 'reactflow'
import { detectConflicts, getResolutionStrategies, type Conflict } from '../conflictDetector.ts'
import './ConflictInspector.css'

export default function ConflictInspector() {
  const [conflicts, setConflicts] = useState<Conflict[]>([])
  const [selectedConflict, setSelectedConflict] = useState<Conflict | null>(null)
  const { getNodes, getEdges, setNodes } = useReactFlow()

  useEffect(() => {
    const checkConflicts = () => {
      const nodes = getNodes()
      const edges = getEdges()
      const detected = detectConflicts(nodes, edges)
      setConflicts(detected)
    }

    checkConflicts()
    const interval = setInterval(checkConflicts, 2000) // Check every 2 seconds

    return () => clearInterval(interval)
  }, [getNodes, getEdges])

  const highlightConflictNodes = (conflict: Conflict) => {
    const nodes = getNodes()
    const updated = nodes.map(node => ({
      ...node,
      style: {
        ...node.style,
        opacity: conflict.nodes.includes(node.id) ? 1 : 0.3,
        boxShadow: conflict.nodes.includes(node.id) 
          ? `0 0 0 3px ${conflict.severity === 'error' ? '#EF4444' : conflict.severity === 'warning' ? '#F59E0B' : '#3B82F6'}`
          : undefined
      }
    }))
    setNodes(updated)
    setSelectedConflict(conflict)
  }

  const clearHighlight = () => {
    const nodes = getNodes()
    const updated = nodes.map(node => ({
      ...node,
      style: {
        ...node.style,
        opacity: 1,
        boxShadow: undefined
      }
    }))
    setNodes(updated)
    setSelectedConflict(null)
  }

  if (conflicts.length === 0) {
    return (
      <div className="conflict-inspector empty">
        <div className="conflict-badge success">
          ✓ No conflicts
        </div>
      </div>
    )
  }

  const errorCount = conflicts.filter(c => c.severity === 'error').length
  const warningCount = conflicts.filter(c => c.severity === 'warning').length
  const infoCount = conflicts.filter(c => c.severity === 'info').length

  return (
    <div className="conflict-inspector">
      <div className="conflict-summary">
        {errorCount > 0 && (
          <div className="conflict-badge error" title="Errors">
            ✗ {errorCount}
          </div>
        )}
        {warningCount > 0 && (
          <div className="conflict-badge warning" title="Warnings">
            ⚠ {warningCount}
          </div>
        )}
        {infoCount > 0 && (
          <div className="conflict-badge info" title="Info">
            ℹ {infoCount}
          </div>
        )}
      </div>

      <AnimatePresence>
        {conflicts.map((conflict) => (
          <motion.div
            key={conflict.id}
            className={`conflict-item ${conflict.severity}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            onMouseEnter={() => highlightConflictNodes(conflict)}
            onMouseLeave={clearHighlight}
          >
            <div className="conflict-header">
              <span className="conflict-icon">
                {conflict.severity === 'error' ? '✗' : conflict.severity === 'warning' ? '⚠' : 'ℹ'}
              </span>
              <span className="conflict-type">{conflict.type.replace('-', ' ')}</span>
            </div>
            <p className="conflict-description">{conflict.description}</p>
            {conflict.suggestion && (
              <p className="conflict-suggestion">💡 {conflict.suggestion}</p>
            )}
            
            {selectedConflict?.id === conflict.id && (
              <motion.div
                className="conflict-resolutions"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
              >
                <div className="resolution-title">Resolution strategies:</div>
                <ul className="resolution-list">
                  {getResolutionStrategies(conflict).map((strategy, i) => (
                    <li key={i}>{strategy}</li>
                  ))}
                </ul>
              </motion.div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
