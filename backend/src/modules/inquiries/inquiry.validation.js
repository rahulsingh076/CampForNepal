// Turns an untrusted public form body into a known-good inquiry.
//
// Three jobs, in order of how badly they go wrong when skipped:
//
//   1. Refuse privileged fields. A body containing `status`, `priority`, or
//      `assignedToUserId` is not a mistake to tidy up — it is somebody trying
//      to file a pre-assigned, high-priority, already-contacted inquiry. Those
//      are rejected loudly rather than stripped quietly.
//   2. Refuse the wrong shape. `{"email": {"$ne": null}}` is an injection
//      attempt against any code that passes a body field into a query.
//   3. Normalise. The frontend has five forms that name the same concept
//      differently; both spellings are accepted and one is stored.
//
// Errors accumulate into a field map so a person fixes their whole form once
// instead of one field per submission.
import { INQUIRY_TYPES, isInquiryType } from '../../constants/inquiryTypes.js'
import ApiError from '../../utils/ApiError.js'
import { isValidEmail, normalizeEmail } from '../../utils/email.js'
import { hasUnsafeCharacters, toPlainLine, toPlainText } from '../../utils/plainText.js'

// Never accepted from a public request, at any nesting level. Each one either
// grants privilege, rewrites history, or belongs to authentication.
const FORBIDDEN_FIELDS = Object.freeze([
  'status',
  'priority',
  'source',
  'assignedToUserId',
  'assignedTo',
  'userId',
  'internalNotes',
  'statusHistory',
  'convertedBookingId',
  'referenceCode',
  'idempotencyKeyHash',
  'spamSignals',
  'submissionMetadata',
  'consentAcceptedAt',
  'privacyPolicyVersion',
  'password',
  'passwordHash',
  'role',
  'sessionVersion',
  'createdAt',
  'updatedAt',
  '_id',
  'id',
])

// Everything a public form may send. The frontend spellings and the canonical
// ones both appear, because five forms disagree and rejecting either would
// break a working page.
const ALLOWED_FIELDS = Object.freeze([
  'type',
  // contact
  'fullName', 'email', 'phone', 'whatsapp', 'country', 'language',
  'nationality', 'preferredContactMethod',
  // trip — `preferredDate`/`groupSize` are what the frontend sends today
  'packageId', 'fixedDepartureId', 'guideId', 'destinationInterest',
  'preferredDate', 'travelDate', 'flexibleDates', 'dateFlexibility',
  'groupSize', 'numberOfPeople', 'budgetRange', 'tripType',
  'guideLanguage', 'hotelNeeded', 'transportNeeded',
  // message
  'subject', 'message', 'specialRequest', 'specialPreferences',
  // callback
  'preferredCallbackDate', 'preferredCallbackTime', 'timezone', 'when',
  // consent
  'consent', 'consentAccepted',
])

// A phone number people actually type: digits, spaces, and the punctuation
// every country's convention uses. Deliberately not a single country's format —
// a Nepali, Korean, and German number all have to pass.
const PHONE_SHAPE = /^[+]?[\d\s().-]{6,40}$/

class FieldErrors {
  constructor() {
    this.errors = {}
  }

  add(field, message) {
    // First message per field wins: a cascade of five errors on one input is
    // noise, and the first is almost always the actionable one.
    if (!this.errors[field]) this.errors[field] = message
  }

  get isEmpty() {
    return Object.keys(this.errors).length === 0
  }

  throwIfAny() {
    if (this.isEmpty) return
    throw ApiError.badRequest('Please correct the highlighted inquiry fields.', {
      meta: { errors: this.errors },
    })
  }
}

// A key beginning with `$`, or a nested object where a value belongs, is a
// query operator trying to reach Mongoose.
function looksLikeOperator(value) {
  if (Array.isArray(value)) return value.some(looksLikeOperator)
  if (value && typeof value === 'object') {
    return Object.keys(value).some((key) => key.startsWith('$') || key.includes('.'))
  }
  return false
}

// Runs before anything else. A body that fails here never reaches field
// validation, because there is nothing to salvage from it.
export function rejectForbiddenFields(body, errors) {
  for (const field of FORBIDDEN_FIELDS) {
    if (Object.hasOwn(body, field)) {
      errors.add(field, 'This field cannot be set from a public form.')
    }
  }
  for (const [key, value] of Object.entries(body)) {
    if (key.startsWith('$') || key.includes('.')) {
      errors.add(key, 'This field name is not allowed.')
      continue
    }
    if (looksLikeOperator(value)) {
      errors.add(key, 'This value is not in an expected format.')
    }
  }
}

// Explicit rejection rather than silent ignoring: a typo like `emial` should
// tell somebody, not vanish. The allowlist is generous enough that no current
// form trips it.
export function rejectUnknownFields(body, errors) {
  for (const key of Object.keys(body)) {
    if (ALLOWED_FIELDS.includes(key)) continue
    if (FORBIDDEN_FIELDS.includes(key)) continue
    errors.add(key, 'This field is not accepted on an inquiry.')
  }
}

function readText(body, field, { max, line = false, errors, label = field }) {
  const raw = body[field]
  if (raw === undefined || raw === null) return ''
  if (typeof raw !== 'string') {
    errors.add(field, `${label} must be text.`)
    return ''
  }
  if (hasUnsafeCharacters(raw)) {
    errors.add(field, `${label} contains characters we cannot accept.`)
    return ''
  }
  const text = line ? toPlainLine(raw) : toPlainText(raw)
  if (text.length > max) {
    errors.add(field, `${label} cannot be longer than ${max} characters.`)
    return text.slice(0, max)
  }
  return text
}

// A date the browser sent, as a string. Anything unparseable is an error rather
// than a silent null — a trip date that quietly disappears is worse than one
// that is rejected.
function readDate(body, fields, errors, label) {
  for (const field of fields) {
    const raw = body[field]
    if (raw === undefined || raw === null || raw === '') continue
    if (typeof raw !== 'string' && !(raw instanceof Date)) {
      errors.add(field, `${label} must be a date.`)
      return null
    }
    const parsed = new Date(raw)
    if (Number.isNaN(parsed.getTime())) {
      errors.add(field, `${label} is not a date we can read.`)
      return null
    }
    return parsed
  }
  return null
}

function readPeople(body, fields, errors, maxPeople) {
  for (const field of fields) {
    const raw = body[field]
    if (raw === undefined || raw === null || raw === '') continue

    const value = typeof raw === 'number' ? raw : Number(String(raw).trim())
    if (!Number.isInteger(value) || value < 1) {
      errors.add(field, 'Enter the number of people as a whole number of 1 or more.')
      return null
    }
    if (value > maxPeople) {
      errors.add(field, `We cannot take a group of more than ${maxPeople} through this form.`)
      return null
    }
    return value
  }
  return null
}

// `true`, `'true'`, `'on'`, and `1` all mean a ticked checkbox depending on how
// the form was built. Everything else means unticked.
function readBoolean(body, fields) {
  for (const field of fields) {
    const raw = body[field]
    if (raw === undefined || raw === null || raw === '') continue
    if (typeof raw === 'boolean') return raw
    if (typeof raw === 'number') return raw === 1
    if (typeof raw === 'string') return ['true', 'on', 'yes', '1'].includes(raw.trim().toLowerCase())
    return false
  }
  return false
}

function readContactPoint(body, field, errors, label) {
  const raw = body[field]
  if (raw === undefined || raw === null) return ''
  if (typeof raw !== 'string') {
    errors.add(field, `${label} must be text.`)
    return ''
  }
  // The callback form sends `email: ''` deliberately. An empty string means
  // "not given" and must not read as "invalid".
  const value = raw.trim()
  if (value === '') return ''
  if (!PHONE_SHAPE.test(value)) {
    errors.add(field, `${label} does not look like a phone number.`)
    return ''
  }
  return value
}

function readEmail(body, errors) {
  const raw = body.email
  if (raw === undefined || raw === null) return ''
  if (typeof raw !== 'string') {
    errors.add('email', 'Enter a valid email address.')
    return ''
  }
  if (raw.trim() === '') return ''
  const email = normalizeEmail(raw)
  if (!isValidEmail(email)) {
    errors.add('email', 'Enter a valid email address.')
    return ''
  }
  return email
}

// An identifier for a catalogue record. Resolved against the database later;
// this only proves it is a plausible string rather than an object.
function readReference(body, field, errors) {
  const raw = body[field]
  if (raw === undefined || raw === null || raw === '') return null
  if (typeof raw !== 'string') {
    errors.add(field, 'This reference is not in an expected format.')
    return null
  }
  const value = raw.trim()
  if (value.length === 0 || value.length > 120) {
    errors.add(field, 'This reference is not in an expected format.')
    return null
  }
  return value
}

// What each type genuinely needs to be actionable. Nothing beyond that: a
// custom trip form that demanded every preference would be abandoned halfway.
const TYPE_RULES = Object.freeze({
  package_inquiry: { needsPackage: true },
  custom_trip: { needsTripContext: true },
  contact: { needsMessage: true },
  callback: { needsPhone: true },
  guide_request: { needsGuide: true },
  emergency: { needsPhone: true, needsMessage: true },
})

export function validateInquirySubmission(body = {}, config) {
  const errors = new FieldErrors()

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw ApiError.badRequest('That request body could not be read as an inquiry.')
  }

  // Privilege first. If somebody sent `priority: "urgent"`, nothing else about
  // the request is worth validating.
  rejectForbiddenFields(body, errors)
  rejectUnknownFields(body, errors)
  errors.throwIfAny()

  const limits = config.inquiry

  const type = typeof body.type === 'string' ? body.type.trim() : ''
  if (!type) errors.add('type', 'Choose what your message is about.')
  else if (!isInquiryType(type)) {
    errors.add('type', `Choose one of: ${INQUIRY_TYPES.join(', ')}.`)
  }

  const fullName = readText(body, 'fullName', { max: 200, line: true, errors, label: 'Your name' })
  if (!fullName) errors.add('fullName', 'Enter your name.')
  else if (fullName.length < 2) errors.add('fullName', 'Enter your full name.')

  const email = readEmail(body, errors)
  const phone = readContactPoint(body, 'phone', errors, 'Phone')
  const whatsapp = readContactPoint(body, 'whatsapp', errors, 'WhatsApp')

  // One route back is enough. Demanding all three would fail the callback form,
  // which asks only for a phone, and the contact form, which asks only for an
  // email.
  if (!email && !phone && !whatsapp) {
    errors.add('email', 'Give us one way to reply: an email address, a phone number, or WhatsApp.')
  }

  const contact = {
    fullName,
    email,
    phone,
    whatsapp,
    country: readText(body, 'country', { max: 100, line: true, errors, label: 'Country' }),
    language: readText(body, 'language', { max: 40, line: true, errors, label: 'Language' }),
    nationality: readText(body, 'nationality', { max: 100, line: true, errors, label: 'Nationality' }),
    preferredContactMethod: '',
  }

  const method = typeof body.preferredContactMethod === 'string' ? body.preferredContactMethod.trim() : ''
  if (method && !['email', 'phone', 'whatsapp'].includes(method)) {
    errors.add('preferredContactMethod', 'Choose email, phone, or WhatsApp.')
  } else {
    contact.preferredContactMethod = method
  }

  const trip = {
    packageId: readReference(body, 'packageId', errors),
    fixedDepartureId: readReference(body, 'fixedDepartureId', errors),
    guideId: readReference(body, 'guideId', errors),
    destinationInterest: readText(body, 'destinationInterest', { max: 200, line: true, errors, label: 'Destination' }),
    // `preferredDate` is what every current form sends; `travelDate` is the
    // canonical name. Either is accepted, one is stored.
    travelDate: readDate(body, ['travelDate', 'preferredDate'], errors, 'Travel date'),
    flexibleDates: readText(body, 'flexibleDates', { max: 40, line: true, errors, label: 'Date flexibility' })
      || readText(body, 'dateFlexibility', { max: 40, line: true, errors, label: 'Date flexibility' }),
    // `groupSize` is the frontend's name; `numberOfPeople` is canonical.
    numberOfPeople: readPeople(body, ['numberOfPeople', 'groupSize'], errors, limits.maxPeople),
    budgetRange: readText(body, 'budgetRange', { max: 60, line: true, errors, label: 'Budget' }),
    tripType: readText(body, 'tripType', { max: 60, line: true, errors, label: 'Trip type' }),
    guideLanguage: readText(body, 'guideLanguage', { max: 60, line: true, errors, label: 'Guide language' }),
    hotelNeeded: readText(body, 'hotelNeeded', { max: 20, line: true, errors, label: 'Hotels' }),
    transportNeeded: readText(body, 'transportNeeded', { max: 20, line: true, errors, label: 'Transport' }),
  }

  const subject = readText(body, 'subject', { max: 300, line: true, errors, label: 'Subject' })
  const message = readText(body, 'message', { max: limits.maxMessageLength, errors, label: 'Your message' })
  const specialRequest =
    readText(body, 'specialRequest', { max: limits.maxMessageLength, errors, label: 'Special request' }) ||
    readText(body, 'specialPreferences', { max: limits.maxMessageLength, errors, label: 'Special request' })

  const callback = {
    preferredDate: readDate(body, ['preferredCallbackDate'], errors, 'Callback date'),
    preferredTime:
      readText(body, 'preferredCallbackTime', { max: 60, line: true, errors, label: 'Callback time' }) ||
      readText(body, 'when', { max: 60, line: true, errors, label: 'Callback time' }),
    timezone: readText(body, 'timezone', { max: 60, line: true, errors, label: 'Time zone' }),
  }

  // Affirmative and explicit. A pre-ticked box or a missing field is not
  // consent, so anything other than an affirmative value fails.
  const consentAccepted = readBoolean(body, ['consentAccepted', 'consent'])
  if (!consentAccepted) {
    errors.add('consent', 'Please confirm we may use these details to reply to you.')
  }

  // ------------------------------------------------------- type-specific
  const rules = TYPE_RULES[type] || {}

  if (rules.needsPackage && !trip.packageId) {
    errors.add('packageId', 'We could not tell which trip this is about.')
  }
  if (rules.needsGuide && !trip.guideId) {
    errors.add('guideId', 'We could not tell which guide this is about.')
  }
  if (rules.needsMessage && !message) {
    errors.add('message', 'Tell us how we can help.')
  }
  if (rules.needsPhone && !phone && !whatsapp) {
    errors.add('phone', 'Give us a phone or WhatsApp number so we can call you.')
  }
  // Enough to act on, without dictating which field it came from — somebody
  // may describe their whole trip in the message, or pick options instead.
  if (rules.needsTripContext) {
    const hasContext = Boolean(
      message || trip.destinationInterest || trip.travelDate || trip.numberOfPeople || trip.tripType
    )
    if (!hasContext) {
      errors.add('message', 'Tell us roughly what trip you have in mind.')
    }
  }

  errors.throwIfAny()

  return {
    type,
    contact,
    trip,
    subject,
    message,
    specialRequest,
    callback,
    consentAccepted,
  }
}

export { FieldErrors, PHONE_SHAPE, FORBIDDEN_FIELDS, ALLOWED_FIELDS, TYPE_RULES }
export default validateInquirySubmission
