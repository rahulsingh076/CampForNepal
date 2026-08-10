// Small reusable validators. Mongoose's built-in validation only — no Joi, no
// Zod, no extra dependency.
//
// Each exports a predicate plus a message, so a schema reads as
// `validate: slugValidator` rather than repeating a regex.

// lowercase letters and digits, single hyphens between words, no leading or
// trailing hyphen, no doubled hyphen.
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function isSlug(value) {
  return typeof value === 'string' && SLUG_PATTERN.test(value)
}

export const slugValidator = {
  validator: isSlug,
  message: ({ value }) =>
    `"${value}" is not a valid slug. Use lowercase letters, numbers, and single hyphens between words.`,
}

// Anything that is not plainly http(s) is rejected, which rules out
// javascript:, data:, file:, and friends. A relative path beginning with "/"
// is allowed because the frontend seed stores its media that way.
const UNSAFE_PROTOCOLS = ['javascript:', 'data:', 'file:', 'vbscript:', 'blob:']
const MEDIA_TYPES = new Set(['image', 'video', 'reel'])
const VIDEO_MEDIA_TYPES = new Set(['video', 'reel'])

export function isSafeInternalPath(value) {
  return typeof value === 'string' &&
    value.trim() === value &&
    value.startsWith('/') &&
    !value.startsWith('//') &&
    !/[\\\u0000-\u001F]/.test(value)
}

export function isSafeUrl(value) {
  if (typeof value !== 'string' || value.trim() === '') return false
  const candidate = value.trim()

  // Site-relative media path, e.g. /images/destinations/everest-01.jpg.
  // Rejects "//evil.example.com", which a browser treats as protocol-relative.
  if (candidate.startsWith('/')) return isSafeInternalPath(candidate)

  let parsed
  try {
    parsed = new URL(candidate)
  } catch {
    return false
  }
  if (UNSAFE_PROTOCOLS.includes(parsed.protocol)) return false
  return parsed.protocol === 'http:' || parsed.protocol === 'https:'
}

export const urlValidator = {
  validator: isSafeUrl,
  message: ({ value }) =>
    `"${value}" is not an allowed URL. Use an https URL or a site-relative path beginning with "/".`,
}

// For optional URL fields: an absent or empty value is fine, anything present
// must be safe.
export const optionalUrlValidator = {
  validator: (value) =>
    value === undefined || value === null || value === '' || isSafeUrl(value),
  message: ({ value }) =>
    `"${value}" is not an allowed URL. Use an https URL or a site-relative path beginning with "/".`,
}

// Every entry in an array of URLs must pass.
export const urlArrayValidator = {
  validator: (values) => !Array.isArray(values) || values.every(isSafeUrl),
  message: 'Every image must be an https URL or a site-relative path beginning with "/".',
}

function isPlainObject(value) {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function safeText(value, limit = 300) {
  return value === undefined || value === null || (typeof value === 'string' && value.length <= limit)
}

export function isExternalHttpUrl(value) {
  if (typeof value !== 'string' || value.trim() === '') return false
  try {
    const parsed = new URL(value.trim())
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

export function isSafeMediaValue(value) {
  if (value === undefined || value === null || value === '') return true
  if (typeof value === 'string') return isSafeUrl(value)
  if (!isPlainObject(value)) return false

  const type = typeof value.type === 'string' ? value.type.trim().toLowerCase() : 'image'
  if (!MEDIA_TYPES.has(type)) return false

  const src = value.src || value.url || value.href
  if (typeof src !== 'string' || src.trim() === '') return false
  if (VIDEO_MEDIA_TYPES.has(type)) {
    const sourceType = typeof value.sourceType === 'string' ? value.sourceType.trim().toLowerCase() : ''
    if (sourceType === 'local_asset') {
      if (!isSafeInternalPath(src)) return false
    } else if (!isExternalHttpUrl(src)) {
      return false
    }
  } else if (!isSafeUrl(src)) {
    return false
  }

  const poster = value.thumbnailSrc || value.poster || value.posterSrc
  if (poster && !isSafeUrl(poster)) return false

  for (const field of ['sourceUrl', 'licenceUrl', 'licenseUrl']) {
    if (value[field] && !isExternalHttpUrl(value[field])) return false
  }

  return [
    'alt',
    'altText',
    'caption',
    'title',
    'focalPosition',
    'objectPosition',
    'photographer',
    'sourceName',
    'licenceName',
    'licenseName',
    'season',
  ].every((field) => safeText(value[field]))
}

export const mediaItemValidator = {
  validator: isSafeMediaValue,
  message: 'Media must use a safe image URL, or a safe external video/reel URL with optional source metadata.',
}

export const mediaArrayValidator = {
  validator: (values) => !Array.isArray(values) || values.every(isSafeMediaValue),
  message: 'Every media item must use a safe URL and safe source metadata.',
}

export function isNonEmptyText(value) {
  return typeof value === 'string' && value.trim().length > 0
}

export const nonEmptyTextValidator = {
  validator: isNonEmptyText,
  message: 'This field cannot be empty.',
}

export function isLatitude(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= -90 && value <= 90
}

export const latitudeValidator = {
  validator: isLatitude,
  message: ({ value }) => `Latitude must be between -90 and 90, received ${value}.`,
}

export function isLongitude(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= -180 && value <= 180
}

export const longitudeValidator = {
  validator: isLongitude,
  message: ({ value }) => `Longitude must be between -180 and 180, received ${value}.`,
}

// Aggregate ratings may be 0 when nothing has been reviewed yet. An individual
// review is 1-5 and uses min/max on its own field instead.
export function isRating(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 5
}

export const ratingValidator = {
  validator: isRating,
  message: ({ value }) => `Rating must be between 0 and 5, received ${value}.`,
}

export function isNonNegativeNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
}

export const nonNegativeValidator = {
  validator: isNonNegativeNumber,
  message: ({ value }) => `This value cannot be negative, received ${value}.`,
}

// For an optional number that may be explicitly null. Mongoose skips
// validation for `undefined`, but `null` is a value and would otherwise be
// rejected — and the frontend seed stores `discountPrice: null` on most trips.
export const optionalNonNegativeValidator = {
  validator: (value) =>
    value === undefined || value === null || isNonNegativeNumber(value),
  message: ({ value }) => `This value cannot be negative, received ${value}.`,
}

export function isPositiveNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}

export const positiveValidator = {
  validator: isPositiveNumber,
  message: ({ value }) => `This value must be greater than zero, received ${value}.`,
}

export function isNonNegativeInteger(value) {
  return Number.isInteger(value) && value >= 0
}

export const nonNegativeIntegerValidator = {
  validator: isNonNegativeInteger,
  message: ({ value }) => `This value must be a whole number of zero or more, received ${value}.`,
}

// Accepts a Date or anything Date can parse, for fields fed by ISO strings.
export function isValidDate(value) {
  if (value instanceof Date) return !Number.isNaN(value.getTime())
  if (typeof value === 'string' || typeof value === 'number') {
    return !Number.isNaN(new Date(value).getTime())
  }
  return false
}

export const dateValidator = {
  validator: isValidDate,
  message: ({ value }) => `"${value}" is not a valid date.`,
}
