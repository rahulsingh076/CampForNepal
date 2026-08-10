// Shown when a list or search has no results, with an optional next step.
export default function EmptyState({ title, description, action, actions = [], className = '' }) {
  const availableActions = [...actions, action].filter(Boolean)

  return (
    <div
      className={`flex flex-col items-center rounded-xl border border-dashed border-stone-300 bg-sand-50 px-6 py-16 text-center ${className}`}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-sand-200 text-stone-500">
        <svg
          className="h-6 w-6"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" />
        </svg>
      </span>
      <h3 className="mt-4 text-h4 font-display text-stone-900">{title}</h3>
      {description && (
        <p className="mt-2 max-w-md text-body text-stone-600">{description}</p>
      )}
      {availableActions.length > 0 && (
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {availableActions.map((item, index) => <div key={index}>{item}</div>)}
        </div>
      )}
    </div>
  )
}
