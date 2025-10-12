import React, { useEffect, useRef } from 'react'
import type { Node, Edge } from 'reactflow'
import './ContextMenu.css'

export interface ContextMenuProps {
  x: number
  y: number
  node?: Node
  edge?: Edge
  onClose: () => void
  onAskCustodian?: (target: Node | Edge) => void
  onExplainWithNarrator?: (target: Node | Edge) => void
  onExploreAlternatives?: (target: Node | Edge) => void
  onTranslateWithStoryteller?: () => void
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  node,
  edge,
  onClose,
  onAskCustodian,
  onExplainWithNarrator,
  onExploreAlternatives,
  onTranslateWithStoryteller,
}) => {
  const menuRef = useRef<HTMLDivElement>(null)
  const target = node || edge

  // Debug logging
  useEffect(() => {
    console.log('🎯 ContextMenu rendered:', {
      x,
      y,
      hasNode: !!node,
      hasEdge: !!edge,
      hasTarget: !!target,
      nodeLabel: node?.data?.label,
      hasHandlers: {
        custodian: !!onAskCustodian,
        narrator: !!onExplainWithNarrator,
        explorer: !!onExploreAlternatives,
      }
    })
  }, [x, y, node, edge, target, onAskCustodian, onExplainWithNarrator, onExploreAlternatives])

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as globalThis.Node)) {
        onClose()
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  const handleMenuClick = (action: (target: Node | Edge) => void) => {
    console.log('🔘 Menu item clicked', { hasTarget: !!target, target })
    try {
      if (target) {
        console.log('✅ Calling action with target')
        action(target)
      } else {
        console.warn('⚠️ No target available (empty canvas?)')
        alert('This action requires a node or edge. Please right-click on a node or edge.')
      }
    } catch (error) {
      console.error('❌ Error calling action:', error)
      alert('Error: ' + (error as Error).message)
    } finally {
      onClose()
    }
  }

  return (
    <div
      ref={menuRef}
      className="context-menu"
      style={{
        position: 'fixed',
        left: `${x}px`,
        top: `${y}px`,
        zIndex: 10000,
      }}
    >
      <div className="context-menu-header">
        {node ? `${node.data?.label || node.type || 'Node'}` : edge ? 'Edge' : 'Canvas'}
      </div>
      
      <div className="context-menu-items">
        {/* Always show at least the Custodian option for debugging */}
        {onAskCustodian && (
          <button
            className="context-menu-item"
            onClick={() => {
              console.log('🛡️ Custodian button clicked')
              handleMenuClick(onAskCustodian)
            }}
          >
            <span className="menu-icon">🛡️</span>
            <span>Ask Custodian to Review</span>
          </button>
        )}
        
        {onExplainWithNarrator && (
          <button
            className="context-menu-item"
            onClick={() => {
              console.log('📖 Narrator button clicked')
              handleMenuClick(onExplainWithNarrator)
            }}
          >
            <span className="menu-icon">📖</span>
            <span>Explain with Narrator</span>
          </button>
        )}
        
        {onTranslateWithStoryteller && (
          <button
            className="context-menu-item"
            onClick={() => {
              console.log('🎨 Storyteller button clicked')
              onTranslateWithStoryteller()
              onClose()
            }}
          >
            <span className="menu-icon">🎨</span>
            <span>Translate Story to Pipeline</span>
          </button>
        )}
        
        {onExploreAlternatives && (
          <button
            className="context-menu-item"
            onClick={() => {
              console.log('🔮 Explorer button clicked')
              handleMenuClick(onExploreAlternatives)
            }}
          >
            <span className="menu-icon">🔮</span>
            <span>Explore Alternatives</span>
          </button>
        )}
        
        {/* Fallback if no handlers provided */}
        {!onAskCustodian && !onExplainWithNarrator && !onExploreAlternatives && (
          <div style={{ padding: '12px 16px', color: '#c4b5fd', fontSize: '13px' }}>
            No actions available
          </div>
        )}
      </div>
    </div>
  )
}
