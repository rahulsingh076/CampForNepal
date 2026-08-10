// Shared editor dialog with unsaved-change protection, section links, and a sticky save bar.
import { useEffect } from 'react'
import Modal from '../common/Modal.jsx'

function readableFieldName(name) {
  return String(name).replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').replace(/^./, (letter) => letter.toUpperCase())
}

export default function ModalForm({
  open,
  onClose,
  onSubmit,
  title,
  submitLabel = 'Save',
  busy,
  dirty = false,
  size,
  sections = [],
  errors = {},
  previewPath,
  previewEnabled = false,
  children,
}) {
  const invalid = Object.entries(errors).filter(([, message]) => Boolean(message))

  useEffect(() => {
    if (!open || !dirty) return undefined
    function warnBeforeUnload(event) {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warnBeforeUnload)
    return () => window.removeEventListener('beforeunload', warnBeforeUnload)
  }, [dirty, open])

  useEffect(() => {
    if (!open || invalid.length === 0) return
    // Scoped to the dialog: a document-wide query returns the first invalid
    // field in the page behind it, which yanks focus out of the open form.
    const frame = window.requestAnimationFrame(() =>
      document.querySelector('[role="dialog"] [aria-invalid="true"]')?.focus()
    )
    return () => window.cancelAnimationFrame(frame)
  }, [invalid.length, open])

  function requestClose() {
    if (busy) return
    if (dirty && !window.confirm('Discard unsaved changes?')) return
    onClose()
  }

  return (
    <Modal open={open} onClose={requestClose} title={title} size={size}>
      <form noValidate onSubmit={onSubmit} className="space-y-6">
        {sections.length > 0 && (
          <nav aria-label="Form sections" className="sticky top-0 z-10 -mx-1 overflow-x-auto border-y border-stone-200 bg-white px-1 py-3">
            <ul className="flex min-w-max gap-2">
              {sections.map((section) => <li key={section.id}><a href={`#${section.id}`} className="rounded-md px-3 py-2 text-small font-semibold text-primary-800 hover:bg-primary-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700">{section.label}</a></li>)}
            </ul>
          </nav>
        )}

        {invalid.length > 0 && (
          <div role="alert" className="rounded-lg border border-danger-500 bg-danger-50 p-4 text-small text-danger-900">
            <p className="font-semibold">Check the highlighted fields before saving.</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {invalid.map(([name, message]) => <li key={name}>{readableFieldName(name)}: {message}</li>)}
            </ul>
          </div>
        )}

        {children}

        <div className="sticky bottom-0 z-10 -mx-1 flex flex-wrap items-center justify-between gap-3 border-t border-stone-200 bg-white px-1 pt-5 pb-1">
          <div>
            {previewPath && (previewEnabled ? <a href={previewPath} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center rounded-md px-3 py-2 text-small font-semibold text-primary-800 hover:bg-primary-50">Preview public page</a> : <span className="inline-flex min-h-11 items-center px-3 py-2 text-small text-stone-500" title="Publish this record before opening its public page">Public preview after publication</span>)}
          </div>
          <div className="flex flex-wrap justify-end gap-3">
            <button type="button" onClick={requestClose} disabled={busy} className="min-h-11 rounded-lg border border-stone-300 px-4 py-2 text-small font-semibold text-stone-800 hover:border-stone-400 disabled:cursor-not-allowed disabled:opacity-60">{dirty ? 'Discard changes' : 'Cancel'}</button>
            <button type="submit" disabled={busy} className="min-h-11 rounded-lg bg-primary-700 px-4 py-2 text-small font-semibold text-white transition-colors duration-200 hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-60">{busy ? 'Saving...' : submitLabel}</button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
