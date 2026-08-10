// Watches an element and reports once it has scrolled into view.
import { useEffect, useRef, useState } from 'react'
import usePrefersReducedMotion from './usePrefersReducedMotion.js'

// A percentage threshold would never fire for a block taller than the viewport,
// leaving it invisible forever, so this triggers as soon as any part shows.
export default function useReveal(rootMargin = '0px 0px -40px 0px') {
  const ref = useRef(null)
  const prefersReducedMotion = usePrefersReducedMotion()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Reduced motion, or a browser without the API: show it straight away so
    // content can never get stuck invisible.
    if (prefersReducedMotion || typeof IntersectionObserver === 'undefined') {
      setIsVisible(true)
      return
    }

    // No element to watch: fail open rather than leave content hidden forever.
    const element = ref.current
    if (!element) {
      setIsVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true)
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0, rootMargin }
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [prefersReducedMotion, rootMargin])

  return { ref, isVisible }
}
