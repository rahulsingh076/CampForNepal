// The six inquiry types, exactly as the frontend already produces them.
//
// Every public form funnels through one `createInquiry` call with a `type`
// field, so this list is the contract — not a backend invention. Values are
// machine-readable; the friendly label ("Package inquiry") belongs in the
// frontend formatter, never in the stored field.
export const INQUIRY_TYPES = Object.freeze([
  'package_inquiry',
  'custom_trip',
  'contact',
  'callback',
  'guide_request',
  'emergency',
])

export const DEFAULT_INQUIRY_TYPE = 'contact'

// `emergency` is canonical — the admin CRM filters on it and seed records use
// it — but no public form produces one yet. The type is supported so the CRM
// keeps working and so a future urgent-support form has somewhere to land.
export const EMERGENCY_INQUIRY_TYPE = 'emergency'

export function isInquiryType(value) {
  return typeof value === 'string' && INQUIRY_TYPES.includes(value)
}

export default INQUIRY_TYPES
