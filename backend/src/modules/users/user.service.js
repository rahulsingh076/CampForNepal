// Everything that reads or writes a user. The only layer that touches the User
// model, so password handling and lockout accounting exist in exactly one place.
import mongoose from 'mongoose'
import { DEFAULT_ROLE, isRole } from '../../constants/roles.js'
import { ACTIVE_USER_STATUS, DEFAULT_USER_STATUS, USER_STATUSES } from '../../constants/userStatuses.js'
import ApiError from '../../utils/ApiError.js'
import { normalizeEmail } from '../../utils/email.js'
import { hashPassword } from '../../utils/password.js'
import User from './user.model.js'

// The security fields are `select: false`, so they must be asked for by name.
// Nothing outside this file needs to know that list.
const LOGIN_FIELDS = '+passwordHash +failedLoginAttempts +lockUntil +sessionVersion'
const SESSION_FIELDS = '+sessionVersion'

// Callers pass an id that came from a session or a URL. An id that is not a
// valid ObjectId is "no such user", not a 500 from a CastError.
function asObjectId(id) {
  return mongoose.isValidObjectId(id) ? id : null
}

export async function findByEmailForLogin(email) {
  const normalised = normalizeEmail(email)
  if (!normalised) return null
  return User.findOne({ email: normalised }).select(LOGIN_FIELDS)
}

// Used by requireAuth on every authenticated request, so it stays a single
// indexed lookup by primary key.
export async function findByIdForSession(id) {
  const objectId = asObjectId(id)
  if (!objectId) return null
  return User.findById(objectId).select(SESSION_FIELDS)
}

// Same fields as the login lookup, but by id — used by a password change,
// where the caller is already authenticated and the current hash is needed.
export async function findByIdForLogin(id) {
  const objectId = asObjectId(id)
  if (!objectId) return null
  return User.findById(objectId).select(LOGIN_FIELDS)
}

export async function emailExists(email) {
  const normalised = normalizeEmail(email)
  if (!normalised) return false
  return Boolean(await User.exists({ email: normalised }))
}

// Role and status are never taken from a request body by the public routes —
// they are arguments here so an admin flow and the bootstrap script can set
// them deliberately.
export async function createUser({
  fullName,
  email,
  password,
  preferences,
  role = DEFAULT_ROLE,
  status = DEFAULT_USER_STATUS,
}) {
  if (!isRole(role)) throw ApiError.badRequest('That is not a valid role.')
  if (!USER_STATUSES.includes(status)) throw ApiError.badRequest('That is not a valid account status.')

  // Throws on a policy violation before any database work happens.
  const passwordHash = await hashPassword(password)

  try {
    return await User.create({
      fullName,
      email,
      passwordHash,
      preferences: preferences || {},
      role,
      status,
      passwordChangedAt: new Date(),
    })
  } catch (error) {
    // The unique index is the real guard: a "does this email exist" check
    // before the insert would still race two simultaneous registrations.
    if (error?.code === 11000) {
      throw ApiError.conflict('An account with that email already exists.')
    }
    throw error
  }
}

// One failed attempt. Crossing the threshold locks the account for a while,
// which is what turns online password guessing from cheap into pointless.
export async function recordFailedLogin(user, { threshold, lockMs }) {
  if (!user) return
  const attempts = (user.failedLoginAttempts || 0) + 1
  const update = { failedLoginAttempts: attempts }
  if (attempts >= threshold) update.lockUntil = new Date(Date.now() + lockMs)

  await User.updateOne({ _id: user._id }, { $set: update })
}

// A correct password clears the counters. `rehashedPassword` is supplied only
// when the stored hash used older Argon2 parameters, so an account is upgraded
// transparently at the one moment the plaintext is legitimately available.
export async function recordSuccessfulLogin(user, { rehashedPassword = null } = {}) {
  const update = {
    failedLoginAttempts: 0,
    lockUntil: null,
    lastLoginAt: new Date(),
  }
  if (rehashedPassword) update.passwordHash = rehashedPassword

  await User.updateOne({ _id: user._id }, { $set: update })
}

// Changing a password ends every other session. `sessionVersion` is compared on
// each authenticated request, so raising it invalidates sessions that are
// already in the store without having to hunt through them.
export async function setPassword(user, newPassword) {
  const passwordHash = await hashPassword(newPassword)

  const result = await User.findByIdAndUpdate(
    user._id,
    {
      $set: { passwordHash, passwordChangedAt: new Date(), failedLoginAttempts: 0, lockUntil: null },
      $inc: { sessionVersion: 1 },
    },
    { new: true }
  ).select(SESSION_FIELDS)

  return result
}

// "Sign out everywhere", without a password change. Takes an id so it can be
// called with nothing more than the session's contents.
export async function invalidateAllSessions(userId) {
  const objectId = asObjectId(userId)
  if (!objectId) return null
  return User.findByIdAndUpdate(objectId, { $inc: { sessionVersion: 1 } }, { new: true }).select(
    SESSION_FIELDS
  )
}

export function isActive(user) {
  return Boolean(user) && user.status === ACTIVE_USER_STATUS
}

export default {
  findByEmailForLogin,
  findByIdForSession,
  findByIdForLogin,
  emailExists,
  createUser,
  recordFailedLogin,
  recordSuccessfulLogin,
  setPassword,
  invalidateAllSessions,
  isActive,
}
