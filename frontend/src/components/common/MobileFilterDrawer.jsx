// A focus-managed mobile filter sheet. Selections stay local until Apply is pressed.
import { useEffect, useRef, useState } from 'react'
import Button from './Button.jsx'
import FormField from './FormField.jsx'
import Portal from './Portal.jsx'

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

function valuesFrom(filters) {
  return Object.fromEntries(filters.map((filter) => [filter.name, filter.value]))
}

function appliedCount(filters, values) {
  return filters.filter((filter) => filter.countsAsFilter !== false && values[filter.name]).length
}

export default function MobileFilterDrawer({ open, onClose, filters, onApply, onReset }) {
  const [draft, setDraft] = useState(() => valuesFrom(filters))
  const panelRef = useRef(null)
  const closeRef = useRef(null)
  const restoreFocusRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined

    restoreFocusRef.current = document.activeElement
    setDraft(valuesFrom(filters))
    const previousOverflow = document.body.style.overflow
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key !== 'Tab') return

      const controls = panelRef.current?.querySelectorAll(FOCUSABLE) || []
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
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeyDown)
      restoreFocusRef.current?.focus?.()
    }
  }, [filters, onClose, open])

  if (!open) return null

  const count = appliedCount(filters, draft)

  return (
    <Portal>
      <div className="lg:hidden">
        <button type="button" aria-label="Close filters" onClick={onClose} className="fixed inset-0 z-overlay bg-primary-900/50" />
        <section ref={panelRef} role="dialog" aria-modal="true" aria-label="Filters" className="safe-area-cta fixed inset-x-0 bottom-0 z-modal max-h-[85vh] overflow-y-auto rounded-t-xl bg-white px-6 pt-6 shadow-xl">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-h4 font-display text-stone-900">Filters</h2>
              <p className="mt-1 text-small text-stone-600">{count ? `${count} filter${count === 1 ? '' : 's'} selected` : 'All results selected'}</p>
            </div>
            <button ref={closeRef} type="button" onClick={onClose} aria-label="Close filters" className="flex h-11 w-11 items-center justify-center rounded-lg border border-stone-300 text-stone-800">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" /></svg>
            </button>
          </div>

          <div className="mt-6 grid gap-4">
            {filters.map((filter) => (
              <FormField
                key={filter.name}
                label={filter.label}
                as={filter.control === 'search' ? 'input' : 'select'}
                type={filter.control === 'search' ? 'search' : undefined}
                placeholder={filter.placeholder}
                value={draft[filter.name] || ''}
                onChange={(event) => setDraft((current) => ({ ...current, [filter.name]: event.target.value }))}
                options={filter.control === 'search' ? [] : [{ value: '', label: filter.anyLabel }, ...filter.options]}
              />
            ))}
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 border-t border-stone-200 pt-5">
            <Button variant="secondary" className="min-h-11" onClick={() => { setDraft(Object.fromEntries(filters.map((filter) => [filter.name, '']))); onReset(); onClose() }}>
              Reset
            </Button>
            <Button className="min-h-11" onClick={() => { onApply(draft); onClose() }}>
              Apply filters
            </Button>
          </div>
        </section>
      </div>
    </Portal>
  )
}
