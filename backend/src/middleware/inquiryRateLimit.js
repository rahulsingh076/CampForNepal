// A per-address cap on public inquiry submissions.
//
// Separate from the login limiter on purpose. They protect different things and
// deserve different budgets: ten failed sign-ins in fifteen minutes is an
// attack, ten inquiries in fifteen minutes is a family planning a trek together
// from one hotel's wifi.
//
// This never applies to staff CRM routes. A support agent working through the
// queue makes far more requests than any visitor, and rate-limiting them would
// break the tool while stopping nothing.
//
// The counter is in memory, so it is per process. Running more than one
// instance multiplies the effective budget — a shared store is required before
// scaling horizontally. CSRF, validation, and the honeypot do not have that
// limitation and carry most of the weight.
import { rateLimit } from 'express-rate-limit'
import ApiError from '../utils/ApiError.js'

export default function inquiryRateLimit(config) {
  return rateLimit({
    windowMs: config.inquiry.publicWindowMs,
    limit: config.inquiry.publicMaxSubmissions,
    standardHeaders: true,
    legacyHeaders: false,
    // Through the normal error path, so a refusal arrives in the same
    // { success, message, data, meta } envelope with a requestId — a person
    // reporting "it said no" can be traced to a log line.
    handler: (_req, _res, next) =>
      next(
        ApiError.tooManyRequests(
          'We have received several messages from here already. Please wait a few minutes and try again.'
        )
      ),
  })
}
