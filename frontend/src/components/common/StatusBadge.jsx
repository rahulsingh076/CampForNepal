// Coloured badge for a record's state, e.g. a booking or inquiry status.
import Badge from './Badge.jsx'
import { statusLabel } from '../../lib/displayLabels.js'

// Every status the app can show, mapped to a tone. Each tone also carries its
// own glyph below, so meaning survives without colour.
const TONE_BY_STATUS = {
  // Booking state
  booked: 'success',
  inquiry_received: 'info',
  quotation_sent: 'info',
  booking_requested: 'cta',
  documents_pending: 'cta',
  booking_confirmed: 'success',
  guide_assigned: 'success',
  trip_ready: 'success',
  trip_started: 'brand',
  trip_completed: 'brand',
  review_requested: 'brand',
  cancelled: 'danger',
  closed: 'neutral',

  // Review moderation
  pending: 'cta',
  published: 'success',
  rejected: 'danger',

  // Fixed departures
  draft: 'neutral',
  booking_open: 'success',
  almost_full: 'cta',
  guaranteed: 'info',
  completed: 'brand',

  // Documents on a booking
  received: 'info',
  verified: 'success',

  // General record states
  in_review: 'cta',
  archived: 'neutral',
  hidden: 'neutral',
  suspended: 'danger',
  locked: 'neutral',
  v2_locked: 'neutral',
}

// Each tone carries its own glyph, because red and amber look identical to a
// red-green colourblind user. Shape and label do the work, colour only supports.
const ICONS = {
  neutral: <circle cx="12" cy="12" r="4" />,
  cta: <path d="M12 7v5l3 2M12 3a9 9 0 100 18 9 9 0 000-18z" />,
  success: <path d="M4 12.5l5 5L20 7" />,
  brand: <path d="M5 12l4.5 4.5L19 7M3 17l4.5 4.5" />,
  info: <path d="M12 11v6M12 7.5h.01M12 3a9 9 0 100 18 9 9 0 000-18z" />,
  danger: <path d="M7 7l10 10M17 7L7 17" />,
}

export default function StatusBadge({ status = 'draft', label, className = '' }) {
  const tone = TONE_BY_STATUS[status] || 'neutral'

  return (
    <Badge tone={tone} className={className}>
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
        {ICONS[tone]}
      </svg>
      {label || statusLabel(status)}
    </Badge>
  )
}
