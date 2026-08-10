// Turns an untrusted request body into a small set of known-good values.
//
// Two jobs beyond shape checking:
//
//   1. Type checking. A JSON body can contain an object where a string is
//      expected — `{"email": {"$ne": null}}` is a real attack against code that
//      passes a body field straight into a query.
//   2. Whitelisting. Only the named fields are returned, so `role`, `status`,
//      or `passwordHash` in a registration body is dropped rather than assigned.
import ApiError from '../../utils/ApiError.js'
import { isValidEmail, normalizeEmail } from '../../utils/email.js'
import { MAX_PASSWORD_LENGTH, validatePasswordPolicy } from '../../utils/password.js'

// Only the three the User model stores. Anything else in `preferences` is
// dropped here rather than relied on `strict: true` to reject later.
const PREFERENCE_FIELDS = ['country', 'language', 'currency']
const MAX_PREFERENCE_LENGTH = 100

function requireString(value, message) {
  if (typeof value !== 'string') throw ApiError.badRequest(message)
  return value
}

function cleanEmail(value) {
  requireString(value, 'An email address is required.')
  const email = normalizeEmail(value)
  if (!isValidEmail(email)) throw ApiError.badRequest('That does not look like an email address.')
  return email
}

function cleanName(value) {
  requireString(value, 'A name is required.')
  const fullName = value.trim()
  if (fullName.length < 2) throw ApiError.badRequest('A name must be at least 2 characters.')
  if (fullName.length > 200) throw ApiError.badRequest('A name cannot be longer than 200 characters.')
  return fullName
}

// Optional throughout. A missing or malformed preferences object is not worth
// failing a registration over — it is dropped.
function cleanPreferences(value) {
  if (value === undefined || value === null) return {}
  if (typeof value !== 'object' || Array.isArray(value)) {
    throw ApiError.badRequest('Preferences must be an object.')
  }

  const preferences = {}
  for (const field of PREFERENCE_FIELDS) {
    const entry = value[field]
    if (entry === undefined || entry === null) continue
    requireString(entry, `"${field}" must be text.`)
    const trimmed = entry.trim()
    if (trimmed.length === 0) continue
    if (trimmed.length > MAX_PREFERENCE_LENGTH) {
      throw ApiError.badRequest(`"${field}" is too long.`)
    }
    preferences[field] = trimmed
  }
  return preferences
}

// Login must not apply the policy: an account created under older rules would
// be told its own password is invalid, and the exact rules would be echoed to
// anyone probing the endpoint. Only the type and an upper bound are checked,
// and a value outside them fails as a credential error rather than a 400.
function cleanSubmittedPassword(value) {
  requireString(value, 'A password is required.')
  if (value.length === 0 || value.length > MAX_PASSWORD_LENGTH) {
    throw ApiError.unauthorized('Invalid email or password.')
  }
  return value
}

export function validateRegistration(body = {}) {
  const fullName = cleanName(body.fullName)
  const email = cleanEmail(body.email)
  const preferences = cleanPreferences(body.preferences)

  requireString(body.password, 'A password is required.')
  // New passwords do get the full policy — this is the moment to enforce it.
  validatePasswordPolicy(body.password)

  // role, status, and passwordHash are intentionally absent: public
  // registration always creates an active customer, whatever the body says.
  return { fullName, email, password: body.password, preferences }
}

export function validateLogin(body = {}) {
  return {
    email: cleanEmail(body.email),
    password: cleanSubmittedPassword(body.password),
  }
}

export function validatePasswordChange(body = {}) {
  const currentPassword = cleanSubmittedPassword(body.currentPassword)

  requireString(body.newPassword, 'A new password is required.')
  validatePasswordPolicy(body.newPassword)

  if (body.newPassword === currentPassword) {
    throw ApiError.badRequest('The new password must be different from the current one.')
  }
  return { currentPassword, newPassword: body.newPassword }
}

export default { validateRegistration, validateLogin, validatePasswordChange }
