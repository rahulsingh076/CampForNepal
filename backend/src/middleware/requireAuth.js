// Proves who is making the request, on the server, from the session store.
//
// The session holds an id and a version number — nothing else. The role, the
// status, and the name are read from the database on every request, so a role
// change or a suspension takes effect immediately instead of at the next login.
// Trusting a role cached in the session is how privilege escalation survives a
// demotion.
import { sessionCookieOptions } from '../config/session.js'
import { ACTIVE_USER_STATUS } from '../constants/userStatuses.js'
import userService from '../modules/users/user.service.js'
import ApiError from '../utils/ApiError.js'
import { destroySession } from '../utils/sessionPromises.js'
import asyncHandler from './asyncHandler.js'

// One sentence for every rejection a caller could use to learn something: a
// deleted account, a suspended account, and an invalidated session all read the
// same from outside.
const SIGNED_OUT = 'You need to sign in to do that.'

// A session pointing at a deleted, suspended, or invalidated account is not
// merely unauthorised — it is worthless, so it is thrown away rather than left
// for the next request to re-check.
async function reject(req, res) {
  try {
    await destroySession(req)
    const config = req.app.locals.config
    res.clearCookie(config.sessionCookieName, sessionCookieOptions(config))
  } catch {
    // The 401 matters more than the tidy-up; a store hiccup must not turn an
    // authentication failure into a 500.
  }
  throw ApiError.unauthorized(SIGNED_OUT)
}

export default asyncHandler(async function requireAuth(req, res, next) {
  const session = req.session
  if (!session?.userId) throw ApiError.unauthorized(SIGNED_OUT)

  const user = await userService.findByIdForSession(session.userId)
  if (!user) return reject(req, res)

  // Raised by a password change and by "sign out everywhere". An older value
  // means this session was deliberately invalidated.
  if ((user.sessionVersion || 0) !== (session.sessionVersion || 0)) {
    return reject(req, res)
  }

  if (user.status !== ACTIVE_USER_STATUS) {
    return reject(req, res)
  }

  // A plain, safe summary for anything that only needs to know who this is.
  // It carries no hash and no security counter by construction.
  req.auth = {
    userId: String(user._id),
    role: user.role,
    status: user.status,
    sessionVersion: user.sessionVersion || 0,
  }
  // The document itself, for controllers that need to serialise the user.
  // `passwordHash` was never loaded — findByIdForSession does not select it.
  req.user = user

  return next()
})
