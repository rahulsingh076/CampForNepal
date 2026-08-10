// Authentication decisions. Knows nothing about HTTP, cookies, or sessions —
// it answers "is this person who they say they are" and leaves the session to
// the controller.
import ApiError from '../../utils/ApiError.js'
import {
  hashPassword,
  passwordNeedsRehash,
  verifyAgainstDummy,
  verifyPassword,
} from '../../utils/password.js'
import userService from '../users/user.service.js'

// One sentence for every sign-in failure, without exception: wrong password,
// unknown email, locked account, suspended account. Any variation turns the
// login form into a tool for discovering which addresses are registered and
// which of them are worth attacking.
//
// The cost is real — a locked-out customer is told only that the credentials
// are wrong — and it is accepted deliberately. See AUTHENTICATION.md.
const INVALID_CREDENTIALS = 'Invalid email or password.'

// Public registration. The role is not a parameter: it is always the default,
// so no request body can promote itself.
export async function register({ fullName, email, password, preferences }) {
  return userService.createUser({ fullName, email, password, preferences })
}

export async function login({ email, password }, config) {
  const user = await userService.findByEmailForLogin(email)

  if (!user) {
    // Hash a throwaway value so an unknown email costs the same measurable
    // time as a wrong password. Without this, response timing alone reveals
    // which addresses have accounts.
    await verifyAgainstDummy(password)
    throw ApiError.unauthorized(INVALID_CREDENTIALS)
  }

  const locked = user.isLocked()

  // Verified even when the account is locked or suspended, so those paths do
  // not answer measurably faster than an ordinary wrong password.
  const passwordMatches = await verifyPassword(user.passwordHash, password)

  if (!passwordMatches) {
    // Not counted while already locked: otherwise an attacker could extend
    // somebody's lockout indefinitely just by continuing to guess.
    if (!locked) {
      await userService.recordFailedLogin(user, {
        threshold: config.accountLockThreshold,
        lockMs: config.accountLockMs,
      })
    }
    throw ApiError.unauthorized(INVALID_CREDENTIALS)
  }

  // The password was right, but the account still cannot be used. Same message
  // as a wrong password — the caller learns nothing either way.
  if (locked) throw ApiError.unauthorized(INVALID_CREDENTIALS)
  if (!userService.isActive(user)) throw ApiError.unauthorized(INVALID_CREDENTIALS)

  // The one moment the plaintext is legitimately in hand, so an old hash can
  // be upgraded to the current Argon2 parameters without asking the user.
  const rehashedPassword = passwordNeedsRehash(user.passwordHash)
    ? await hashPassword(password)
    : null

  await userService.recordSuccessfulLogin(user, { rehashedPassword })
  return user
}

export async function changePassword(userId, { currentPassword, newPassword }) {
  const user = await userService.findByIdForLogin(userId)
  if (!user) throw ApiError.unauthorized('You need to sign in to do that.')

  // Re-proving the current password is what stops a hijacked session from
  // locking the real owner out of their own account.
  const matches = await verifyPassword(user.passwordHash, currentPassword)
  if (!matches) throw ApiError.unauthorized('That current password is not correct.')

  // Checked against the stored hash rather than by comparing the two strings,
  // so it still holds when the "new" password differs only by encoding.
  if (await verifyPassword(user.passwordHash, newPassword)) {
    throw ApiError.badRequest('The new password must be different from the current one.')
  }

  // Raises sessionVersion, which invalidates every existing session.
  return userService.setPassword(user, newPassword)
}

export async function signOutEverywhere(userId) {
  return userService.invalidateAllSessions(userId)
}

export default { register, login, changePassword, signOutEverywhere }
