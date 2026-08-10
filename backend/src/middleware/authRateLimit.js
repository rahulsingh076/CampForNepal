// Rate limits on the authentication endpoints.
//
// This is the network-level half of brute-force defence: it caps how fast one
// client can try. The other half is per-account lockout in the auth service,
// which caps how many times one account can be guessed no matter how many
// addresses the attempts come from. Neither alone is enough — an IP limit is
// evaded by a botnet, and an account lock alone still lets someone spray one
// guess across thousands of accounts.
//
// The counter is in memory, so it is per process. That is honest for a single
// instance; running several would need a shared store, and the account lockout
// (which lives in MongoDB) keeps working either way.
import { rateLimit } from 'express-rate-limit'
import ApiError from '../utils/ApiError.js'

function buildLimiter({ windowMs, max, message, skipSuccessfulRequests = false }) {
  return rateLimit({
    windowMs,
    limit: max,
    skipSuccessfulRequests,
    standardHeaders: true,
    // The X-RateLimit-* headers are superseded by the standard ones.
    legacyHeaders: false,
    // Route the refusal through the normal error path so it comes back in the
    // same { success, message, data, meta } envelope as everything else.
    handler: (_req, _res, next) => next(ApiError.tooManyRequests(message)),
  })
}

// Only failed attempts count, so signing in and out a few times in a row never
// locks somebody out of their own account.
export function loginRateLimit(config) {
  return buildLimiter({
    windowMs: config.loginWindowMs,
    max: config.loginMaxAttempts,
    skipSuccessfulRequests: true,
    message: 'Too many sign-in attempts. Please wait a few minutes and try again.',
  })
}

// Registration counts every request: the thing being limited is account
// creation itself, and a successful one is exactly what an abuser wants.
export function registerRateLimit(config) {
  return buildLimiter({
    windowMs: config.loginWindowMs,
    max: config.loginMaxAttempts,
    message: 'Too many accounts created from here. Please wait a few minutes.',
  })
}

export default { loginRateLimit, registerRateLimit }
