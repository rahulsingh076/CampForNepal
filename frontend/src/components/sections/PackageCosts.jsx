// What the price covers and what it does not, side by side.
function CostList({ heading, items, tone }) {
  const isIncluded = tone === 'included'

  return (
    <section className={`overflow-hidden rounded-xl border ${isIncluded ? 'border-success-200 bg-success-50' : 'border-stone-200 bg-white'}`}>
      <h3 className="border-b border-stone-200 px-5 py-4 text-h4 font-display text-stone-900">{heading}</h3>
      <ul className="divide-y divide-stone-200">
        {items.map((entry) => (
          <li key={entry.slice(0, 40)} className="flex min-h-12 gap-3 px-5 py-3">
            <svg
              className={`mt-1 h-4 w-4 shrink-0 ${isIncluded ? 'text-success-600' : 'text-stone-400'}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              aria-hidden="true"
            >
              {isIncluded ? (
                <path d="M4 12.5l5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
              ) : (
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              )}
            </svg>
            <span className="text-body text-stone-700">{entry}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default function PackageCosts({ includes, excludes }) {
  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <CostList heading="What the price includes" items={includes} tone="included" />
      <CostList heading="What it does not include" items={excludes} tone="excluded" />
    </div>
  )
}
