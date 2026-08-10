// Labelled form control (input, select, or textarea) with hint and error text.
import { useId } from 'react'

// stone-500 is the lightest border that meets the 3:1 minimum for a control outline,
// and the lightest placeholder that stays readable. Do not lighten either.
const CONTROL =
  'min-h-12 w-full rounded-lg border bg-white px-4 py-3 text-body text-stone-900 ' +
  'placeholder:text-stone-500 transition-colors duration-200 ' +
  'focus-visible:border-primary-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500 ' +
  'disabled:cursor-not-allowed disabled:bg-sand-100 disabled:text-stone-600'

function SelectOptions({ options }) {
  return options.map((option) => {
    if (option.options) {
      return (
        <optgroup key={option.label} label={option.label}>
          <SelectOptions options={option.options} />
        </optgroup>
      )
    }

    return (
      <option key={option.value} value={option.value} disabled={option.disabled}>
        {option.label}
      </option>
    )
  })
}

export default function FormField({
  label,
  as = 'input',
  type = 'text',
  hint,
  error,
  required = false,
  optional = false,
  options = [],
  loading = false,
  id: providedId,
  className = '',
  ...rest
}) {
  const generatedId = useId()
  const id = providedId || generatedId
  const hintId = `${id}-hint`
  const errorId = `${id}-error`

  // The hint is hidden while an error shows, so only reference what is on screen.
  const describedBy = [hint && !error ? hintId : null, error ? errorId : null]
    .filter(Boolean)
    .join(' ')

  const controlClasses = `${CONTROL} ${as === 'select' ? 'cursor-pointer appearance-none pr-12' : ''} ${
    error ? 'border-danger-500' : 'border-stone-500 hover:border-stone-600'
  }`

  const shared = {
    ...rest,
    id,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': describedBy || undefined,
    'aria-busy': loading || undefined,
    required,
    disabled: rest.disabled || loading,
    className: controlClasses,
  }

  return (
    <div className={className}>
      <label htmlFor={id} className="block text-small font-semibold text-stone-800">
        {label}
        {required && (
          <span className="text-danger-600" aria-hidden="true">
            {' '}
            *
          </span>
        )}
        {optional && <span className="font-normal text-stone-600"> (optional)</span>}
      </label>

      <div className={`mt-2 ${as === 'select' ? 'relative' : ''}`}>
        {as === 'textarea' ? (
          <textarea rows={4} {...shared} />
        ) : as === 'select' ? (
          <>
            <select {...shared}>
              <SelectOptions options={options} />
            </select>
            <svg
              className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-600"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="m7 10 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </>
        ) : (
          // Anything else falls back to an input so a control always renders.
          <input type={type} {...shared} />
        )}
      </div>

      {hint && !error && (
        <p id={hintId} className="mt-2 text-small text-stone-600">
          {hint}
        </p>
      )}

      {error && (
        <p id={errorId} role="alert" className="mt-2 text-small font-medium text-danger-700">
          {error}
        </p>
      )}
    </div>
  )
}
