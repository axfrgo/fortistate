import './Sidebar.css'
import { templates } from '../templates.ts'
import type { Template } from '../templates.ts'

interface SidebarProps {
  onLoadExample?: (() => void) | null
  onLoadTemplate?: (template: Template) => void
  onSaveCanvas?: () => void
}

// vX: Ontogenetic Operators
const ontogeneticOperators = [
  { 
    name: 'BEGIN', 
    type: 'begin',
    metaphor: 'Seed',
    icon: '🌱', 
    color: '#10B981',
    description: 'Create new existence'
  },
  { 
    name: 'BECOME', 
    type: 'become',
    metaphor: 'Flow',
    icon: '🌊', 
    color: '#3B82F6',
    description: 'Transform entities'
  },
  { 
    name: 'CEASE', 
    type: 'cease',
    metaphor: 'Boundary',
    icon: '🧱', 
    color: '#EF4444',
    description: 'Enforce constraints'
  },
  { 
    name: 'TRANSCEND', 
    type: 'transcend',
    metaphor: 'Portal',
    icon: '🌀', 
    color: '#8B5CF6',
    description: 'Cross universes'
  },
  { 
    name: 'RESOLVE', 
    type: 'resolve',
    metaphor: 'Conflict Resolution',
    icon: '🔄', 
    color: '#F59E0B',
    description: 'Resolve conflicts automatically'
  },
]

// Legacy operators (for backward compatibility)
const legacyOperators = [
  { name: 'AND', symbol: '∧', color: '#667eea' },
  { name: 'OR', symbol: '∨', color: '#764ba2' },
  { name: 'IMPLIES', symbol: '⇒', color: '#f093fb' },
  { name: 'SEQUENCE', symbol: '→', color: '#4facfe' },
  { name: 'PARALLEL', symbol: '⇉', color: '#43e97b' },
]

export function Sidebar({ onLoadExample, onLoadTemplate, onSaveCanvas }: SidebarProps) {
  const onDragStart = (event: React.DragEvent, nodeType: string, data: any) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify({ nodeType, data }))
    event.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div className="sidebar">
      {/* Template Library */}
      {onLoadTemplate && (
        <div className="sidebar-section templates-section">
          <h3 className="sidebar-title">
            📚 Templates
          </h3>
          <p className="sidebar-subtitle">Pre-built universes</p>
          
          <div className="sidebar-items templates-grid">
            {templates.map((template) => (
              <button
                key={template.id}
                className="template-card"
                onClick={() => onLoadTemplate(template)}
                title={template.description}
              >
                <span className="template-icon">{template.icon}</span>
                <div className="template-name">{template.name}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Ontogenetic Operators */}
      <div className="sidebar-section vx-section">
        <h3 className="sidebar-title">
          <span className="vx-badge">vX</span>
          Ontogenetic Operators
        </h3>
        <p className="sidebar-subtitle">Generative Existence Theory</p>
        
        <div className="sidebar-items">
          {ontogeneticOperators.map((op, i) => (
            <div
              key={i}
              className="sidebar-item ontogenetic-item"
              draggable
              onDragStart={(e) => onDragStart(e, op.type, {
                name: op.name,
                metaphor: op.metaphor,
                color: op.color,
              })}
              style={{ 
                borderLeft: `4px solid ${op.color}`,
                background: `linear-gradient(135deg, ${op.color}10 0%, transparent 100%)`
              }}
            >
              <span className="item-icon ontogenetic-icon">{op.icon}</span>
              <div className="item-info">
                <div className="item-name">
                  {op.name}
                  <span className="item-metaphor">{op.metaphor}</span>
                </div>
                <div className="item-description">{op.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="sidebar-section">
        <h3 className="sidebar-title">Logical Operators</h3>
        <p className="sidebar-subtitle">Compose operators</p>
        
        <div className="sidebar-items">
          {legacyOperators.map((op, i) => (
            <div
              key={i}
              className="sidebar-item operator-item"
              draggable
              onDragStart={(e) => onDragStart(e, 'operator', {
                operator: op.name,
                color: op.color,
              })}
              style={{ backgroundColor: op.color }}
            >
              <span className="operator-symbol">{op.symbol}</span>
              <span className="operator-name">{op.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="sidebar-footer">
        <button 
          className="sidebar-button"
          onClick={() => onLoadExample?.()}
          disabled={!onLoadExample}
        >
          <span>🎨</span>
          Load Example
        </button>
        <button 
          className="sidebar-button"
          onClick={onSaveCanvas}
          disabled={!onSaveCanvas}
        >
          <span>💾</span>
          Save Canvas
        </button>
      </div>
    </div>
  )
}
