import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Presence, UserId } from '../collaboration/types'
import './PresenceCursors.css'

interface PresenceCursorsProps {
  presences: Map<UserId, Presence>
  canvasRef: React.RefObject<HTMLDivElement | null>
}

export function PresenceCursors({ presences, canvasRef }: PresenceCursorsProps) {
  const [containerBounds, setContainerBounds] = useState<DOMRect | null>(null)

  useEffect(() => {
    if (canvasRef.current) {
      setContainerBounds(canvasRef.current.getBoundingClientRect())
    }

    const handleResize = () => {
      if (canvasRef.current) {
        setContainerBounds(canvasRef.current.getBoundingClientRect())
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [canvasRef])

  if (!containerBounds) return null

  return (
    <div className="presence-cursors-container">
      <AnimatePresence>
        {Array.from(presences.entries()).map(([userId, presence]) => {
          if (!presence.cursor) return null

          const { x, y } = presence.cursor

          return (
            <motion.div
              key={userId}
              className="presence-cursor"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.2 }}
              style={{
                left: `${x}px`,
                top: `${y}px`,
                '--user-color': presence.user.color,
              } as React.CSSProperties}
            >
              {/* Cursor pointer */}
              <svg width="24" height="24" viewBox="0 0 24 24" className="cursor-pointer">
                <path
                  d="M5.65 5.65L19 12l-4.9 2.2-2.2 4.9z"
                  fill="currentColor"
                  stroke="white"
                  strokeWidth="1.5"
                />
              </svg>

              {/* User name label */}
              <motion.div
                className="cursor-label"
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                {presence.user.name}
              </motion.div>

              {/* Selection highlight (if any) */}
              {presence.selection && (presence.selection.nodeIds.length > 0 || presence.selection.edgeIds.length > 0) && (
                <div className="cursor-selection-badge">
                  {presence.selection.nodeIds.length + presence.selection.edgeIds.length} selected
                </div>
              )}
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
