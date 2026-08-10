// Puts new pages at the top while restoring a prior scroll point on browser Back.
import { useEffect, useRef } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

export default function ScrollToTop() {
  const location = useLocation()
  const navigationType = useNavigationType()
  const positions = useRef(new Map())

  useEffect(() => {
    const savedPosition = positions.current.get(location.key)

    if (location.hash) {
      requestAnimationFrame(() => document.getElementById(location.hash.slice(1))?.scrollIntoView())
    } else if (navigationType === 'POP' && savedPosition) {
      window.scrollTo(savedPosition)
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    }

    return () => {
      positions.current.set(location.key, { left: window.scrollX, top: window.scrollY })
    }
  }, [location.hash, location.key, navigationType])

  return null
}
