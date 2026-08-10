// The whole authentication stack over HTTP: cookies, CSRF, sessions, lockout.
//
// Needs a real database, and refuses to touch one whose name does not end in
// _test. `npm run test:auth` loads the ordinary .env and switches database via
// AUTH_TEST_DATABASE_NAME; plain `npm test` loads no env file at all, so this
// file skips there rather than failing.
import assert from 'node:assert/strict'
import test, { after, before, describe } from 'node:test'
import User from '../../src/modules/users/user.model.js'
import {
  apiPath,
  buildTestApp,
  closeTestApps,
  getCsrfToken,
  loginUser,
  newAgent,
  registerUser,
  sessionCookieAttributes,
  sessionCookieValue,
  testConfig,
} from '../helpers/authTestAgent.js'
import {
  cleanupTestSessions,
  cleanupTestUsers,
  connectTestDatabase,
  disconnectTestDatabase,
  testDatabaseSkipReason,
  testEmail,
} from '../helpers/authTestDatabase.js'
import mongoose from 'mongoose'

// The helper already returns undefined rather than null: node:test treats
// `skip: null` as truthy and would silently skip the whole suite.
const skip = testDatabaseSkipReason()
const PASSWORD = 'annapurna-base-camp-2026'

describe('authentication over HTTP', { skip }, () => {
  let config

  before(async () => {
    await connectTestDatabase()
    config = testConfig()
    await cleanupTestUsers()
  })

  after(async () => {
    await cleanupTestUsers()
    await cleanupTestSessions()
    // Before disconnecting: every store rides on the same MongoClient, and one
    // left open is what leaves the test process hanging after the last assert.
    await closeTestApps()
    await disconnectTestDatabase()
  })

  // -------------------------------------------------------------- CSRF

  describe('CSRF', () => {
    // A fresh app per group: the register and login limiters count in memory
    // per app, so a shared one would let one group exhaust another's budget.
    let app
    before(() => {
      app = buildTestApp()
    })

    test('a token can be fetched without signing in', async () => {
      const agent = newAgent(app)
      const response = await agent.get(apiPath(config, '/auth/csrf-token'))

      assert.equal(response.status, 200)
      assert.equal(response.body.success, true)
      assert.equal(response.body.message, 'CSRF token created.')
      assert.match(response.body.data.csrfToken, /^[0-9a-f]{64}$/)
    })

    test('a POST from a disallowed Origin is refused even with a valid token', async () => {
      const agent = newAgent(app)
      const token = await getCsrfToken(agent, config)

      const response = await agent
        .post(apiPath(config, '/auth/login'))
        .set('X-CSRF-Token', token)
        .set('Origin', 'https://evil.example')
        .send({ email: testEmail('nobody'), password: PASSWORD })

      assert.equal(response.status, 403)
    })

    test('a POST without a token is refused with 403', async () => {
      const agent = newAgent(app)
      await getCsrfToken(agent, config)

      const response = await agent
        .post(apiPath(config, '/auth/login'))
        .send({ email: testEmail('nobody'), password: PASSWORD })

      assert.equal(response.status, 403)
      assert.equal(response.body.success, false)
    })

    test("a POST with another session's token is refused", async () => {
      const attacker = newAgent(app)
      const victim = newAgent(app)
      const attackerToken = await getCsrfToken(attacker, config)
      await getCsrfToken(victim, config)

      const response = await victim
        .post(apiPath(config, '/auth/login'))
        .set('X-CSRF-Token', attackerToken)
        .send({ email: testEmail('nobody'), password: PASSWORD })

      assert.equal(response.status, 403)
    })

    test('a GET needs no token, so the public catalogue is unaffected', async () => {
      const response = await newAgent(app).get(apiPath(config, '/health'))
      assert.equal(response.status, 200)
    })
  })

  // ---------------------------------------------------------- registration

  describe('registration', () => {
    // A fresh app per group: the register and login limiters count in memory
    // per app, so a shared one would let one group exhaust another's budget.
    let app
    before(() => {
      app = buildTestApp()
    })

    test('creates an account and signs the person in', async () => {
      const email = testEmail('new')
      const { response } = await registerUser(app, config, {
        fullName: 'New Customer',
        email,
        password: PASSWORD,
      })

      assert.equal(response.status, 201)
      assert.equal(response.body.success, true)
      assert.equal(response.body.data.user.email, email)
      assert.ok(response.body.meta.requestId)
    })

    test('the response never contains a password or a hash', async () => {
      const { response } = await registerUser(app, config, {
        fullName: 'No Leaks',
        email: testEmail('leak'),
        password: PASSWORD,
      })

      const body = JSON.stringify(response.body)
      assert.ok(!body.includes('passwordHash'))
      assert.ok(!body.includes('argon2'))
      assert.ok(!body.includes(PASSWORD))
      assert.ok(!body.includes('sessionVersion'))
    })

    test('a role in the body is ignored — everyone registers as a customer', async () => {
      const email = testEmail('escalate')
      const agent = newAgent(app)
      const token = await getCsrfToken(agent, config)

      const response = await agent
        .post(apiPath(config, '/auth/register'))
        .set('X-CSRF-Token', token)
        .send({
          fullName: 'Would Be Admin',
          email,
          password: PASSWORD,
          role: 'super_admin',
          status: 'active',
        })

      assert.equal(response.status, 201)
      assert.equal(response.body.data.user.role, 'customer')

      // And the stored record agrees — not just the response.
      const stored = await User.findOne({ email })
      assert.equal(stored.role, 'customer')
    })

    test('preferences are stored, and unknown preference keys are dropped', async () => {
      const email = testEmail('prefs')
      const agent = newAgent(app)
      const token = await getCsrfToken(agent, config)

      const response = await agent
        .post(apiPath(config, '/auth/register'))
        .set('X-CSRF-Token', token)
        .send({
          fullName: 'With Preferences',
          email,
          password: PASSWORD,
          preferences: { country: 'South Korea', language: 'English', currency: 'USD', isAdmin: true },
        })

      assert.equal(response.status, 201)
      assert.deepEqual(response.body.data.user.preferences, {
        country: 'South Korea',
        language: 'English',
        currency: 'USD',
      })
    })

    test('the password is stored as an Argon2id hash, never as plaintext', async () => {
      const email = testEmail('hashed')
      await registerUser(app, config, { fullName: 'Hashed', email, password: PASSWORD })

      const stored = await User.findOne({ email }).select('+passwordHash')
      assert.match(stored.passwordHash, /^\$argon2id\$/)
      assert.ok(!stored.passwordHash.includes(PASSWORD))
    })

    test('a duplicate email is a 409, whatever its casing', async () => {
      const email = testEmail('dupe')
      await registerUser(app, config, { fullName: 'First', email, password: PASSWORD })

      const { response } = await registerUser(app, config, {
        fullName: 'Second',
        email: email.toUpperCase(),
        password: PASSWORD,
      })

      assert.equal(response.status, 409)
    })

    test('a short password is a 400 and creates nothing', async () => {
      const email = testEmail('weak')
      const { response } = await registerUser(app, config, {
        fullName: 'Weak Password',
        email,
        password: 'short',
      })

      assert.equal(response.status, 400)
      assert.equal(await User.countDocuments({ email }), 0)
    })
  })

  // ---------------------------------------------------------------- login

  describe('login', () => {
    // A fresh app per group: the register and login limiters count in memory
    // per app, so a shared one would let one group exhaust another's budget.
    let app
    before(() => {
      app = buildTestApp()
    })

    const email = testEmail('signin')

    before(async () => {
      await registerUser(app, config, { fullName: 'Sign In', email, password: PASSWORD })
    })

    test('correct credentials sign in', async () => {
      const { response } = await loginUser(app, config, { email, password: PASSWORD })
      assert.equal(response.status, 200)
      assert.equal(response.body.data.user.email, email)
    })

    test('the email is matched case-insensitively', async () => {
      const { response } = await loginUser(app, config, {
        email: email.toUpperCase(),
        password: PASSWORD,
      })
      assert.equal(response.status, 200)
    })

    test('a wrong password and an unknown email give the identical message', async () => {
      const wrong = await loginUser(app, config, { email, password: 'wrong-password-here' })
      const unknown = await loginUser(app, config, {
        email: testEmail('ghost'),
        password: 'wrong-password-here',
      })

      assert.equal(wrong.response.status, 401)
      assert.equal(unknown.response.status, 401)
      // Any difference at all would turn the login form into an account
      // enumeration tool.
      assert.equal(wrong.response.body.message, unknown.response.body.message)
      assert.equal(wrong.response.body.message, 'Invalid email or password.')
    })

    test('the session id changes at login, which defeats session fixation', async () => {
      const agent = newAgent(app)
      const before = await agent.get(apiPath(config, '/auth/csrf-token'))
      const beforeId = sessionCookieValue(before, config.sessionCookieName)

      const token = before.body.data.csrfToken
      const after = await agent
        .post(apiPath(config, '/auth/login'))
        .set('X-CSRF-Token', token)
        .send({ email, password: PASSWORD })

      const afterId = sessionCookieValue(after, config.sessionCookieName)
      assert.ok(beforeId)
      assert.ok(afterId)
      assert.notEqual(beforeId, afterId)
    })

    test('the CSRF token is rotated at login too', async () => {
      const agent = newAgent(app)
      const before = await getCsrfToken(agent, config)
      const response = await agent
        .post(apiPath(config, '/auth/login'))
        .set('X-CSRF-Token', before)
        .send({ email, password: PASSWORD })

      assert.notEqual(response.body.data.csrfToken, before)
    })

    test('the session cookie is HttpOnly, SameSite, and path-scoped', async () => {
      const { response } = await loginUser(app, config, { email, password: PASSWORD })
      const cookie = sessionCookieAttributes(response, config.sessionCookieName)

      assert.match(cookie, /HttpOnly/i)
      assert.match(cookie, /SameSite=Lax/i)
      assert.match(cookie, /Path=\//i)
    })

    test('the cookie carries no user data — only a signed id', async () => {
      const { response } = await loginUser(app, config, { email, password: PASSWORD })
      const value = decodeURIComponent(sessionCookieValue(response, config.sessionCookieName))

      assert.ok(!value.includes(email))
      assert.ok(!value.includes('customer'))
      assert.ok(!value.includes('role'))
    })
  })

  // ------------------------------------------------------------- session

  describe('the signed-in session', () => {
    // A fresh app per group: the register and login limiters count in memory
    // per app, so a shared one would let one group exhaust another's budget.
    let app
    before(() => {
      app = buildTestApp()
    })

    const email = testEmail('session')
    let agent

    before(async () => {
      const result = await registerUser(app, config, {
        fullName: 'Session Holder',
        email,
        password: PASSWORD,
      })
      agent = result.agent
    })

    test('/me returns the signed-in user', async () => {
      const response = await agent.get(apiPath(config, '/auth/me'))
      assert.equal(response.status, 200)
      assert.equal(response.body.data.user.email, email)
      assert.equal(response.body.data.user.passwordHash, undefined)
    })

    test('/me without a session is 401', async () => {
      const response = await newAgent(app).get(apiPath(config, '/auth/me'))
      assert.equal(response.status, 401)
      assert.equal(response.body.success, false)
      assert.equal(response.body.data, null)
    })

    test('logout works even when the session already lapsed', async () => {
      // A "sign out" button must not fail for the one person who needed it.
      // CSRF still applies, so it cannot be triggered from another origin.
      const agent = newAgent(app)
      const token = await getCsrfToken(agent, config)
      const response = await agent.post(apiPath(config, '/auth/logout')).set('X-CSRF-Token', token)
      assert.equal(response.status, 200)
      assert.equal(response.body.success, true)
    })

    test('logout without a CSRF token is still refused', async () => {
      const response = await newAgent(app).post(apiPath(config, '/auth/logout'))
      assert.equal(response.status, 403)
    })

    test('logout ends the session and clears the cookie', async () => {
      const { agent: temporary, csrfToken } = await loginUser(app, config, {
        email,
        password: PASSWORD,
      })

      const response = await temporary
        .post(apiPath(config, '/auth/logout'))
        .set('X-CSRF-Token', csrfToken)

      assert.equal(response.status, 200)
      const after = await temporary.get(apiPath(config, '/auth/me'))
      assert.equal(after.status, 401)
    })

    test('the role comes from the database on every request, not from the session', async () => {
      const { agent: temporary } = await loginUser(app, config, { email, password: PASSWORD })

      await User.updateOne({ email }, { $set: { role: 'super_admin' } })
      const response = await temporary.get(apiPath(config, '/auth/me'))
      assert.equal(response.body.data.user.role, 'super_admin')

      await User.updateOne({ email }, { $set: { role: 'customer' } })
    })

    test('suspending an account ends its existing session immediately', async () => {
      const { agent: temporary } = await loginUser(app, config, { email, password: PASSWORD })

      await User.updateOne({ email }, { $set: { status: 'suspended' } })
      const response = await temporary.get(apiPath(config, '/auth/me'))
      assert.equal(response.status, 401)

      await User.updateOne({ email }, { $set: { status: 'active' } })
    })

    test('a suspended account cannot sign in even with the right password', async () => {
      await User.updateOne({ email }, { $set: { status: 'suspended' } })
      const { response } = await loginUser(app, config, { email, password: PASSWORD })

      // The same 401 as a wrong password. Saying "suspended" would confirm the
      // account exists to anybody who guessed the address.
      assert.equal(response.status, 401)
      assert.equal(response.body.message, 'Invalid email or password.')

      await User.updateOne({ email }, { $set: { status: 'active' } })
    })
  })

  // --------------------------------------------------- absolute expiry

  describe('absolute session expiry', () => {
    // A fresh app per group: the register and login limiters count in memory
    // per app, so a shared one would let one group exhaust another's budget.
    let app
    before(() => {
      app = buildTestApp()
    })

    const sessionsCollection = () => mongoose.connection.db.collection('sessions')

    // Reaches into the store and moves this user's absolute deadline into the
    // past. Waiting eight hours is not a test.
    //
    // Matched on the user's own id, not "any session with a userId" — the
    // collection holds every other test's sessions too.
    async function expireStoredSession(email) {
      const user = await User.findOne({ email })
      assert.ok(user, 'expected the user to exist')

      const result = await sessionsCollection().updateMany(
        { 'session.userId': String(user._id) },
        { $set: { 'session.absoluteExpiresAt': Date.now() - 1000 } }
      )
      assert.ok(result.matchedCount > 0, 'expected a stored session for this user')
      return String(user._id)
    }

    test('a session past its absolute deadline is rejected however active it is', async () => {
      const email = testEmail('absolute')
      const { agent } = await registerUser(app, config, {
        fullName: 'Absolute Expiry',
        email,
        password: PASSWORD,
      })

      assert.equal((await agent.get(apiPath(config, '/auth/me'))).status, 200)

      await expireStoredSession(email)

      // The session is still in the store and the cookie is still valid — only
      // the absolute deadline has passed.
      const response = await agent.get(apiPath(config, '/auth/me'))
      assert.equal(response.status, 401)
    })

    test('the expired session is destroyed, not merely refused', async () => {
      const email = testEmail('destroyed')
      const { agent } = await registerUser(app, config, {
        fullName: 'Destroyed On Expiry',
        email,
        password: PASSWORD,
      })
      const userId = await expireStoredSession(email)
      await agent.get(apiPath(config, '/auth/me'))

      // Refused *and* removed from the store — an expired session is worthless,
      // so it is not left for the next request to re-check.
      const remaining = await sessionsCollection().countDocuments({
        'session.userId': userId,
      })
      assert.equal(remaining, 0)
    })

    test('the idle limit is enforced by the store, not by the client', async () => {
      // The idle limit lives on the cookie and on the store document's
      // `expires`. Only the second one is authoritative: a client controls its
      // own cookies, so if the store still honoured an idle-expired session,
      // replaying a stolen cookie would work indefinitely.
      //
      // Backdate `expires` alone and leave the agent's cookie untouched.
      const email = testEmail('idle')
      const { agent } = await registerUser(app, config, {
        fullName: 'Idle Expiry',
        email,
        password: PASSWORD,
      })
      assert.equal((await agent.get(apiPath(config, '/auth/me'))).status, 200)

      const user = await User.findOne({ email })
      const result = await sessionsCollection().updateMany(
        { 'session.userId': String(user._id) },
        { $set: { expires: new Date(Date.now() - 60_000) } }
      )
      assert.ok(result.modifiedCount > 0)

      // The cookie is still perfectly valid as far as the browser knows.
      assert.equal((await agent.get(apiPath(config, '/auth/me'))).status, 401)
    })

    test('a live session records authenticatedAt and absoluteExpiresAt, and nothing else', async () => {
      const email = testEmail('shape')
      await registerUser(app, config, { fullName: 'Session Shape', email, password: PASSWORD })

      const user = await User.findOne({ email })
      const stored = await sessionsCollection().findOne({ 'session.userId': String(user._id) })
      assert.ok(stored, 'expected a stored session')
      const keys = Object.keys(stored.session).sort()

      // `cookie` is express-session's own. Everything else is ours, and there
      // is deliberately no role, email, or name among them.
      assert.deepEqual(keys, [
        'absoluteExpiresAt',
        'authenticatedAt',
        'cookie',
        'csrfToken',
        'sessionVersion',
        'userId',
      ])
    })

    test('the stored session contains no password, hash, or role', async () => {
      const email = testEmail('nosecrets')
      await registerUser(app, config, { fullName: 'No Secrets', email, password: PASSWORD })

      const user = await User.findOne({ email })
      const stored = await sessionsCollection().findOne({ 'session.userId': String(user._id) })
      const serialised = JSON.stringify(stored.session)

      for (const leak of ['argon2', 'passwordHash', 'customer', 'role', PASSWORD]) {
        assert.ok(!serialised.includes(leak), `${leak} leaked into the session store`)
      }
    })
  })

  // ----------------------------------------------------- password change

  describe('changing a password', () => {
    // A fresh app per group: the register and login limiters count in memory
    // per app, so a shared one would let one group exhaust another's budget.
    let app
    before(() => {
      app = buildTestApp()
    })

    test('the current password must be correct', async () => {
      const email = testEmail('pwcheck')
      const { agent, csrfToken } = await registerUser(app, config, {
        fullName: 'Password Check',
        email,
        password: PASSWORD,
      })

      const response = await agent
        .post(apiPath(config, '/auth/change-password'))
        .set('X-CSRF-Token', csrfToken)
        .send({ currentPassword: 'not-the-right-one', newPassword: 'a-brand-new-password-1' })

      assert.equal(response.status, 401)
    })

    test('a successful change signs out every other device but not this one', async () => {
      const email = testEmail('pwchange')
      const newPassword = 'a-brand-new-password-1'

      const { agent: laptop, csrfToken } = await registerUser(app, config, {
        fullName: 'Two Devices',
        email,
        password: PASSWORD,
      })
      const { agent: phone } = await loginUser(app, config, { email, password: PASSWORD })

      // Both are live before the change.
      assert.equal((await phone.get(apiPath(config, '/auth/me'))).status, 200)

      const response = await laptop
        .post(apiPath(config, '/auth/change-password'))
        .set('X-CSRF-Token', csrfToken)
        .send({ currentPassword: PASSWORD, newPassword })

      assert.equal(response.status, 200)
      // The other device is out.
      assert.equal((await phone.get(apiPath(config, '/auth/me'))).status, 401)
      // The device that made the change stays in.
      assert.equal((await laptop.get(apiPath(config, '/auth/me'))).status, 200)

      // And the new password is the one that works now.
      assert.equal((await loginUser(app, config, { email, password: newPassword })).response.status, 200)
      assert.equal((await loginUser(app, config, { email, password: PASSWORD })).response.status, 401)
    })

    test('logout-all ends every session including the current one', async () => {
      const email = testEmail('logoutall')
      const { agent: laptop, csrfToken } = await registerUser(app, config, {
        fullName: 'Everywhere',
        email,
        password: PASSWORD,
      })
      const { agent: phone } = await loginUser(app, config, { email, password: PASSWORD })

      const response = await laptop
        .post(apiPath(config, '/auth/logout-all'))
        .set('X-CSRF-Token', csrfToken)

      assert.equal(response.status, 200)
      assert.equal((await phone.get(apiPath(config, '/auth/me'))).status, 401)
      assert.equal((await laptop.get(apiPath(config, '/auth/me'))).status, 401)
    })
  })

  // --------------------------------------------------------- account lock

  describe('account lockout', () => {
    test('repeated wrong guesses lock the account, and the right password then fails too', async () => {
      // A fresh app: the login rate limiter counts in memory per app, and this
      // test deliberately produces a burst of failures.
      const isolated = buildTestApp()
      const email = testEmail('lockout')

      await registerUser(isolated, config, { fullName: 'Locked Out', email, password: PASSWORD })

      for (let attempt = 0; attempt < config.accountLockThreshold; attempt += 1) {
        const { response } = await loginUser(isolated, config, { email, password: 'wrong-guess-here' })
        assert.equal(response.status, 401, `attempt ${attempt + 1}`)
      }

      const stored = await User.findOne({ email }).select('+failedLoginAttempts +lockUntil')
      assert.equal(stored.failedLoginAttempts, config.accountLockThreshold)
      assert.ok(stored.isLocked())

      // Still the generic message. Saying "locked" would confirm to an attacker
      // that this address has an account worth attacking.
      const { response } = await loginUser(isolated, config, { email, password: PASSWORD })
      assert.equal(response.status, 401)
      assert.equal(response.body.message, 'Invalid email or password.')
    })

    test('more guesses while locked do not extend the lock', async () => {
      // Otherwise an attacker could keep somebody permanently locked out of
      // their own account just by continuing to guess.
      const isolated = buildTestApp()
      const email = testEmail('noextend')

      await registerUser(isolated, config, { fullName: 'No Extend', email, password: PASSWORD })
      for (let attempt = 0; attempt < config.accountLockThreshold; attempt += 1) {
        await loginUser(isolated, config, { email, password: 'wrong-guess-here' })
      }

      const locked = await User.findOne({ email }).select('+failedLoginAttempts +lockUntil')
      await loginUser(isolated, config, { email, password: 'wrong-guess-here' })
      const after = await User.findOne({ email }).select('+failedLoginAttempts +lockUntil')

      assert.equal(after.failedLoginAttempts, locked.failedLoginAttempts)
      assert.equal(after.lockUntil.getTime(), locked.lockUntil.getTime())
    })

    test('the lock is temporary, never permanent', async () => {
      const isolated = buildTestApp()
      const email = testEmail('temporary')
      await registerUser(isolated, config, { fullName: 'Temporary', email, password: PASSWORD })

      for (let attempt = 0; attempt < config.accountLockThreshold; attempt += 1) {
        await loginUser(isolated, config, { email, password: 'wrong-guess-here' })
      }

      const stored = await User.findOne({ email }).select('+lockUntil')
      const remainingMs = stored.lockUntil.getTime() - Date.now()
      assert.ok(remainingMs > 0)
      assert.ok(remainingMs <= config.accountLockMs)
    })

    test('a successful sign-in clears the failure counter', async () => {
      const isolated = buildTestApp()
      const email = testEmail('recovers')

      await registerUser(isolated, config, { fullName: 'Recovers', email, password: PASSWORD })
      await loginUser(isolated, config, { email, password: 'wrong-guess-here' })
      await loginUser(isolated, config, { email, password: PASSWORD })

      const stored = await User.findOne({ email }).select('+failedLoginAttempts +lockUntil')
      assert.equal(stored.failedLoginAttempts, 0)
      assert.equal(stored.lockUntil, null)
    })
  })

  // -------------------------------------------------------- rate limiting

  describe('rate limiting', () => {
    test('too many failures from one client are refused with 429', async () => {
      const isolated = buildTestApp()
      const agent = newAgent(isolated)
      const token = await getCsrfToken(agent, config)

      let sawRateLimit = false
      // One more than the budget, all against different accounts so per-account
      // lockout is not what stops it.
      for (let attempt = 0; attempt <= config.loginMaxAttempts; attempt += 1) {
        const response = await agent
          .post(apiPath(config, '/auth/login'))
          .set('X-CSRF-Token', token)
          .send({ email: testEmail('spray'), password: 'wrong-guess-here' })

        if (response.status === 429) {
          sawRateLimit = true
          break
        }
      }
      assert.ok(sawRateLimit, 'the login endpoint should have rate limited')
    })
  })

  // ------------------------------------------------------- error envelope

  describe('the response envelope', () => {
    // A fresh app per group: the register and login limiters count in memory
    // per app, so a shared one would let one group exhaust another's budget.
    let app
    before(() => {
      app = buildTestApp()
    })

    test('a failure keeps the same four keys as a success', async () => {
      const response = await newAgent(app).get(apiPath(config, '/auth/me'))
      assert.deepEqual(Object.keys(response.body).sort(), ['data', 'message', 'meta', 'success'])
      assert.equal(response.body.success, false)
      assert.ok(response.body.meta.requestId)
    })

    test('no error body ever contains a stack trace or a connection string', async () => {
      const agent = newAgent(app)
      const token = await getCsrfToken(agent, config)
      const response = await agent
        .post(apiPath(config, '/auth/login'))
        .set('X-CSRF-Token', token)
        .send({ email: 'not-an-email', password: 'x' })

      const body = JSON.stringify(response.body)
      assert.ok(!body.includes('mongodb'))
      assert.ok(!body.includes('at Object.'))
    })
  })
})
