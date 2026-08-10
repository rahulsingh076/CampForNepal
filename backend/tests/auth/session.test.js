// Absolute session expiry, against fake requests.
//
// The idle limit is enforced by the cookie's Max-Age and the MongoDB store's
// TTL, both of which slide forward because the session is `rolling`. The
// absolute limit has nothing enforcing it but this middleware, so this is where
// it gets tested.
import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import sessionTimeout from '../../src/middleware/sessionTimeout.js'

const config = {
  sessionCookieName: 'cfn.sid',
  sessionCookieSecure: false,
  sessionCookieSameSite: 'lax',
  sessionIdleTimeoutMs: 30 * 60 * 1000,
  sessionAbsoluteTimeoutMs: 8 * 60 * 60 * 1000,
}

function fakeRequest(session) {
  return {
    session: session && {
      ...session,
      destroy(callback) {
        this.destroyed = true
        callback(null)
      },
    },
  }
}

function fakeResponse() {
  return {
    cleared: [],
    clearCookie(name, options) {
      this.cleared.push({ name, options })
    },
  }
}

async function run(session) {
  const req = fakeRequest(session)
  const res = fakeResponse()
  let error
  await sessionTimeout(config)(req, res, (passed) => {
    error = passed
  })
  return { req, res, error }
}

describe('sessionTimeout — nothing to do', () => {
  test('a request with no session passes through', async () => {
    const { error } = await run(null)
    assert.equal(error, undefined)
  })

  test('an anonymous CSRF session is left alone, so the catalogue still works', async () => {
    const { req, error } = await run({ csrfToken: 'abc' })
    assert.equal(error, undefined)
    assert.equal(req.session.destroyed, undefined)
  })
})

describe('sessionTimeout — a live session', () => {
  test('a session inside its absolute window survives', async () => {
    const { req, res } = await run({
      userId: 'abc',
      authenticatedAt: Date.now() - 1000,
      absoluteExpiresAt: Date.now() + config.sessionAbsoluteTimeoutMs,
    })
    assert.equal(req.session.destroyed, undefined)
    assert.deepEqual(res.cleared, [])
  })

  test('a session one second inside the limit survives', async () => {
    const { req } = await run({
      userId: 'abc',
      authenticatedAt: Date.now() - config.sessionAbsoluteTimeoutMs + 1000,
      absoluteExpiresAt: Date.now() + 1000,
    })
    assert.equal(req.session.destroyed, undefined)
  })
})

describe('sessionTimeout — absolute expiry', () => {
  test('an expired session is destroyed even though it is being used constantly', async () => {
    // The point of the absolute limit: a stolen session cannot be kept alive
    // forever by making a request every few minutes.
    const { req } = await run({
      userId: 'abc',
      authenticatedAt: Date.now() - config.sessionAbsoluteTimeoutMs - 1000,
      absoluteExpiresAt: Date.now() - 1000,
    })
    assert.equal(req.session.destroyed, true)
  })

  test('the cookie is cleared with the attributes it was set with', async () => {
    // clearCookie only removes a cookie when path, sameSite, and secure match.
    // Getting this wrong leaves the browser holding a cookie for a session that
    // no longer exists.
    const { res } = await run({
      userId: 'abc',
      authenticatedAt: 0,
      absoluteExpiresAt: Date.now() - 1000,
    })
    assert.equal(res.cleared.length, 1)
    assert.equal(res.cleared[0].name, config.sessionCookieName)
    assert.equal(res.cleared[0].options.path, '/')
    assert.equal(res.cleared[0].options.sameSite, 'lax')
    assert.equal(res.cleared[0].options.secure, false)
  })

  test('the request continues as anonymous rather than failing here', async () => {
    // requireAuth is the single place that answers 401. A public page must
    // still render for somebody whose session lapsed.
    const { error } = await run({
      userId: 'abc',
      authenticatedAt: 0,
      absoluteExpiresAt: Date.now() - 1000,
    })
    assert.equal(error, undefined)
  })

  test('a session with no absolute expiry is treated as expired, not as unlimited', async () => {
    // A malformed session must fail closed. Reading a missing field as
    // "no limit" is how a bug becomes a permanent session.
    const { req } = await run({ userId: 'abc', authenticatedAt: Date.now() })
    assert.equal(req.session.destroyed, true)
  })

  test('the absolute limit is longer than the idle limit', () => {
    assert.ok(config.sessionAbsoluteTimeoutMs > config.sessionIdleTimeoutMs)
  })
})
