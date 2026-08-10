// Password policy, hashing, and verification. Argon2id only.
//
// Argon2id won the Password Hashing Competition and is memory-hard, which is
// what makes GPU cracking expensive. bcrypt is not a drop-in substitute here:
// if argon2 ever fails to load, the correct response is to stop, not to
// silently downgrade the hash.
import argon2 from 'argon2'
import ApiError from './ApiError.js'

// OWASP's recommended Argon2id baseline: 19 MiB, 2 iterations, 1 lane.
export const ARGON2_OPTIONS = Object.freeze({
  type: argon2.argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
})

// Long enough to resist offline guessing; capped so a huge body cannot burn
// CPU in the hash function. No composition rules — forcing a symbol produces
// "Password1!" far more often than it produces entropy.
export const MIN_PASSWORD_LENGTH = 12
export const MAX_PASSWORD_LENGTH = 128

// A real Argon2id hash of a value nobody uses. Login verifies against this when
// the email does not exist, so an unknown email costs the same measurable time
// as a wrong password. Without it, response timing reveals which emails are
// registered. This is not a credential and is safe in source.
export const DUMMY_PASSWORD_HASH =
  '$argon2id$v=19$m=19456,p=1,t=2$WV7oiQFo0gRdgGkPR6OFfg$mrBs0LuFcLweF72pCzPoBf/EWvh1C96+jC5ar1E7S0E'

export function validatePasswordPolicy(password) {
  if (typeof password !== 'string' || password.length === 0) {
    throw ApiError.badRequest('A password is required.')
  }
  // Length is measured on the raw value: passwords are never trimmed, because
  // a leading or trailing space is a legitimate character the user chose.
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw ApiError.badRequest(`A password must be at least ${MIN_PASSWORD_LENGTH} characters.`)
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    throw ApiError.badRequest(`A password cannot be longer than ${MAX_PASSWORD_LENGTH} characters.`)
  }
  return true
}

export async function hashPassword(password) {
  validatePasswordPolicy(password)
  return argon2.hash(password, ARGON2_OPTIONS)
}

// Never throws on a bad hash: a malformed stored value must read as "does not
// match", not as a server error that distinguishes it from a wrong password.
export async function verifyPassword(hash, password) {
  if (typeof hash !== 'string' || typeof password !== 'string') return false
  try {
    return await argon2.verify(hash, password)
  } catch {
    return false
  }
}

// Burns comparable CPU when no account matched, so timing does not leak
// whether the email exists. The result is discarded by design.
export async function verifyAgainstDummy(password) {
  await verifyPassword(DUMMY_PASSWORD_HASH, typeof password === 'string' ? password : '')
  return false
}

// True when a stored hash predates the current parameters, so it can be
// upgraded transparently on the next successful login.
export function passwordNeedsRehash(hash) {
  if (typeof hash !== 'string') return true
  try {
    return argon2.needsRehash(hash, ARGON2_OPTIONS)
  } catch {
    return true
  }
}

export default { validatePasswordPolicy, hashPassword, verifyPassword, passwordNeedsRehash }
