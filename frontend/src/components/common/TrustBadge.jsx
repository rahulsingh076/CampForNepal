// Reassurance marker shown near booking decisions, e.g. a verification or guarantee.
const ICONS = {
  shield: <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z" />,
  check: <path d="M20 6L9 17l-5-5" />,
  star: <path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2-5.5-2.9-5.5 2.9 1-6.2L3 9.6l6.2-.9L12 3z" />,
  support: <path d="M4 13a8 8 0 0116 0v4a2 2 0 01-2 2h-2v-6h4M4 13v4a2 2 0 002 2h2v-6H4" />,
}

export default function TrustBadge({ icon = 'shield', label, description, className = '' }) {
  return (
    <div className={`flex items-start gap-3 ${className}`}>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-700">
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          {ICONS[icon]}
        </svg>
      </span>
      <span>
        <span className="block text-body font-semibold text-stone-900">{label}</span>
        {description && (
          <span className="mt-1 block text-small text-stone-600">{description}</span>
        )}
      </span>
    </div>
  )
}
