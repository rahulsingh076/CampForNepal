// Admin-only status variants cover operations records in addition to public states.
import Badge from '../common/Badge.jsx'

const VARIANTS = {
  neutral: { tone: 'neutral', icon: <circle cx="12" cy="12" r="4" /> },
  info: { tone: 'info', icon: <path d="M12 11v6M12 7.5h.01M12 3a9 9 0 100 18 9 9 0 000-18z" /> },
  warning: { tone: 'cta', icon: <path d="M12 7v5l3 2M12 3a9 9 0 100 18 9 9 0 000-18z" /> },
  success: { tone: 'success', icon: <path d="M4 12.5l5 5L20 7" /> },
  danger: { tone: 'danger', icon: <path d="M7 7l10 10M17 7L7 17" /> },
  brand: { tone: 'brand', icon: <path d="M5 12l4.5 4.5L19 7M3 17l4.5 4.5" /> },
}

const STATUS_VARIANTS = {
  new: 'info',
  contacted: 'info',
  quoted: 'warning',
  converted: 'success',
  closed: 'neutral',
  lost: 'danger',
  booked: 'success',
  inquiry_received: 'info',
  quotation_sent: 'info',
  booking_requested: 'warning',
  documents_pending: 'warning',
  booking_confirmed: 'success',
  guide_assigned: 'success',
  trip_ready: 'success',
  trip_started: 'brand',
  trip_completed: 'brand',
  review_requested: 'brand',
  cancelled: 'danger',
  pending: 'warning',
  published: 'success',
  archived: 'neutral',
  hidden: 'neutral',
  suspended: 'danger',
  locked: 'neutral',
  v2_locked: 'neutral',
  rejected: 'danger',
  draft: 'neutral',
  booking_open: 'success',
  almost_full: 'warning',
  guaranteed: 'info',
  completed: 'brand',
  received: 'info',
  verified: 'success',
}

export default function StatusBadge({ status, label, variant, className = '' }) {
  const resolved = VARIANTS[variant || STATUS_VARIANTS[status] || 'neutral']

  return (
    <Badge tone={resolved.tone} className={className}>
      <svg
        className="h-3.5 w-3.5 shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {resolved.icon}
      </svg>
      {label || String(status || variant || 'status').replace(/_/g, ' ')}
    </Badge>
  )
}
