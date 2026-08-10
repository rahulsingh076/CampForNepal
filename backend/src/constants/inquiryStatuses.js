// The inquiry lifecycle, and the only moves allowed through it.
//
// The six values match the frontend's CRM exactly. The transition map is the
// part that matters: without it, "status" is a free-text field and the history
// stops meaning anything.
export const INQUIRY_STATUSES = Object.freeze([
  'new',
  'contacted',
  'quoted',
  'converted',
  'lost',
  'closed',
])

// Every public submission starts here. A request body cannot choose otherwise.
export const DEFAULT_INQUIRY_STATUS = 'new'

// Set only by the future booking conversion flow. No CRM route may write it,
// and `allowedTransitions` never offers it — an inquiry becomes `converted`
// because a booking was created, not because somebody picked it from a menu.
export const CONVERTED_STATUS = 'converted'

// Deliberately one-directional. An inquiry moves forward or it ends; it never
// goes back to `new`. Reopening a closed inquiry would need its own endpoint
// with its own audit trail, which is outside the current CRM scope.
export const INQUIRY_TRANSITIONS = Object.freeze({
  new: Object.freeze(['contacted', 'lost', 'closed']),
  contacted: Object.freeze(['quoted', 'lost', 'closed']),
  quoted: Object.freeze(['lost', 'closed']),
  // Reachable only through booking conversion, and only ever closed afterwards.
  converted: Object.freeze(['closed']),
  lost: Object.freeze(['closed']),
  // Terminal. Nothing leaves `closed` in the current CRM scope.
  closed: Object.freeze([]),
})

export function isInquiryStatus(value) {
  return typeof value === 'string' && INQUIRY_STATUSES.includes(value)
}

// The moves a human may make from here. `converted` is filtered out even from
// a status that could technically reach it, so the API surface cannot offer it.
export function allowedTransitions(fromStatus) {
  const allowed = INQUIRY_TRANSITIONS[fromStatus] || []
  return allowed.filter((status) => status !== CONVERTED_STATUS)
}

export function canTransition(fromStatus, toStatus) {
  if (!isInquiryStatus(fromStatus) || !isInquiryStatus(toStatus)) return false
  return allowedTransitions(fromStatus).includes(toStatus)
}

export default INQUIRY_STATUSES
