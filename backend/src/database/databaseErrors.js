// Turns the Mongoose errors a request can legitimately provoke into ApiErrors
// with a readable message, so the central handler treats them as expected
// failures rather than server faults.
//
// Nothing here leaks a collection name, a connection string, a driver message,
// or a stack trace.
import ApiError from '../utils/ApiError.js'

// A malformed id in a URL is a client mistake, not a server fault.
function fromCastError(error) {
  if (error.path === '_id') {
    return ApiError.badRequest('That identifier is not valid.')
  }
  return ApiError.badRequest(`"${error.path}" was not in an expected format.`)
}

// Field names are safe to name — they are part of the public API contract.
// Values are not echoed, because a value came from the client and could be
// anything.
function fromValidationError(error) {
  const fields = Object.keys(error.errors || {})
  const detail = fields.length ? ` Check: ${fields.join(', ')}.` : ''
  return ApiError.badRequest(`Some values were not accepted.${detail}`)
}

// 11000 is MongoDB's duplicate-key code. The index name can reveal internal
// naming, so only the offending field is reported.
function fromDuplicateKey(error) {
  const field = Object.keys(error.keyPattern || {})[0]
  return ApiError.conflict(
    field ? `A record with that ${field} already exists.` : 'That record already exists.'
  )
}

// Returns an ApiError for a known database failure, or null when the error is
// not one — in which case the central handler treats it as unexpected, logs it,
// and masks it in production.
export function normaliseDatabaseError(error) {
  if (!error) return null
  if (error instanceof ApiError) return error

  if (error.name === 'CastError') return fromCastError(error)
  if (error.name === 'ValidationError') return fromValidationError(error)
  if (error.code === 11000) return fromDuplicateKey(error)

  return null
}

export default normaliseDatabaseError
