// What paperwork a booking still needs. Metadata only — no real uploads in V1.
export default function DocumentChecklist({ checklist = [] }) {
  if (checklist.length === 0) {
    return (
      <p className="text-small text-stone-600">
        No document metadata is listed for this stage yet.
      </p>
    )
  }

  return (
    <div>
      <ul className="space-y-2">
        {checklist.map((item) => (
          <li key={item.label} className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-small ${
                item.done ? 'bg-success-100 text-success-700' : 'border border-stone-300 bg-white text-stone-400'
              }`}
            >
              {item.done ? '✓' : ''}
            </span>
            <span className={`text-small ${item.done ? 'text-stone-600' : 'font-medium text-stone-900'}`}>
              {item.label}
              <span className="sr-only">{item.done ? ' — provided' : ' — still needed'}</span>
            </span>
          </li>
        ))}
      </ul>

      <p className="mt-4 rounded-lg bg-sand-100 p-3 text-small text-stone-600">
        Metadata only in frontend V1. Do not enter or upload passport, payment, health, or
        identity documents in this demo. Secure uploads arrive with the backend in Version 2.
      </p>
    </div>
  )
}
