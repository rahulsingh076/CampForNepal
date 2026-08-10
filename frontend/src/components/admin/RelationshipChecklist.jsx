export default function RelationshipChecklist({ label, options = [], value = [], onChange, hint }) {
  function toggle(id) {
    onChange(value.includes(id) ? value.filter((item) => item !== id) : [...value, id])
  }

  return (
    <fieldset>
      <legend className="text-small font-semibold text-stone-800">{label}</legend>
      {hint && <p className="mt-1 text-small text-stone-600">{hint}</p>}
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {options.map((option) => (
          <label key={option.id} className="flex min-w-0 items-center gap-3 border border-stone-200 px-3 py-2 text-small text-stone-800">
            <input type="checkbox" checked={value.includes(option.id)} onChange={() => toggle(option.id)} className="h-4 w-4 rounded border-stone-400 text-primary-700 focus:ring-primary-600" />
            <span className="truncate">{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
