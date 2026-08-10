// Optional replay protection for inquiry creation.
//
// The problem it solves is ordinary: somebody double-clicks Send, or their
// connection drops after the server committed but before the response arrived,
// and they retry. Without this they get two identical inquiries and staff
// phone them twice.
//
// The client sends the same `Idempotency-Key` header on the retry; the server
// recognises it and returns the original result instead of creating a second
// record.
//
// The raw key is never stored. A client may well reuse something meaningful —
// a form session id, or worse — and a stored raw key would become one more
// thing to leak. Only a SHA-256 hash goes to the database, which is all a
// lookup needs.
//
// This is NOT authentication. The key proves nothing about who is asking, so
// it is scoped by the hash alone and grants no read access to anything.
import { createHash } from 'node:crypto'
import ApiError from './ApiError.js'

export const IDEMPOTENCY_HEADER = 'idempotency-key'

// Long enough for a UUID or a hash, short enough that the header cannot be used
// to push a large value into the request.
export const MAX_IDEMPOTENCY_KEY_LENGTH = 200
const MIN_IDEMPOTENCY_KEY_LENGTH = 8

// Header only. A key in a query string ends up in access logs, browser history,
// and referrer headers — every place a request identifier should not be.
export function readIdempotencyKey(req) {
  const raw = req.get(IDEMPOTENCY_HEADER)
  if (raw === undefined || raw === null || raw === '') return null

  if (typeof raw !== 'string') {
    throw ApiError.badRequest('The Idempotency-Key header must be a single value.')
  }
  const key = raw.trim()
  if (key.length < MIN_IDEMPOTENCY_KEY_LENGTH) {
    throw ApiError.badRequest(
      `An Idempotency-Key must be at least ${MIN_IDEMPOTENCY_KEY_LENGTH} characters.`
    )
  }
  if (key.length > MAX_IDEMPOTENCY_KEY_LENGTH) {
    throw ApiError.badRequest(
      `An Idempotency-Key cannot be longer than ${MAX_IDEMPOTENCY_KEY_LENGTH} characters.`
    )
  }
  return key
}

// SHA-256 is right here and bcrypt/Argon2 would be wrong: this is a lookup key,
// not a password. It has no low-entropy guessing problem to defend against, and
// a deliberately slow hash on every submission would be a free denial of
// service.
export function hashIdempotencyKey(key) {
  if (typeof key !== 'string' || key.length === 0) return null
  return createHash('sha256').update(key, 'utf8').digest('hex')
}

export default { readIdempotencyKey, hashIdempotencyKey, IDEMPOTENCY_HEADER }
