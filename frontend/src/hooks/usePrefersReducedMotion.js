// Reports whether the visitor has asked their system for reduced motion.
import useMediaQuery from './useMediaQuery.js'

export default function usePrefersReducedMotion() {
  return useMediaQuery('(prefers-reduced-motion: reduce)')
}
