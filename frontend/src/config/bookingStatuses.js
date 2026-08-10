// Booking is intentionally simple: public/customer-facing state is only
// booked or cancelled. All planning details belong in the private chat.

export const BOOKING_STATUS_OPTIONS = [
  { status: 'booked', label: 'Booked' },
  { status: 'cancelled', label: 'Cancelled' },
]

export const BOOKING_PIPELINE = [{ status: 'booked', label: 'Booked' }]
export const BOOKING_SIDE_STATES = [{ status: 'cancelled', label: 'Cancelled' }]

const LEGACY_BOOKED_STATUSES = new Set([
  'inquiry_received',
  'quotation_sent',
  'booking_requested',
  'documents_pending',
  'booking_confirmed',
  'guide_assigned',
  'trip_ready',
  'trip_started',
  'trip_completed',
  'review_requested',
  'closed',
])

export function normalizeBookingStatus(status) {
  if (status === 'cancelled') return 'cancelled'
  if (status === 'booked' || LEGACY_BOOKED_STATUSES.has(status)) return 'booked'
  return 'booked'
}

export function pipelineIndex(status) {
  return normalizeBookingStatus(status) === 'booked' ? 0 : -1
}

export function bookingStatusLabel(status) {
  return BOOKING_STATUS_OPTIONS.find((step) => step.status === normalizeBookingStatus(status))?.label || 'Booked'
}

export function isFinishedBooking(status) {
  return normalizeBookingStatus(status) === 'cancelled'
}

export function canReviewBooking() {
  return false
}
