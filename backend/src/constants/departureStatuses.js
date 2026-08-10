// Lifecycle of a scheduled group departure. All seven appear in the frontend
// seed data and in docs/DATA_MODEL.md.
//
// These are canonical stored values. The interface renders "Booking open" from
// `booking_open` — never store the label.
export const DEPARTURE_STATUSES = Object.freeze([
  'draft',
  'booking_open',
  'almost_full',
  'guaranteed',
  'closed',
  'cancelled',
  'completed',
])

export const DEFAULT_DEPARTURE_STATUS = 'draft'

// A departure a visitor may still ask about. Used by future public reads.
export const BOOKABLE_DEPARTURE_STATUSES = Object.freeze([
  'booking_open',
  'almost_full',
  'guaranteed',
])
