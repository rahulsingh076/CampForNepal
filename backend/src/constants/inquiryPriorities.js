// How urgently staff should pick an inquiry up.
//
// Deliberately three values. A 1–5 scale invites arguments about what a 3
// means; three levels are a decision anyone can make consistently.
export const INQUIRY_PRIORITIES = Object.freeze(['normal', 'high', 'urgent'])

export const DEFAULT_INQUIRY_PRIORITY = 'normal'
export const URGENT_INQUIRY_PRIORITY = 'urgent'

// Priority is set by the server and changed only by authorised staff.
//
// It is never derived from nationality, country, budget, or anything else that
// stands in for "how much is this person worth". Someone asking about the
// cheapest trek gets the same queue position as someone asking about Everest.
export function isInquiryPriority(value) {
  return typeof value === 'string' && INQUIRY_PRIORITIES.includes(value)
}

export default INQUIRY_PRIORITIES
