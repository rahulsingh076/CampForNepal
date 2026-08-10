// Where an inquiry came from. Server-decided: a request body cannot pick one,
// or every spam submission would claim to be `admin`.
export const INQUIRY_SOURCES = Object.freeze(['website', 'customer_dashboard', 'admin'])

// Everything the public endpoint creates. `customer_dashboard` is reserved for
// a signed-in customer endpoint, and `admin` for staff-created inquiries;
// neither exists yet.
export const DEFAULT_INQUIRY_SOURCE = 'website'

export function isInquirySource(value) {
  return typeof value === 'string' && INQUIRY_SOURCES.includes(value)
}

export default INQUIRY_SOURCES
