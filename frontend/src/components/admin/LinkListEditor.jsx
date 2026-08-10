import FormField from '../common/FormField.jsx'
import ReorderControls from './ReorderControls.jsx'

function blankLink() {
  return { label: '', path: '' }
}

// Shared by navigation and footer content. Links stay as real objects rather
// than a fragile newline convention.
export default function LinkListEditor({ label, value = [], onChange }) {
  function change(index, field, nextValue) {
    onChange(value.map((link, current) => current === index ? { ...link, [field]: nextValue } : link))
  }

  function move(index, delta) {
    const destination = index + delta
    if (destination < 0 || destination >= value.length) return
    const next = [...value]
    ;[next[index], next[destination]] = [next[destination], next[index]]
    onChange(next)
  }

  return (
    <fieldset>
      <legend className="text-small font-semibold text-stone-800">{label}</legend>
      <div className="mt-3 space-y-3">
        {value.map((link, index) => (
          <div key={`${link.label}-${index}`} className="grid gap-3 border border-stone-200 p-3 sm:grid-cols-[minmax(0,1fr),minmax(0,1fr),auto] sm:items-end">
            <FormField label={`Label ${index + 1}`} value={link.label || ''} onChange={(event) => change(index, 'label', event.target.value)} />
            <FormField label={`Link ${index + 1}`} value={link.path || ''} onChange={(event) => change(index, 'path', event.target.value)} />
            <div className="flex items-center gap-2 sm:pb-0.5">
              <ReorderControls label={`${label} link ${index + 1}`} index={index} total={value.length} onMove={(delta) => move(index, delta)} />
              <button type="button" onClick={() => onChange(value.filter((_, current) => current !== index))} className="rounded-md px-2 py-1 text-small font-semibold text-danger-700 hover:bg-danger-50">Remove</button>
            </div>
          </div>
        ))}
      </div>
      <button type="button" onClick={() => onChange([...value, blankLink()])} className="mt-3 rounded-md border border-stone-300 px-3 py-2 text-small font-semibold text-primary-800 hover:border-primary-600">Add link</button>
    </fieldset>
  )
}
