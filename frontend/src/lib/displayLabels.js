// Turns stored enum-style values into consistent visitor-facing language.
const DIFFICULTIES = {
  easy: { label: 'Easy', help: 'A relaxed pace for most active travellers.' },
  'easy to moderate': { label: 'Easy to moderate', help: 'Mostly gentle days with a few longer or steeper sections.' },
  moderate: { label: 'Moderate', help: 'Regular active days with uneven ground or some sustained climbs.' },
  challenging: { label: 'Challenging', help: 'Longer active days and sustained climbs; preparation helps.' },
  strenuous: { label: 'Strenuous', help: 'Demanding days at pace, often with substantial elevation or altitude.' },
  'strenuous and technical': { label: 'Strenuous and technical', help: 'Demanding terrain and technical skills in addition to fitness.' },
  extreme: { label: 'Extreme', help: 'A specialist objective requiring substantial preparation and experience.' },
}

export function humanizeCode(value) {
  return String(value || '')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function difficultyDetails(value) {
  const key = String(value || '').trim().toLowerCase().replace(/[_-]+/g, ' ')
  return DIFFICULTIES[key] || { label: humanizeCode(value), help: '' }
}

export function statusLabel(status) {
  const labels = {
    booked: 'Booked',
    inquiry_received: 'Inquiry received',
    quotation_sent: 'Quotation sent',
    booking_requested: 'Booking requested',
    documents_pending: 'Documents pending',
    booking_confirmed: 'Booking confirmed',
    guide_assigned: 'Guide assigned',
    trip_ready: 'Trip ready',
    trip_started: 'Trip started',
    trip_completed: 'Trip completed',
    review_requested: 'Review requested',
    booking_open: 'Booking open',
    almost_full: 'Almost full',
    guaranteed: 'Guaranteed to run',
    in_review: 'In review',
  }

  return labels[status] || humanizeCode(status)
}
