// Drives the whole authentication flow against the real app and reports
// PASS or FAIL for each step.
//
//   npm run verify:auth
//
// This is the 14-step manual check written down so it can be repeated. It runs
// against the **test** database (AUTH_TEST_DATABASE_NAME), never the
// development catalogue, and deletes the accounts it creates.
//
// It never prints a secret, a URI, or a password.
import assert from 'node:assert/strict'
import mongoose from 'mongoose'
import request from 'supertest'
import createApp from '../src/app.js'
import { connectDatabase, disconnectDatabase } from '../src/config/database.js'
import loadEnv from '../src/config/env.js'
import User from '../src/modules/users/user.model.js'

const EMAIL = `verify-auth-${process.pid}@authtest.invalid`
const PASSWORD = 'annapurna-base-camp-2026'
const NEW_PASSWORD = 'langtang-valley-winter-2027'

const results = []

async function step(name, run) {
  try {
    await run()
    results.push({ name, ok: true })
    console.log(`  PASS  ${name}`)
  } catch (error) {
    results.push({ name, ok: false, detail: error.message })
    console.log(`  FAIL  ${name}`)
    console.log(`        ${error.message.split('\n')[0]}`)
  }
}

function withDatabaseName(uri, databaseName) {
  const url = new URL(uri)
  url.pathname = `/${databaseName}`
  return url.toString()
}

async function main() {
  const config = loadEnv()

  const databaseName = config.authTestDatabaseName
  if (!databaseName) throw new Error('AUTH_TEST_DATABASE_NAME is not set. See .env.example.')

  await connectDatabase(withDatabaseName(config.mongodbUri, databaseName))

  // The same guard the tests use. Never delete from anything but a _test name.
  const live = mongoose.connection.name
  if (!live.endsWith('_test') || live === 'camp_for_nepal') {
    await disconnectDatabase()
    throw new Error(`Refusing to run against "${live}".`)
  }

  console.log('Camp For Nepal — authentication verification')
  console.log(`  database: ${live}\n`)

  const app = createApp(config)
  const api = (path) => `${config.apiPrefix}${path}`

  const first = request.agent(app)
  const second = request.agent(app)
  let token = null
  let secondToken = null

  try {
    await step('1. a CSRF token can be obtained anonymously', async () => {
      const response = await first.get(api('/auth/csrf-token'))
      assert.equal(response.status, 200)
      assert.equal(response.body.message, 'CSRF token created.')
      assert.match(response.body.data.csrfToken, /^[0-9a-f]{64}$/)
      token = response.body.data.csrfToken
    })

    await step('2. a temporary customer can register', async () => {
      const response = await first
        .post(api('/auth/register'))
        .set('X-CSRF-Token', token)
        .send({
          fullName: 'Verification Account',
          email: EMAIL,
          password: PASSWORD,
          preferences: { country: 'Nepal', language: 'English', currency: 'USD' },
          role: 'super_admin',
        })
      assert.equal(response.status, 201)
      token = response.body.data.csrfToken
    })

    await step('3. the role is customer, not the one the body asked for', async () => {
      const stored = await User.findOne({ email: EMAIL })
      assert.equal(stored.role, 'customer')
      assert.equal(stored.status, 'active')
      assert.equal(stored.preferences.country, 'Nepal')
    })

    await step('4. /auth/me returns that user and no private field', async () => {
      const response = await first.get(api('/auth/me'))
      assert.equal(response.status, 200)
      assert.equal(response.body.data.user.email, EMAIL)
      const body = JSON.stringify(response.body)
      for (const field of ['passwordHash', 'sessionVersion', 'lockUntil', 'failedLoginAttempts']) {
        assert.ok(!body.includes(field), `${field} leaked`)
      }
    })

    await step('5. logout succeeds', async () => {
      const response = await first.post(api('/auth/logout')).set('X-CSRF-Token', token)
      assert.equal(response.status, 200)
    })

    await step('6. /auth/me is 401 afterwards', async () => {
      assert.equal((await first.get(api('/auth/me'))).status, 401)
    })

    await step('7. a fresh CSRF token can be obtained', async () => {
      const response = await first.get(api('/auth/csrf-token'))
      assert.equal(response.status, 200)
      token = response.body.data.csrfToken
    })

    await step('8. logging in works and rotates the CSRF token', async () => {
      const before = token
      const response = await first
        .post(api('/auth/login'))
        .set('X-CSRF-Token', token)
        .send({ email: EMAIL, password: PASSWORD })
      assert.equal(response.status, 200)
      token = response.body.data.csrfToken
      assert.notEqual(token, before)
    })

    await step('9. a second, independent session can be opened', async () => {
      const csrf = await second.get(api('/auth/csrf-token'))
      const response = await second
        .post(api('/auth/login'))
        .set('X-CSRF-Token', csrf.body.data.csrfToken)
        .send({ email: EMAIL, password: PASSWORD })
      assert.equal(response.status, 200)
      secondToken = response.body.data.csrfToken
      assert.equal((await second.get(api('/auth/me'))).status, 200)
    })

    await step('10. the password can be changed in the first session', async () => {
      const response = await first
        .post(api('/auth/change-password'))
        .set('X-CSRF-Token', token)
        .send({ currentPassword: PASSWORD, newPassword: NEW_PASSWORD })
      assert.equal(response.status, 200)
      token = response.body.data.csrfToken
    })

    await step('11. the second session is now invalid, the first still works', async () => {
      assert.equal((await second.get(api('/auth/me'))).status, 401)
      assert.equal((await first.get(api('/auth/me'))).status, 200)
    })

    await step('12. the new password works and the old one does not', async () => {
      const agent = request.agent(app)
      const csrf = await agent.get(api('/auth/csrf-token'))
      const good = await agent
        .post(api('/auth/login'))
        .set('X-CSRF-Token', csrf.body.data.csrfToken)
        .send({ email: EMAIL, password: NEW_PASSWORD })
      assert.equal(good.status, 200)

      const stale = request.agent(app)
      const staleCsrf = await stale.get(api('/auth/csrf-token'))
      const bad = await stale
        .post(api('/auth/login'))
        .set('X-CSRF-Token', staleCsrf.body.data.csrfToken)
        .send({ email: EMAIL, password: PASSWORD })
      assert.equal(bad.status, 401)
      assert.equal(bad.body.message, 'Invalid email or password.')
    })

    await step('13. logout-all succeeds', async () => {
      const response = await first.post(api('/auth/logout-all')).set('X-CSRF-Token', token)
      assert.equal(response.status, 200)
    })

    await step('14. every session is now invalid', async () => {
      assert.equal((await first.get(api('/auth/me'))).status, 401)
      assert.equal((await second.get(api('/auth/me'))).status, 401)
    })

    await step('15. a POST with no CSRF token is refused', async () => {
      const response = await request(app)
        .post(api('/auth/login'))
        .send({ email: EMAIL, password: NEW_PASSWORD })
      assert.equal(response.status, 403)
    })

    await step('16. the public catalogue is unaffected', async () => {
      const response = await request(app).get(api('/packages?limit=1'))
      assert.equal(response.status, 200)
      assert.equal(response.body.success, true)
    })
  } finally {
    // Only the accounts this script created, and only from the test database.
    await User.deleteMany({ email: /@authtest\.invalid$/ })
    await mongoose.connection.db.collection('sessions').deleteMany({})
    await app.locals.sessionStore?.close()
    await disconnectDatabase()
  }

  const failed = results.filter((result) => !result.ok)
  console.log(`\n${results.length - failed.length}/${results.length} checks passed.`)
  if (failed.length > 0) {
    console.log('\nFAIL')
    process.exit(1)
  }
  console.log('PASS')
}

main().catch((error) => {
  console.error('\nVerification could not run.\n')
  console.error(error.message)
  process.exit(1)
})
