// A small centred dialog. Escape and the backdrop both close it, and focus
// stays inside it while it is open.
import { useEffect, useRef } from 'react'
import Portal from './Portal.jsx'

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

const SIZES = {
  default: 'sm:max-w-lg',
  wide: 'sm:max-w-4xl',
  xl: 'sm:max-w-6xl',
}

export default function Modal({ open, onClose, title, children, size = 'default' }) {
  const dialogRef = useRef(null)
  const openerRef = useRef(null)

  // Callers pass an inline arrow, so onClose is a new function on every render.
  // Reading it from a ref keeps the effect below tied to `open` alone —
  // otherwise every keystroke inside the dialog re-ran it and pulled focus off
  // the field being typed in.
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (!open) return

    // Remember who opened it, so focus can go back there on close.
    openerRef.current = document.activeElement
    dialogRef.current?.focus()
    document.body.style.overflow = 'hidden'

    function onKeyDown(event) {
      if (event.key === 'Escape') {
        onCloseRef.current()
        return
      }
      if (event.key !== 'Tab') return

      // Keep Tab inside the dialog rather than letting it walk the page behind.
      const focusable = [...(dialogRef.current?.querySelectorAll(FOCUSABLE) || [])]
      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

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
      // Put focus back where it came from, if that element is still around.
      if (openerRef.current?.isConnected) openerRef.current.focus()
    }
  }, [open])

  if (!open) return null

  return (
    <Portal>
      {/* Decorative: the dialog's own close button is the accessible control,
          so this must not add a second stop in the tab order. */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className="fixed inset-0 z-overlay bg-primary-900/50"
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={`fixed inset-x-4 top-1/2 z-modal max-h-[85vh] -translate-y-1/2 overflow-y-auto rounded-2xl bg-white p-6 shadow-xl sm:inset-x-auto sm:left-1/2 sm:w-full sm:-translate-x-1/2 sm:p-8 ${SIZES[size] || SIZES.default}`}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-h4 font-display text-stone-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-stone-300 text-stone-700"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="mt-6">{children}</div>
      </div>
    </Portal>
  )
}
