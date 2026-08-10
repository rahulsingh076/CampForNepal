// Placeholder shown while data loads: skeleton bars or a compact inline spinner.
export default function LoadingState({ label = 'Loading', rows = 3, variant = 'skeleton' }) {
  if (variant === 'inline') {
    return (
      <div className="flex items-center gap-3 text-stone-600" role="status" aria-live="polite">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-stone-300 border-t-primary-700" />
        <span className="text-small">{label}</span>
      </div>
    )
  }

  // aria-busy is deliberately not set here: on a role="status" node it tells
  // assistive tech to hold the announcement, which is the opposite of the point.
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="animate-pulse rounded-lg bg-sand-200 h-4" />
        ))}
      </div>
    </div>
  )
}
