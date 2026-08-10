// The public submission rate limit.
//
// Separate from the login limiter on purpose: ten failed sign-ins in fifteen
// minutes is an attack, ten inquiries is a family planning a trek together
// from one hotel's wifi.
//
// Triggering the limit costs a real round trip per submission, so the three
// assertions about the refusal share one flood rather than repeating it.
import assert from 'node:assert/strict'
import test, { after, before, describe } from 'node:test'
import request from 'supertest'
import {
  apiPath, buildTestApp, cleanupInquiryFixtures, closeTestApps, connectTestDatabase,
  disconnectTestDatabase, seedInquiryFixtures, signIn, submitInquiry, testConfig,
  testDatabaseSkipReason,
} from '../helpers/inquiryTestContext.js'

const skip = testDatabaseSkipReason()
const base = { fullName: 'Jiwoo Park', email: 'jiwoo@inquirytest.invalid', consent: true }

describe('public inquiry rate limiting', { skip }, () => {
  let config
  let fx
  let limited

  before(async () => {
    await connectTestDatabase()
    config = testConfig()
    fx = await seedInquiryFixtures()

    // One flood, on a fresh app so the counter starts empty.
    const app = buildTestApp()
    for (let attempt = 0; attempt <= config.inquiry.publicMaxSubmissions; attempt += 1) {
      const { response } = await submitInquiry(app, config, {
        ...base, type: 'contact', message: `flood ${attempt}`,
      })
      if (response.status === 429) {
        limited = response
        break
      }
    }
  })

  after(async () => {
    await cleanupInquiryFixtures()
    await closeTestApps()
    await disconnectTestDatabase()
  })

  test('submissions beyond the budget are refused with 429', () => {
    assert.ok(limited, 'the endpoint should have rate limited')
    assert.equal(limited.status, 429)
  })

  test('the refusal uses the standard envelope with a requestId', () => {
    assert.deepEqual(Object.keys(limited.body).sort(), ['data', 'message', 'meta', 'success'])
    assert.equal(limited.body.success, false)
    assert.equal(limited.body.data, null)
    assert.ok(limited.body.meta.requestId)
  })

  test('the message is generic and exposes no internal counter', () => {
    // No remaining count, no window length, no address.
    assert.ok(!/\d/.test(limited.body.message), limited.body.message)
  })

  test('the limit does not apply to staff CRM reads', async () => {
    // An admin working through the queue makes far more requests than
    // any visitor. Limiting them would break the tool while stopping nothing.
    const app = buildTestApp()
    const staff = await signIn(app, config, fx.users.admin.email)

    for (let attempt = 0; attempt < config.inquiry.publicMaxSubmissions + 3; attempt += 1) {
      const response = await staff.agent.get(apiPath(config, '/inquiries?limit=1'))
      assert.equal(response.status, 200, `request ${attempt + 1}`)
    }
  })

  test('the limit does not apply to the public catalogue', async () => {
    const app = buildTestApp()
    for (let attempt = 0; attempt < config.inquiry.publicMaxSubmissions + 3; attempt += 1) {
      const response = await request(app).get(apiPath(config, '/packages?limit=1'))
      assert.equal(response.status, 200)
    }
  })
})
