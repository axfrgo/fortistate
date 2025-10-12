import { useState } from 'react'
import { useReactFlow, type Node, type Edge } from 'reactflow'
import { executeGraph, type ExecutionResult } from '../executionEngine.ts'
import './ExecutionPanel.css'

interface ExecutionPanelProps {
  selectedNodeId: string | null
  executionResults?: Map<string, ExecutionResult>
  isExecuting?: boolean
  onExecute?: (nodes: Node[], edges: Edge[]) => {
    onProgress: (nodeId: string, result: ExecutionResult) => void
    onComplete: () => void
  }
}

export default function ExecutionPanel({
  selectedNodeId,
  executionResults = new Map(),
  isExecuting = false,
  onExecute
}: ExecutionPanelProps) {
  const [executionSpeed, setExecutionSpeed] = useState(1)
  const [inputValue, setInputValue] = useState('42')
  const { getNodes, getEdges } = useReactFlow()

  const selectedResult = selectedNodeId ? executionResults.get(selectedNodeId) : null
  
  const nodeData = selectedNodeId ? {
    id: selectedNodeId,
    name: getNodes().find(n => n.id === selectedNodeId)?.data.name || 'Unknown',
    type: getNodes().find(n => n.id === selectedNodeId)?.type || 'unknown',
    status: isExecuting ? 'running' : (selectedResult?.success ? 'success' : (selectedResult ? 'error' : 'idle')),
  } : null

  const handleRun = async () => {
    if (!onExecute) return
    
    const nodes = getNodes()
    const edges = getEdges()
    
    const { onProgress, onComplete } = onExecute(nodes, edges)
    
    try {
      const parsedInput = JSON.parse(inputValue)
      await executeGraph(nodes, edges, parsedInput, onProgress)
    } catch (error) {
      console.error('Execution failed:', error)
    } finally {
      onComplete()
    }
  }

  return (
    <div className="execution-panel">
      {!selectedNodeId ? (
        <div className="empty-state">
          <div className="empty-icon">👆</div>
          <h3>Select a node</h3>
          <p>Click on any law or operator to inspect and execute it</p>
        </div>
      ) : (
        <>
          <div className="panel-header">
            <h3 className="panel-title">{nodeData?.name}</h3>
            <div className="status-badge" data-status={nodeData?.status}>
              {nodeData?.status}
            </div>
          </div>

          <div className="panel-section">
            <h4 className="section-title">Execution Controls</h4>
            <div className="controls">
              <button 
                className="control-button primary"
                onClick={handleRun}
                disabled={isExecuting}
              >
                {isExecuting ? '⏸️ Running...' : '▶️ Run Graph'}
              </button>
              <button className="control-button" disabled>
                ⏭️ Step
              </button>
              <button 
                className="control-button"
                onClick={() => window.location.reload()}
              >
                🔄 Reset
              </button>
            </div>

            <div className="speed-control">
              <label htmlFor="speed">Speed: {executionSpeed}x</label>
              <input
                id="speed"
                type="range"
                min="0.1"
                max="2"
                step="0.1"
                value={executionSpeed}
                onChange={(e) => setExecutionSpeed(parseFloat(e.target.value))}
                disabled
              />
            </div>
          </div>

          <div className="panel-section">
            <h4 className="section-title">Initial Input</h4>
            <div className="data-view">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder='{"value": 42}'
                rows={3}
                style={{
                  width: '100%',
                  background: '#0a0a0a',
                  border: '1px solid #2a2a2a',
                  borderRadius: '6px',
                  padding: '8px',
                  color: '#e0e0e0',
                  fontFamily: 'Courier New, monospace',
                  fontSize: '12px',
                  resize: 'vertical'
                }}
              />
            </div>
          </div>

          <div className="panel-section">
            <h4 className="section-title">Output</h4>
            <div className="data-view">
              {selectedResult ? (
                <>
                  {selectedResult.success ? (
                    <pre style={{ color: '#10B981' }}>
                      {JSON.stringify(selectedResult.value, null, 2)}
                    </pre>
                  ) : (
                    <pre style={{ color: '#EF4444' }}>
                      Error: {selectedResult.error}
                    </pre>
                  )}
                  <div style={{ fontSize: '11px', color: '#888', marginTop: '8px' }}>
                    Executed in {selectedResult.duration.toFixed(2)}ms
                  </div>
                </>
              ) : (
                <div className="empty-output">No output yet - click "Run Graph"</div>
              )}
            </div>
          </div>

          <div className="panel-section">
            <h4 className="section-title">Execution History</h4>
            <div className="history-list">
              {Array.from(executionResults.entries()).reverse().slice(0, 5).map(([nodeId, result]) => {
                const node = getNodes().find(n => n.id === nodeId)
                const time = new Date(result.timestamp).toLocaleTimeString()
                return (
                  <div key={nodeId} className="history-item">
                    <span className="history-time">{time}</span>
                    <span className={`history-status ${result.success ? 'success' : 'error'}`}>
                      {result.success ? '✓' : '✗'} {node?.data.name || nodeId}
                    </span>
                    <span className="history-duration">{result.duration.toFixed(0)}ms</span>
                  </div>
                )
              })}
              {executionResults.size === 0 && (
                <div className="empty-output">No executions yet</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

