import FormField from '../common/FormField.jsx'
import ReorderControls from './ReorderControls.jsx'

function blankSection() {
  return { heading: '', body: '' }
}

// A deliberately small structured editor for policy and information pages.
export default function SimpleSectionEditor({ label = 'Sections', value = [], onChange }) {
  function change(index, field, nextValue) {
    onChange(value.map((section, current) => current === index ? { ...section, [field]: nextValue } : section))
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
      <div className="mt-3 space-y-4">
        {value.map((section, index) => (
          <div key={`${section.heading}-${index}`} className="border border-stone-200 p-4" onKeyDown={(event) => {
            if (!event.altKey || !['ArrowUp', 'ArrowDown'].includes(event.key)) return
            event.preventDefault()
            move(index, event.key === 'ArrowUp' ? -1 : 1)
          }}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-small font-semibold text-stone-700">Section {index + 1}</p>
              <div className="flex items-center gap-2">
                <ReorderControls label={`section ${index + 1}`} index={index} total={value.length} onMove={(delta) => move(index, delta)} />
                <button type="button" onClick={() => onChange(value.filter((_, current) => current !== index))} className="rounded-md px-2 py-1 text-small font-semibold text-danger-700 hover:bg-danger-50">Remove</button>
              </div>
            </div>
            <div className="space-y-3">
              <FormField label="Heading" value={section.heading || ''} onChange={(event) => change(index, 'heading', event.target.value)} />
              <FormField label="Body" as="textarea" rows={5} value={section.body || ''} onChange={(event) => change(index, 'body', event.target.value)} />
            </div>
          </div>
        ))}
      </div>
      <button type="button" onClick={() => onChange([...value, blankSection()])} className="mt-3 rounded-md border border-stone-300 px-3 py-2 text-small font-semibold text-primary-800 hover:border-primary-600">Add section</button>
    </fieldset>
  )
}
