import { useEffect, useRef } from 'react'
import Portal from '../common/Portal.jsx'

const FOCUSABLE = 'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

// A full-height operations detail surface. It deliberately keeps the table in
// place behind it, which makes triaging a queue feel much less disorienting.
export default function DetailDrawer({ open, onClose, title, children }) {
  const drawerRef = useRef(null)

  // Held in a ref so the effect depends on `open` alone. Callers pass an inline
  // arrow, and re-running this on every parent render steals focus mid-typing.
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (!open) return undefined
    const opener = document.activeElement
    drawerRef.current?.focus()
    document.body.style.overflow = 'hidden'
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onCloseRef.current()
      if (event.key !== 'Tab') return
      const targets = [...(drawerRef.current?.querySelectorAll(FOCUSABLE) || [])]
      if (!targets.length) {
        event.preventDefault()
        return
      }
      const first = targets[0]
      const last = targets[targets.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
      if (opener?.isConnected) opener.focus()
    }
  }, [open])

  if (!open) return null
  return (
    <Portal>
      <button type="button" aria-label="Close details" onClick={onClose} className="fixed inset-0 z-overlay cursor-default bg-primary-900/45" />
      <aside ref={drawerRef} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} className="safe-area-panel fixed inset-y-0 right-0 z-modal flex w-full max-w-2xl flex-col bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-stone-200 px-5 py-5 sm:px-7">
          <h2 className="text-h4 font-sans text-stone-900">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close details" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-stone-300 text-stone-700 hover:border-stone-400">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-7">{children}</div>
      </aside>
    </Portal>
  )
}
