// CSRF middleware, tested directly against fake requests so every branch is
// reachable without a browser or a database.
import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import csrfProtection, {
  CSRF_HEADER,
  issueCsrfToken,
  rotateCsrfToken,
} from '../../src/middleware/csrfProtection.js'

const ALLOWED_ORIGINS = ['http://localhost:5173']

function fakeRequest({ method = 'POST', sessionToken, headerToken, origin } = {}) {
  const headers = {}
  if (headerToken !== undefined) headers[CSRF_HEADER] = headerToken
  if (origin !== undefined) headers.origin = origin

  return {
    method,
    session: sessionToken === undefined ? {} : { csrfToken: sessionToken },
    app: { locals: { config: { corsOrigins: ALLOWED_ORIGINS } } },
    get(name) {
      return headers[String(name).toLowerCase()]
    },
  }
}

// Runs the middleware and returns whatever it passed to next(): an ApiError on
// refusal, undefined on success.
function run(req) {
  let passed
  csrfProtection(req, {}, (error) => {
    passed = error
  })
  return passed
}

describe('issueCsrfToken', () => {
  test('creates a token on first use', () => {
    const req = { session: {} }
    const token = issueCsrfToken(req)
    assert.equal(typeof token, 'string')
    assert.equal(req.session.csrfToken, token)
  })

  test('is 64 hex characters — 32 bytes from a CSPRNG', () => {
    assert.match(issueCsrfToken({ session: {} }), /^[0-9a-f]{64}$/)
  })

  test('returns the same token on a second call, so a page does not invalidate itself', () => {
    const req = { session: {} }
    assert.equal(issueCsrfToken(req), issueCsrfToken(req))
  })

  test('two sessions get different tokens', () => {
    assert.notEqual(issueCsrfToken({ session: {} }), issueCsrfToken({ session: {} }))
  })
})

describe('rotateCsrfToken', () => {
  test('replaces an existing token', () => {
    // Called after every session regeneration, so a new session never inherits
    // the token the previous one used.
    const req = { session: {} }
    const first = issueCsrfToken(req)
    const second = rotateCsrfToken(req)
    assert.notEqual(first, second)
    assert.equal(req.session.csrfToken, second)
  })

  test('the replacement is refused against the old token', () => {
    const req = { session: {} }
    const old = issueCsrfToken(req)
    rotateCsrfToken(req)
    const error = run(fakeRequest({ sessionToken: req.session.csrfToken, headerToken: old }))
    assert.equal(error?.status, 403)
  })
})

describe('csrfProtection — Origin validation', () => {
  const token = 'a'.repeat(64)

  test('an allowed Origin with a valid token passes', () => {
    const request = fakeRequest({
      sessionToken: token,
      headerToken: token,
      origin: ALLOWED_ORIGINS[0],
    })
    assert.equal(run(request), undefined)
  })

  test('a foreign Origin is refused even with a valid token', () => {
    // A second, independent barrier: a browser always sends Origin on a
    // state-changing cross-origin request, and an attacker's page cannot forge
    // it. Belt and braces with the token itself.
    const request = fakeRequest({
      sessionToken: token,
      headerToken: token,
      origin: 'https://evil.example',
    })
    assert.equal(run(request)?.status, 403)
  })

  test('a request with no Origin still needs a token', () => {
    // curl and server-to-server calls are not browsers and are not subject to
    // CSRF, but the token requirement does not relax for them.
    assert.equal(run(fakeRequest({ sessionToken: token, headerToken: token })), undefined)
    assert.equal(run(fakeRequest({ sessionToken: token }))?.status, 403)
  })
})

describe('csrfProtection — safe methods', () => {
  for (const method of ['GET', 'HEAD', 'OPTIONS']) {
    test(`${method} passes without a token`, () => {
      assert.equal(run(fakeRequest({ method })), undefined)
    })
  }
})

describe('csrfProtection — unsafe methods', () => {
  const token = 'a'.repeat(64)

  for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) {
    test(`${method} with a matching token passes`, () => {
      assert.equal(run(fakeRequest({ method, sessionToken: token, headerToken: token })), undefined)
    })

    test(`${method} with no token is refused`, () => {
      const error = run(fakeRequest({ method, sessionToken: token }))
      assert.equal(error?.status, 403)
    })
  }

  test('a wrong token is refused', () => {
    const error = run(fakeRequest({ sessionToken: token, headerToken: 'b'.repeat(64) }))
    assert.equal(error?.status, 403)
  })

  test('a token of the wrong length is refused rather than throwing', () => {
    // timingSafeEqual throws on a length mismatch; the length check has to come
    // first or a short token becomes a 500 instead of a 403.
    const error = run(fakeRequest({ sessionToken: token, headerToken: 'short' }))
    assert.equal(error?.status, 403)
  })

  test('a request with no token in the session at all is refused', () => {
    const error = run(fakeRequest({ headerToken: token }))
    assert.equal(error?.status, 403)
  })

  test('a session token cannot be satisfied by a non-string header', () => {
    const error = run(fakeRequest({ sessionToken: token, headerToken: 12345 }))
    assert.equal(error?.status, 403)
  })

  test('the refusal never repeats the expected token back', () => {
    const error = run(fakeRequest({ sessionToken: token, headerToken: 'b'.repeat(64) }))
    assert.ok(!error.message.includes(token))
  })
})
