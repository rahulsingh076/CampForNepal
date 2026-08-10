// Email normalisation and shape checking.
//
// Only normalisation that is always safe: trim and lowercase. Gmail dot- and
// plus-stripping is NOT done — those are provider-specific, and applying them
// would merge two addresses a user considers distinct.
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function normalizeEmail(value) {
  if (typeof value !== 'string') return ''
  return value.trim().toLowerCase()
}

export function isValidEmail(value) {
  const email = normalizeEmail(value)
  return email.length > 0 && email.length <= 254 && EMAIL_SHAPE.test(email)
}

export default { normalizeEmail, isValidEmail }
