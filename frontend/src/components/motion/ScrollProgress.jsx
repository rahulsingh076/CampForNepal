// Thin bar across the top showing how far down a long page the visitor is.
import { useEffect, useRef } from 'react'
import usePrefersReducedMotion from '../../hooks/usePrefersReducedMotion.js'

export default function ScrollProgress() {
  const barRef = useRef(null)
  const reducedMotion = usePrefersReducedMotion()

  useEffect(() => {
    if (reducedMotion) return undefined
    // The bar is written directly: scrolling must not cost a React render.
    function update() {
      const bar = barRef.current
      if (!bar) return

      const scrollable = document.documentElement.scrollHeight - window.innerHeight
      const progress = scrollable > 0 ? window.scrollY / scrollable : 0
      bar.style.transform = `scaleX(${progress})`
    }

    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [reducedMotion])

  if (reducedMotion) return null

  // Decorative: it repeats the scrollbar, so screen readers should skip it.
  return (
    // pointer-events-none so this strip never swallows a click near the top edge.
    <div className="pointer-events-none fixed inset-x-0 top-0 z-header h-1" aria-hidden="true">
      <div ref={barRef} className="h-full w-full origin-left scale-x-0 bg-amber-600" />
    </div>
  )
}
