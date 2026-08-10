// Sticky save controls for long singleton-backed admin editors.
export default function AdminSaveBar({ editor, onSave, saveLabel = 'Save changes', previewPath, previewEnabled = false }) {
  const save = onSave || (() => editor.save(`${saveLabel}.`))

  return (
    <div className="sticky bottom-4 z-20 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-stone-200 bg-white p-3 shadow-lg">
      <p aria-live="polite" className="text-small text-stone-600">{editor.dirty ? 'Unsaved changes' : 'All changes saved'}</p>
      <div className="flex flex-wrap items-center justify-end gap-2">
        {previewPath && (previewEnabled ? <a href={previewPath} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center rounded-md px-3 py-2 text-small font-semibold text-primary-800 hover:bg-primary-50">Preview public page</a> : <span className="inline-flex min-h-11 items-center px-3 py-2 text-small text-stone-500" title="Save the public content before previewing it">Preview after saving</span>)}
        {editor.dirty && <button type="button" onClick={editor.discard} disabled={editor.busy} className="min-h-11 rounded-lg border border-stone-300 px-4 py-2 text-small font-semibold text-stone-800 hover:border-stone-400 disabled:opacity-60">Cancel changes</button>}
        <button type="button" onClick={save} disabled={editor.busy || !editor.dirty} className="min-h-11 rounded-lg bg-primary-700 px-4 py-2 text-small font-semibold text-white hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-60">{editor.busy ? 'Saving...' : saveLabel}</button>
      </div>
    </div>
  )
}
