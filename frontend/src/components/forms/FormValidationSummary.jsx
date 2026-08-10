// Links a submitted form's invalid fields to their persistent labels and controls.
export default function FormValidationSummary({ errors, fields, formId, show }) {
  const invalid = fields.filter((field) => errors[field.name])

  if (!show || invalid.length === 0) return null

  function focusField(event, name) {
    event.preventDefault()
    document.getElementById(`${formId}-${name}`)?.focus()
  }

  return (
    <div role="alert" className="rounded-lg border border-danger-500 bg-danger-50 p-4 text-small text-danger-900">
      <p className="font-semibold">Check the highlighted fields.</p>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        {invalid.map((field) => (
          <li key={field.name}>
            <a href={`#${formId}-${field.name}`} onClick={(event) => focusField(event, field.name)} className="underline underline-offset-4">
              {field.label}: {errors[field.name]}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
