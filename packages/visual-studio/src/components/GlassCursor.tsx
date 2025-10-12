import { useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import './GlassCursor.css'

type CursorVariant = 'default' | 'interactive' | 'text'

interface GlassCursorProps {
  containerRef: RefObject<HTMLElement | null>
}

const INTERACTIVE_SELECTOR =
  'button, a, [role="button"], [role="menuitem"], [role="option"], [role="tab"], [role="switch"], [role="checkbox"], [aria-haspopup="true"], [data-interactive="true"], [data-cursor-variant="interactive"], summary, label, select, .clickable, .interactive, [draggable="true"], [data-draggable="true"], .react-flow__node, .react-flow__pane, .react-flow__handle, .react-flow__edge-path'

const TEXT_SELECTOR = 'input, textarea, [contenteditable="true"], [data-cursor-variant="text"], .text-input, .code-editor textarea'

const getInitialPosition = () => {
  if (typeof window === 'undefined') {
    return { x: 0, y: 0 }
  }
  return { x: window.innerWidth / 2, y: window.innerHeight / 2 }
}

export default function GlassCursor({ containerRef }: GlassCursorProps) {
  const cursorRef = useRef<HTMLDivElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const targetRef = useRef(getInitialPosition())
  const positionRef = useRef({ ...targetRef.current })
  const smoothingRef = useRef(0.18)
  const [variant, setVariant] = useState<CursorVariant>('default')
  const [isVisible, setIsVisible] = useState(false)
  const [isPressed, setIsPressed] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')

    const updateSmoothing = () => {
      smoothingRef.current = reduceMotionQuery.matches ? 1 : 0.18
    }

    updateSmoothing()
    reduceMotionQuery.addEventListener('change', updateSmoothing)
    return () => reduceMotionQuery.removeEventListener('change', updateSmoothing)
  }, [])

  useEffect(() => {
    if (!cursorRef.current) return
    cursorRef.current.style.left = `${positionRef.current.x}px`
    cursorRef.current.style.top = `${positionRef.current.y}px`
  }, [])

  useEffect(() => {
    const container = containerRef.current
    const cursorEl = cursorRef.current
    if (!container || !cursorEl) return
    if (typeof window === 'undefined') return
    const pointerCapability = window.matchMedia('(pointer: fine)')
    if (!pointerCapability.matches) return

    const resolveVariant = (target: EventTarget | null): CursorVariant => {
      if (!(target instanceof Element)) return 'default'

      const nativeOverride = target.closest('[data-glass-cursor="native"]')
      if (nativeOverride) return 'default'

      const datasetVariant = (target as HTMLElement).dataset?.cursorVariant as CursorVariant | undefined
      if (datasetVariant) return datasetVariant

      const parentDataset = target.closest('[data-cursor-variant]') as HTMLElement | null
      if (parentDataset?.dataset?.cursorVariant) {
        return parentDataset.dataset.cursorVariant as CursorVariant
      }

      if (target.closest(TEXT_SELECTOR)) return 'text'
      if (target.closest(INTERACTIVE_SELECTOR)) return 'interactive'

      if (target instanceof HTMLElement && target.tabIndex >= 0 && !target.hasAttribute('disabled')) {
        if (!target.closest(TEXT_SELECTOR)) {
          return 'interactive'
        }
      }

      return 'default'
    }

    const step = () => {
      const { x: cx, y: cy } = positionRef.current
      const { x: tx, y: ty } = targetRef.current
      const factor = smoothingRef.current
      const nextX = cx + (tx - cx) * factor
      const nextY = cy + (ty - cy) * factor

      positionRef.current.x = nextX
      positionRef.current.y = nextY
      cursorEl.style.left = `${nextX}px`
      cursorEl.style.top = `${nextY}px`

      if (Math.abs(tx - nextX) > 0.1 || Math.abs(ty - nextY) > 0.1) {
        rafRef.current = requestAnimationFrame(step)
      } else {
        positionRef.current.x = tx
        positionRef.current.y = ty
        cursorEl.style.left = `${tx}px`
        cursorEl.style.top = `${ty}px`
        rafRef.current = null
      }
    }

    const ensureAnimation = () => {
      if (rafRef.current === null) {
        rafRef.current = requestAnimationFrame(step)
      }
    }

    const stopAnimation = () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }

    const handlePointerMove = (event: PointerEvent) => {
      targetRef.current.x = event.clientX
      targetRef.current.y = event.clientY
      ensureAnimation()

      const nextVariant = resolveVariant(event.target)
      setVariant((current) => (current === nextVariant ? current : nextVariant))
      setIsVisible(true)
    }

    const handlePointerEnter = (event: PointerEvent) => {
      targetRef.current.x = event.clientX
      targetRef.current.y = event.clientY
      ensureAnimation()
      setIsVisible(true)
    }

    const handlePointerLeave = () => {
      setIsVisible(false)
      setIsPressed(false)
      setVariant('default')
      stopAnimation()
    }

    const handlePointerDown = () => {
      setIsPressed(true)
    }

    const handlePointerUp = () => {
      setIsPressed(false)
    }

    container.addEventListener('pointermove', handlePointerMove, { passive: true })
    container.addEventListener('pointerenter', handlePointerEnter, { passive: true })
    container.addEventListener('pointerleave', handlePointerLeave)
    container.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('pointerup', handlePointerUp)
    window.addEventListener('pointercancel', handlePointerUp)

    return () => {
      stopAnimation()
      container.removeEventListener('pointermove', handlePointerMove)
      container.removeEventListener('pointerenter', handlePointerEnter)
      container.removeEventListener('pointerleave', handlePointerLeave)
      container.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('pointercancel', handlePointerUp)
    }
  }, [containerRef])

  if (typeof window !== 'undefined') {
    const pointerCapability = window.matchMedia('(pointer: fine)')
    if (!pointerCapability.matches) {
      return null
    }
  }

  const classNames = ['glass-cursor']
  if (isVisible) classNames.push('visible')
  if (variant !== 'default') classNames.push(variant)
  if (isPressed) classNames.push('pressed')

  return <div ref={cursorRef} className={classNames.join(' ')} aria-hidden="true" />
}
