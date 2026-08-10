function IconButton({ label, onClick, children, disabled = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-stone-300 text-stone-700 hover:border-primary-600 hover:text-primary-800 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  )
}

// Used for the short, ordered lists a trip editor needs without a separate sub-form.
export default function StringListEditor({ label, value = [], onChange, hint, addLabel = 'Add item' }) {
  const items = value.length ? value : []

  function change(index, nextValue) {
    onChange(items.map((item, itemIndex) => (itemIndex === index ? nextValue : item)))
  }

  function remove(index) {
    onChange(items.filter((_, itemIndex) => itemIndex !== index))
  }

  function move(index, direction) {
    const nextIndex = index + direction
    if (nextIndex < 0 || nextIndex >= items.length) return
    const next = [...items]
    ;[next[index], next[nextIndex]] = [next[nextIndex], next[index]]
    onChange(next)
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-small font-semibold text-stone-800">{label}</p>
          {hint && <p className="mt-1 text-small text-stone-600">{hint}</p>}
        </div>
        <button
          type="button"
          onClick={() => onChange([...items, ''])}
          className="rounded-md border border-stone-300 px-3 py-1.5 text-small font-semibold text-primary-800 hover:border-primary-600 hover:bg-primary-50"
        >
          {addLabel}
        </button>
      </div>
      <div className="mt-3 divide-y divide-stone-200 border-y border-stone-200">
        {items.map((item, index) => (
          <div key={`${index}-${item}`} className="flex gap-2 py-2">
            <input
              value={item}
              onChange={(event) => change(index, event.target.value)}
              aria-label={`${label} item ${index + 1}`}
              className="min-w-0 flex-1 rounded-md border border-stone-300 px-3 py-2 text-small text-stone-900"
            />
            <IconButton label={`Move ${label} item up`} onClick={() => move(index, -1)} disabled={index === 0}>
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 14 6-6 6 6" /></svg>
            </IconButton>
            <IconButton label={`Move ${label} item down`} onClick={() => move(index, 1)} disabled={index === items.length - 1}>
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 10 6 6 6-6" /></svg>
            </IconButton>
            <IconButton label={`Remove ${label} item`} onClick={() => remove(index)}>
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M18 6 6 18" /></svg>
            </IconButton>
          </div>
        ))}
      </div>
    </div>
  )
}
