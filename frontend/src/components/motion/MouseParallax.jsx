// Drifts hero content a few pixels with the pointer. Desktop pointers only.
import { useEffect, useRef } from 'react'
import useMediaQuery from '../../hooks/useMediaQuery.js'
import usePrefersReducedMotion from '../../hooks/usePrefersReducedMotion.js'
import clamp from '../../utils/clamp.js'

const MAX_DRIFT = 12 // px — matches --parallax-max
const DESKTOP_POINTER = '(min-width: 1024px) and (hover: hover) and (pointer: fine)'

export default function MouseParallax({ className = '', children }) {
  const frameRef = useRef(null)
  const contentRef = useRef(null)
  const prefersReducedMotion = usePrefersReducedMotion()
  const onDesktop = useMediaQuery(DESKTOP_POINTER)

  const active = onDesktop && !prefersReducedMotion

  // Written straight to the node so a pointer move costs no React render.
  function handleMove(event) {
    const frame = frameRef.current
    const content = contentRef.current
    if (!active || !frame || !content) return

    const bounds = frame.getBoundingClientRect()
    const x = clamp((event.clientX - (bounds.left + bounds.width / 2)) / (bounds.width / 2))
    const y = clamp((event.clientY - (bounds.top + bounds.height / 2)) / (bounds.height / 2))

    content.style.transform = `translate(${x * MAX_DRIFT}px, ${y * MAX_DRIFT}px)`
  }

  function reset() {
    if (contentRef.current) contentRef.current.style.transform = ''
  }

  // Drop back to centre whenever the effect switches off.
  useEffect(() => {
    if (!active) reset()
  }, [active])

  return (
    <div ref={frameRef} className={className} onMouseMove={handleMove} onMouseLeave={reset}>
      <div
        ref={contentRef}
        style={{ transition: 'transform var(--duration-normal) var(--ease-soft)' }}
      >
        {children}
      </div>
    </div>
  )
}
