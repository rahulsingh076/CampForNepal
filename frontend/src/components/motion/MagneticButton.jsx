// Wraps a CTA so it leans a few pixels toward the pointer. Off for touch and reduced motion.
import { useEffect, useRef } from 'react'
import useMediaQuery from '../../hooks/useMediaQuery.js'
import usePrefersReducedMotion from '../../hooks/usePrefersReducedMotion.js'
import clamp from '../../utils/clamp.js'

const MAX_SHIFT = 6 // px — matches --magnetic-max
const FINE_POINTER = '(hover: hover) and (pointer: fine)'

export default function MagneticButton({ className = '', children }) {
  const ref = useRef(null)
  const prefersReducedMotion = usePrefersReducedMotion()
  const finePointer = useMediaQuery(FINE_POINTER)

  // A tap must never nudge a booking CTA, so touch is excluded outright.
  const active = finePointer && !prefersReducedMotion

  // The transform is written straight to the node: a pointer move should not
  // cost a React render.
  function handleMove(event) {
    const node = ref.current
    if (!active || !node) return

    const bounds = node.getBoundingClientRect()
    const x = clamp((event.clientX - (bounds.left + bounds.width / 2)) / (bounds.width / 2))
    const y = clamp((event.clientY - (bounds.top + bounds.height / 2)) / (bounds.height / 2))

    node.style.transform = `translate(${x * MAX_SHIFT}px, ${y * MAX_SHIFT}px)`
  }

  function reset() {
    if (ref.current) ref.current.style.transform = ''
  }

  // Drop back to centre whenever the effect switches off.
  useEffect(() => {
    if (!active) reset()
  }, [active])

  return (
    <span
      ref={ref}
      className={`inline-block ${className}`}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      style={{ transition: 'transform var(--duration-fast) var(--ease-soft)' }}
    >
      {children}
    </span>
  )
}
