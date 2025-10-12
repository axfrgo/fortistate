import { useRef, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useReactFlow } from 'reactflow'
import Editor from '@monaco-editor/react'
import { generateFullModule, generateCodeFromGraph } from '../codeGenerator.ts'
import './CodeGenerator.css'

export default function CodeGenerator() {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'full' | 'laws' | 'composition'>('full')
  const [showReplacer, setShowReplacer] = useState(false)
  const [findText, setFindText] = useState('')
  const [replaceText, setReplaceText] = useState('')
  const [caseSensitive, setCaseSensitive] = useState(false)
  const { getNodes, getEdges } = useReactFlow()
  const dragBoundsRef = useRef<HTMLDivElement>(null)

  const nodes = getNodes()
  const edges = getEdges()
  
  // Memoize code generation to update when nodes/edges change
  const generatedCode = useMemo(() => {
    const { imports, laws, composition } = generateCodeFromGraph(nodes, edges)
    const fullModule = generateFullModule(nodes, edges)
    
    return {
      full: fullModule,
      laws: `${imports}\n\n${laws}`,
      composition: `${imports}\n\n${composition}`
    }
  }, [nodes, edges])

  // Apply find/replace transformations
  const codeByTab = useMemo(() => {
    const baseCode = generatedCode[activeTab]
    
    if (!findText) return baseCode
    
    const flags = caseSensitive ? 'g' : 'gi'
    const regex = new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags)
    return baseCode.replace(regex, replaceText)
  }, [generatedCode, activeTab, findText, replaceText, caseSensitive])

  const findMatches = useMemo(() => {
    if (!findText) return 0
    
    const flags = caseSensitive ? 'g' : 'gi'
    const regex = new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags)
    const matches = generatedCode[activeTab].match(regex)
    return matches ? matches.length : 0
  }, [generatedCode, activeTab, findText, caseSensitive])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(codeByTab)
    // Could add toast notification here
  }

  const handleDownload = () => {
    const blob = new Blob([codeByTab], { type: 'text/typescript' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'fortistate-laws.ts'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleReplaceAll = () => {
    // The replacement is already applied in codeByTab via useMemo
    // This is just to give user feedback
    if (findMatches > 0) {
      console.log(`✅ Replaced ${findMatches} occurrence(s) of "${findText}" with "${replaceText}"`)
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        className="code-gen-toggle"
        onClick={() => setIsOpen(!isOpen)}
        title="Generate Code"
      >
        {isOpen ? '✕' : '</>'}
      </button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              className="code-gen-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />
            <div className="code-gen-modal-positioner" ref={dragBoundsRef}>
              <motion.div
                className="code-gen-modal"
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                drag
                dragConstraints={dragBoundsRef}
                dragMomentum={false}
                dragElastic={0.15}
              >
                <div className="code-gen-header">
                  <h2>Generated TypeScript Code</h2>
                  <div className="code-gen-tabs">
                    <button
                      className={activeTab === 'full' ? 'active' : ''}
                      onClick={() => setActiveTab('full')}
                    >
                      Full Module
                    </button>
                    <button
                      className={activeTab === 'laws' ? 'active' : ''}
                      onClick={() => setActiveTab('laws')}
                    >
                      Laws Only
                    </button>
                    <button
                      className={activeTab === 'composition' ? 'active' : ''}
                      onClick={() => setActiveTab('composition')}
                    >
                      Composition
                    </button>
                  </div>
                  <button 
                    className={`replacer-toggle ${showReplacer ? 'active' : ''}`}
                    onClick={() => setShowReplacer(!showReplacer)}
                    title="Find and Replace"
                  >
                    🔍
                  </button>
                </div>

                {/* Find and Replace Panel */}
                {showReplacer && (
                  <div className="replacer-panel">
                    <div className="replacer-row">
                      <input
                        type="text"
                        className="replacer-input"
                        placeholder="Find text..."
                        value={findText}
                        onChange={(e) => setFindText(e.target.value)}
                      />
                      <span className="match-count">
                        {findMatches > 0 ? `${findMatches} match${findMatches !== 1 ? 'es' : ''}` : 'No matches'}
                      </span>
                    </div>
                    <div className="replacer-row">
                      <input
                        type="text"
                        className="replacer-input"
                        placeholder="Replace with..."
                        value={replaceText}
                        onChange={(e) => setReplaceText(e.target.value)}
                      />
                      <button 
                        className="replacer-btn"
                        onClick={handleReplaceAll}
                        disabled={!findText || findMatches === 0}
                      >
                        Replace All
                      </button>
                    </div>
                    <label className="replacer-option">
                      <input
                        type="checkbox"
                        checked={caseSensitive}
                        onChange={(e) => setCaseSensitive(e.target.checked)}
                      />
                      <span>Case sensitive</span>
                    </label>
                  </div>
                )}

                <div className="code-gen-body">
                  <Editor
                    height="100%"
                    defaultLanguage="typescript"
                    value={codeByTab}
                    theme="vs-dark"
                    options={{
                      readOnly: true,
                      minimap: { enabled: false },
                      fontSize: 13,
                      lineNumbers: 'on',
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                    }}
                  />
                </div>

                <div className="code-gen-footer">
                  <div className="code-stats">
                    <span>📊 {nodes.length} nodes</span>
                    <span>🔗 {edges.length} edges</span>
                    <span>📝 {codeByTab.split('\n').length} lines</span>
                  </div>
                  <div className="code-actions">
                    <button className="code-btn" onClick={handleCopy}>
                      📋 Copy
                    </button>
                    <button className="code-btn primary" onClick={handleDownload}>
                      💾 Download
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
