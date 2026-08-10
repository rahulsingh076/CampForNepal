// Shown when something fails to load, with a way to try again.
export default function ErrorState({ title, description, action, className = '' }) {
  return (
    <div
      role="alert"
      className={`flex flex-col items-center rounded-xl border border-danger-200 bg-danger-50 px-6 py-16 text-center ${className}`}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-danger-100 text-danger-700">
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
          <path d="M12 8v5" />
          <path d="M12 16.5h.01" />
          <circle cx="12" cy="12" r="9" />
        </svg>
      </span>
      <h3 className="mt-4 text-h4 font-display text-stone-900">{title}</h3>
      {description && (
        <p className="mt-2 max-w-md text-body text-stone-700">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
