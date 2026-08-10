// HTTP for authentication: read the request, call the service, own the session.
//
// The session is written here rather than in the service so that all cookie and
// session-lifetime concerns live at the HTTP boundary.
import { sessionCookieOptions } from '../../config/session.js'
import asyncHandler from '../../middleware/asyncHandler.js'
import { issueCsrfToken, rotateCsrfToken } from '../../middleware/csrfProtection.js'
import { sendSuccess } from '../../utils/response.js'
import { destroySession, regenerateSession, saveSession } from '../../utils/sessionPromises.js'
import authService from './auth.service.js'
import { validateLogin, validatePasswordChange, validateRegistration } from './auth.validation.js'

// Starts a brand new authenticated session for `user`.
//
// regenerate() is the important line: it issues a new session id. Without it,
// an attacker who plants a known session id in a victim's browser before they
// sign in still holds a valid id afterwards — session fixation.
async function establishSession(req, user) {
  const config = req.app.locals.config
  await regenerateSession(req)

  const now = Date.now()

  // Exactly five fields. Never a role, an email, or a name: those are read from
  // the database on every request, so a demotion or a suspension takes effect
  // immediately rather than at the next sign-in.
  req.session.userId = String(user._id)
  req.session.sessionVersion = user.sessionVersion || 0
  req.session.authenticatedAt = now
  // Fixed at sign-in and never moved. This is the limit a stolen session
  // cannot escape by staying active.
  req.session.absoluteExpiresAt = now + config.sessionAbsoluteTimeoutMs
  const csrfToken = rotateCsrfToken(req)

  // Wait for the store write, so the cookie we are about to send never points
  // at a session that does not exist yet.
  await saveSession(req)
  return csrfToken
}

async function endSession(req, res) {
  const config = req.app.locals.config
  await destroySession(req)
  // The attributes must match the ones the cookie was set with, or the browser
  // keeps it and the user appears to still be signed in.
  res.clearCookie(config.sessionCookieName, sessionCookieOptions(config))
}

// The client fetches this before its first state-changing request. It is a GET,
// so it is not itself subject to the CSRF check it exists to enable.
//
// This is the one place an anonymous session is saved on purpose —
// `saveUninitialized` is false everywhere else.
export const csrfToken = asyncHandler(async (req, res) => {
  const token = issueCsrfToken(req)
  await saveSession(req)

  return sendSuccess(res, {
    message: 'CSRF token created.',
    data: { csrfToken: token },
  })
})

export const register = asyncHandler(async (req, res) => {
  const details = validateRegistration(req.body)
  const user = await authService.register(details)
  const token = await establishSession(req, user)

  return sendSuccess(res, {
    status: 201,
    message: 'Your account has been created.',
    data: { user: user.toJSON(), csrfToken: token },
  })
})

export const login = asyncHandler(async (req, res) => {
  const credentials = validateLogin(req.body)
  const user = await authService.login(credentials, req.app.locals.config)
  const token = await establishSession(req, user)

  return sendSuccess(res, {
    message: 'You are signed in.',
    data: { user: user.toJSON(), csrfToken: token },
  })
})

export const me = asyncHandler(async (req, res) =>
  sendSuccess(res, {
    message: 'Signed in.',
    data: { user: req.user.toJSON() },
  })
)

// Deliberately not behind requireAuth. Signing out has no side effect worth
// protecting, and returning 401 to somebody whose session already lapsed makes
// a "sign out" button fail for the one person who wanted it to work. CSRF still
// applies, so it cannot be triggered from another origin.
export const logout = asyncHandler(async (req, res) => {
  await endSession(req, res)
  return sendSuccess(res, { message: 'You are signed out.' })
})

// Raises sessionVersion, so sessions already sitting in the store stop being
// accepted on their next request — no need to enumerate them.
export const logoutAll = asyncHandler(async (req, res) => {
  await authService.signOutEverywhere(req.auth.userId)
  await endSession(req, res)

  return sendSuccess(res, { message: 'You are signed out on every device.' })
})

export const changePassword = asyncHandler(async (req, res) => {
  const details = validatePasswordChange(req.body)
  const updated = await authService.changePassword(req.auth.userId, details)

  // The change invalidated every session including this one. Issuing a fresh
  // session keeps the person who just changed their password signed in, while
  // every other device is signed out on its next request.
  const token = await establishSession(req, updated)

  return sendSuccess(res, {
    message: 'Your password has been changed. Other devices have been signed out.',
    data: { user: updated.toJSON(), csrfToken: token },
  })
})

export default { csrfToken, register, login, me, logout, logoutAll, changePassword }
