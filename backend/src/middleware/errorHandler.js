// The single place an error becomes a response.
//
// Two categories, treated very differently:
//
//   Expected  — an ApiError a route threw deliberately. Its message is written
//               for a person and is safe to send.
//   Unexpected— anything else. In production the client gets a generic
//               sentence and the real error is logged, because a stack trace or
//               a driver message can leak paths, queries, and credentials.
import { normaliseDatabaseError } from '../database/databaseErrors.js'
import ApiError from '../utils/ApiError.js'
import { sendFailure } from '../utils/response.js'

const GENERIC_MESSAGE = 'Something went wrong on our side. Please try again.'

// Turns the few well-known framework errors into clean client messages, so a
// malformed body reads as a bad request rather than a server fault.
function normalise(error) {
  if (error instanceof ApiError) return error

  if (error?.type === 'entity.too.large') {
    return ApiError.tooLarge('That request body is larger than this API accepts.')
  }
  if (error?.type === 'entity.parse.failed' || error instanceof SyntaxError) {
    return ApiError.badRequest('That request body is not valid JSON.')
  }
  // The CORS middleware rejects a disallowed origin by passing an Error here.
  if (typeof error?.message === 'string' && error.message.startsWith('Origin not allowed by CORS')) {
    return ApiError.forbidden('This origin is not allowed to call the API.')
  }

  // Bad ids, failed schema validation, duplicate keys. Returns null for
  // anything else, which keeps unexpected database faults masked and logged.
  return normaliseDatabaseError(error)
}

// eslint-disable-next-line no-unused-vars -- Express identifies the error
// handler by its four-parameter signature; `next` must stay in the list.
export default function errorHandler(isProduction) {
  return (error, req, res, next) => {
    // Something already started writing: hand back to Express to destroy it.
    if (res.headersSent) return next(error)

    const known = normalise(error)
    const status = known?.status || 500
    const message = known ? known.message : isProduction ? GENERIC_MESSAGE : error?.message || GENERIC_MESSAGE

    // Unexpected failures are always logged with their request id, whatever
    // the environment, because nobody can debug what was never recorded.
    if (!known) {
      console.error(
        `[error] ${req.method} ${req.originalUrl} requestId=${res.locals.requestId}`,
        error
      )
    }

    const meta = { ...(known?.meta || {}) }
    // A stack is a development convenience only. It never ships to production.
    if (!isProduction && !known && error?.stack) meta.stack = error.stack

    return sendFailure(res, { status, message, data: known?.data ?? null, meta })
  }
}
