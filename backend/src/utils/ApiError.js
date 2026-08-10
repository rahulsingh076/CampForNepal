// An error that is safe to show a client.
//
// Anything thrown as an ApiError is treated as expected: its message and status
// reach the caller. Anything else is treated as a bug — the error handler
// replaces it with a generic message in production and logs the real one.

export default class ApiError extends Error {
  constructor(status, message, { data = null, meta = {} } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
    this.meta = meta
    // Marks this as deliberate, so the handler never has to guess.
    this.expected = true
    Error.captureStackTrace?.(this, ApiError)
  }

  static badRequest(message = 'That request could not be understood.', options) {
    return new ApiError(400, message, options)
  }

  static unauthorized(message = 'You need to sign in to do that.', options) {
    return new ApiError(401, message, options)
  }

  static forbidden(message = 'You do not have access to that.', options) {
    return new ApiError(403, message, options)
  }

  static notFound(message = 'That resource does not exist.', options) {
    return new ApiError(404, message, options)
  }

  static conflict(message = 'That conflicts with something that already exists.', options) {
    return new ApiError(409, message, options)
  }

  static tooLarge(message = 'That request body is too large.', options) {
    return new ApiError(413, message, options)
  }

  static tooManyRequests(message = 'Too many attempts. Please wait and try again.', options) {
    return new ApiError(429, message, options)
  }

  static internal(message = 'Something went wrong on our side.', options) {
    return new ApiError(500, message, options)
  }
}
