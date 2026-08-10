// Turns an untrusted req.query into values that are safe to hand to Mongoose.
//
// The rule this file exists to enforce: **req.query is never passed to a query
// method.** Express parses `?a[$ne]=1` into an object, so forwarding it lets a
// caller inject operators. Every value below is read individually, coerced to a
// primitive, and range-checked, and anything malformed becomes a readable 400.
import ApiError from '../utils/ApiError.js'

const MAX_SEARCH_LENGTH = 100

// A query value can arrive as a string, or as an array/object if the caller
// repeated or nested the parameter. Only a plain string is ever accepted.
function readString(value) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

export function parsePage(raw) {
  if (raw === undefined) return 1
  const text = readString(raw)
  const value = Number(text)
  if (!Number.isInteger(value) || value < 1) {
    throw ApiError.badRequest('"page" must be a whole number of 1 or more.')
  }
  return value
}

export function parseLimit(raw, { defaultPageSize, maxPageSize }) {
  if (raw === undefined) return defaultPageSize
  const text = readString(raw)
  const value = Number(text)
  if (!Number.isInteger(value) || value < 1) {
    throw ApiError.badRequest('"limit" must be a whole number of 1 or more.')
  }
  if (value > maxPageSize) {
    throw ApiError.badRequest(`"limit" cannot be greater than ${maxPageSize}.`)
  }
  return value
}

// Only the exact strings "true" and "false" are accepted, so a typo is a
// visible error rather than a silent false.
export function parseBoolean(raw, name) {
  if (raw === undefined) return undefined
  const text = readString(raw)
  if (text === 'true') return true
  if (text === 'false') return false
  throw ApiError.badRequest(`"${name}" must be either true or false.`)
}

// "a,b,c" -> ['a','b','c'], with blanks dropped.
export function parseList(raw, name, { allowed = null } = {}) {
  if (raw === undefined) return undefined
  const text = readString(raw)
  if (!text) return undefined

  const values = text.split(',').map((item) => item.trim()).filter(Boolean)
  if (values.length === 0) return undefined

  if (allowed) {
    const unknown = values.filter((value) => !allowed.includes(value))
    if (unknown.length > 0) {
      throw ApiError.badRequest(
        `"${name}" does not accept ${unknown.join(', ')}. Allowed: ${allowed.join(', ')}.`
      )
    }
  }
  return values
}

// One value from a fixed set.
export function parseEnum(raw, name, allowed) {
  if (raw === undefined) return undefined
  const text = readString(raw)
  if (!text) return undefined
  if (!allowed.includes(text)) {
    throw ApiError.badRequest(`"${name}" must be one of: ${allowed.join(', ')}.`)
  }
  return text
}

// Escapes every regex metacharacter, so a search for "c++" or ".*" is a
// literal search and cannot become a catastrophic pattern.
export function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function parseSearch(raw) {
  if (raw === undefined) return undefined
  const text = readString(raw)
  if (!text) return undefined
  if (text.length > MAX_SEARCH_LENGTH) {
    throw ApiError.badRequest(`"search" cannot be longer than ${MAX_SEARCH_LENGTH} characters.`)
  }
  return text
}

// Builds a case-insensitive contains-match across the given fields.
export function searchFilter(search, fields) {
  if (!search) return null
  const pattern = new RegExp(escapeRegex(search), 'i')
  return { $or: fields.map((field) => ({ [field]: pattern })) }
}

// An allowlist, always. "-title" means descending.
export function parseSort(raw, allowedFields, fallback) {
  if (raw === undefined) return fallback
  const text = readString(raw)
  if (!text) return fallback

  const descending = text.startsWith('-')
  const field = descending ? text.slice(1) : text

  if (!allowedFields.includes(field)) {
    throw ApiError.badRequest(
      `"sort" does not accept "${field}". Allowed: ${allowedFields.join(', ')} (prefix with "-" to reverse).`
    )
  }
  return text
}

// Mongoose accepts "field -other"; this converts one allowlisted token.
export function sortToObject(sort) {
  if (!sort) return {}
  const descending = sort.startsWith('-')
  const field = descending ? sort.slice(1) : sort
  return { [field]: descending ? -1 : 1 }
}

// Zero is a legitimate minimum, so presence is checked rather than truthiness.
export function parseNumber(raw, name, { min = null } = {}) {
  if (raw === undefined) return undefined
  const text = readString(raw)
  if (text === null) return undefined

  const value = Number(text)
  if (!Number.isFinite(value)) {
    throw ApiError.badRequest(`"${name}" must be a number.`)
  }
  if (min !== null && value < min) {
    throw ApiError.badRequest(`"${name}" cannot be less than ${min}.`)
  }
  return value
}

// Returns a { $gte, $lte } fragment, or undefined when neither bound is given.
export function parseNumericRange(rawMin, rawMax, name, { min = 0 } = {}) {
  const lower = parseNumber(rawMin, `${name}Min`, { min })
  const upper = parseNumber(rawMax, `${name}Max`, { min })

  if (lower !== undefined && upper !== undefined && lower > upper) {
    throw ApiError.badRequest(`"${name}Min" cannot be greater than "${name}Max".`)
  }
  if (lower === undefined && upper === undefined) return undefined

  const range = {}
  if (lower !== undefined) range.$gte = lower
  if (upper !== undefined) range.$lte = upper
  return range
}

export function parseDate(raw, name) {
  if (raw === undefined) return undefined
  const text = readString(raw)
  if (!text) return undefined

  const value = new Date(text)
  if (Number.isNaN(value.getTime())) {
    throw ApiError.badRequest(`"${name}" is not a valid date. Use a format such as 2027-03-01.`)
  }
  return value
}

export function parseDateRange(rawFrom, rawTo, { fromName = 'dateFrom', toName = 'dateTo' } = {}) {
  const from = parseDate(rawFrom, fromName)
  const to = parseDate(rawTo, toName)

  if (from && to && from > to) {
    throw ApiError.badRequest(`"${fromName}" cannot be later than "${toName}".`)
  }
  if (!from && !to) return undefined

  const range = {}
  if (from) range.$gte = from
  if (to) range.$lte = to
  return range
}

// The pagination block every list response carries in meta.
export function buildPageMeta({ page, limit, total }) {
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit)
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1 && total > 0,
  }
}

// Reads page and limit together, since every list route needs both.
export function parsePagination(query, config) {
  const page = parsePage(query.page)
  const limit = parseLimit(query.limit, {
    defaultPageSize: config.publicDefaultPageSize,
    maxPageSize: config.publicMaxPageSize,
  })
  return { page, limit, skip: (page - 1) * limit }
}
