// Enforces the absolute session lifetime on the server.
//
// Two limits exist, enforced in two different places:
//
//   idle     — time since the last request. Handled by the cookie's Max-Age and
//              by the MongoDB store's TTL, both refreshed on each response
//              because the session is `rolling`.
//   absolute — time since sign-in. Stored as `absoluteExpiresAt` when the
//              session is created and never moved. This middleware is what
//              enforces it, because nothing else would.
//
// The absolute limit is the one that matters after a theft: without it, a
// stolen session can be kept alive forever simply by using it.
//
// An expired session is destroyed and the request continues **as anonymous**
// rather than failing here, so a public page still renders for somebody whose
// session lapsed. requireAuth is the single place that answers 401.
import { sessionCookieOptions } from '../config/session.js'
import { destroySession } from '../utils/sessionPromises.js'

export default function sessionTimeout(config) {
  return async function checkSessionAge(req, res, next) {
    const session = req.session

    // No session, or an anonymous one holding only a CSRF token: nothing to
    // expire, and no cookie to clear.
    if (!session || !session.userId) return next()

    const expiresAt = session.absoluteExpiresAt
    // A session with no absolute expiry is malformed — treat it as expired
    // rather than as unlimited.
    const expired = typeof expiresAt !== 'number' || Date.now() >= expiresAt

    if (expired) {
      try {
        await destroySession(req)
      } catch (error) {
        return next(error)
      }
      res.clearCookie(config.sessionCookieName, sessionCookieOptions(config))
    }

    return next()
  }
}
