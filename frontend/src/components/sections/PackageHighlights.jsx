// The short list of what makes a trip worth doing.
export default function PackageHighlights({ highlights }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {highlights.map((highlight) => (
        <li key={highlight.slice(0, 40)} className="flex gap-3">
          <svg className="mt-1 h-4 w-4 shrink-0 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <path d="M4 12.5l5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-body text-stone-700">{highlight}</span>
        </li>
      ))}
    </ul>
  )
}
