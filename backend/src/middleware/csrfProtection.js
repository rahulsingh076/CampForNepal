// CSRF protection: a synchroniser token, plus an Origin check.
//
// Why a token is needed even with a SameSite cookie: SameSite is a browser
// default, not a guarantee. Older browsers ignore it, "lax" still allows
// top-level navigations, and a subdomain or a permissive CORS mistake can undo
// it. The token is the part an attacker on another origin genuinely cannot
// obtain — the same-origin policy stops them reading the response that carries
// it.
//
// The secret lives in the session, server-side, never in a readable cookie, so
// there is no double-submit cookie to forge from a subdomain.
import { randomBytes, timingSafeEqual } from 'node:crypto'
import ApiError from '../utils/ApiError.js'

export const CSRF_HEADER = 'x-csrf-token'

// GET, HEAD, and OPTIONS must not change state, so they need no token. Anything
// else does — including login, which is exactly the request an attacker would
// like to forge (a login to an account they control, so they can watch what the
// victim does in it).
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

// Returns the session's token, creating one on first use. Called by the token
// endpoint and again after every session regeneration, because regenerating —
// which is what prevents session fixation — deliberately discards the old one.
export function issueCsrfToken(req) {
  if (!req.session) throw ApiError.internal('No session is available for this request.')
  if (!req.session.csrfToken) req.session.csrfToken = randomBytes(32).toString('hex')
  return req.session.csrfToken
}

// Replaces the token unconditionally. Used after regenerate(), so a new session
// never inherits the previous token.
export function rotateCsrfToken(req) {
  if (!req.session) throw ApiError.internal('No session is available for this request.')
  req.session.csrfToken = randomBytes(32).toString('hex')
  return req.session.csrfToken
}

// Constant time, so a comparison cannot be used to guess the token one
// character at a time. Different lengths are rejected before comparing,
// because timingSafeEqual throws on a length mismatch.
function tokensMatch(expected, supplied) {
  if (typeof expected !== 'string' || typeof supplied !== 'string') return false
  const a = Buffer.from(expected, 'utf8')
  const b = Buffer.from(supplied, 'utf8')
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

// A second, independent check. A browser always sends Origin on a
// state-changing cross-origin request, and an attacker's page cannot forge it.
// A request with no Origin is allowed through — curl, a health monitor, and a
// server-to-server call are not browsers and are not subject to CSRF; the token
// is still required for them.
function originAllowed(req, allowedOrigins) {
  const origin = req.get('Origin')
  if (!origin) return true
  return allowedOrigins.includes(origin)
}

export default function csrfProtection(req, _res, next) {
  if (SAFE_METHODS.has(req.method)) return next()

  const allowedOrigins = req.app.locals.config?.corsOrigins || []
  if (!originAllowed(req, allowedOrigins)) {
    return next(ApiError.forbidden('This origin is not allowed to call the API.'))
  }

  const expected = req.session?.csrfToken
  const supplied = req.get(CSRF_HEADER)

  if (!expected) {
    return next(
      ApiError.forbidden('This request needs a CSRF token. Request one first, then retry.')
    )
  }
  if (!tokensMatch(expected, supplied)) {
    return next(ApiError.forbidden('That CSRF token is missing or invalid.'))
  }

  return next()
}
