import FormField from '../common/FormField.jsx'

export default function FaqEditor({ value = [], onChange }) {
  const items = value.length ? value : []

  function update(index, field, nextValue) {
    onChange(items.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: nextValue } : item)))
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-small font-semibold text-stone-800">Frequently asked questions</p>
          <p className="mt-1 text-small text-stone-600">Answers display on the public trip page.</p>
        </div>
        <button type="button" onClick={() => onChange([...items, { question: '', answer: '' }])} className="rounded-md border border-stone-300 px-3 py-1.5 text-small font-semibold text-primary-800 hover:border-primary-600 hover:bg-primary-50">Add FAQ</button>
      </div>
      <div className="mt-3 divide-y divide-stone-200 border-y border-stone-200">
        {items.map((item, index) => (
          <div key={`${index}-${item.question}`} className="grid gap-4 py-4 sm:grid-cols-[1fr,1fr,2.25rem] sm:items-end">
            <FormField label={`Question ${index + 1}`} value={item.question || ''} onChange={(event) => update(index, 'question', event.target.value)} />
            <FormField label={`Answer ${index + 1}`} as="textarea" rows={3} value={item.answer || ''} onChange={(event) => update(index, 'answer', event.target.value)} />
            <button type="button" onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))} aria-label={`Remove FAQ ${index + 1}`} title={`Remove FAQ ${index + 1}`} className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-stone-300 text-stone-700 hover:border-danger-600 hover:text-danger-700">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M18 6 6 18" /></svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
