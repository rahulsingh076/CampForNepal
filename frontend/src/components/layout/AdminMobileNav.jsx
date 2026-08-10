// The admin sidebar as a mobile drawer, with the same focus handling as every
// other overlay: trap, Escape, and focus back to the button that opened it.
import { useEffect, useRef } from 'react'
import Portal from '../common/Portal.jsx'
import AdminSidebar from './AdminSidebar.jsx'

export default function AdminMobileNav({ open, onClose, companyName }) {
  const panelRef = useRef(null)
  const closeRef = useRef(null)
  const restoreFocusRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined

    restoreFocusRef.current = document.activeElement
    const originalOverflow = document.body.style.overflow

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key !== 'Tab') return

      const controls = panelRef.current?.querySelectorAll('a[href], button:not([disabled])') || []
      if (!controls.length) return
      const first = controls[0]
      const last = controls[controls.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKeyDown)
    requestAnimationFrame(() => closeRef.current?.focus())

    return () => {
      document.body.style.overflow = originalOverflow
      document.removeEventListener('keydown', onKeyDown)
      restoreFocusRef.current?.focus?.()
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <Portal>
      <div className="lg:hidden">
        {/* Decorative: the panel's own Close button is the accessible control. */}
        <div aria-hidden="true" onClick={onClose} className="fixed inset-0 z-overlay bg-primary-900/50" />

        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label="Admin navigation"
          className="safe-area-panel fixed inset-y-0 left-0 z-modal flex w-64 flex-col bg-primary-900"
        >
          <div className="flex justify-end px-3 pt-3">
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label="Close navigation"
              className="flex h-11 w-11 items-center justify-center rounded-lg border border-primary-700 text-white"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <AdminSidebar companyName={companyName} onNavigate={onClose} />
          </div>
        </div>
      </div>
    </Portal>
  )
}
