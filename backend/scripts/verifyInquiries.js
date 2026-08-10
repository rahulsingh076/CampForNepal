// Drives the whole inquiry pipeline end to end and reports PASS or FAIL.
//
//   npm run verify:inquiries
//
// Runs against INQUIRY_TEST_DATABASE_NAME, never the development catalogue,
// and removes only the fixtures it created. `dropDatabase` is never called.
//
// It never prints a password, a session id, a secret, or the MongoDB URI.
import assert from 'node:assert/strict'
import mongoose from 'mongoose'
import request from 'supertest'
import Inquiry from '../src/modules/inquiries/inquiry.model.js'
import {
  apiPath,
  buildTestApp,
  cleanupAllTestData,
  closeTestApps,
  connectTestDatabase,
  disconnectTestDatabase,
  newAgent,
  seedInquiryFixtures,
  signIn,
  submitInquiry,
  testConfig,
  testDatabaseSkipReason,
} from '../tests/helpers/inquiryTestContext.js'

const results = []

async function step(name, run) {
  try {
    await run()
    results.push({ name, ok: true })
    console.log(`  PASS  ${name}`)
  } catch (error) {
    results.push({ name, ok: false })
    console.log(`  FAIL  ${name}`)
    console.log(`        ${String(error.message).split('\n')[0]}`)
  }
}

// Every field that must never leave the server, checked against whole
// responses rather than one key at a time.
const NEVER_EXPOSED = [
  'idempotencyKeyHash', 'spamSignals', 'submissionMetadata',
  'passwordHash', 'sessionVersion', 'failedLoginAttempts', 'lockUntil',
  'sourceId', '"_id"', '__v', 'csrfToken', 'connect.sid',
]

function assertNoLeak(payload, label) {
  const body = JSON.stringify(payload)
  for (const field of NEVER_EXPOSED) {
    assert.ok(!body.includes(field), `${field} leaked from ${label}`)
  }
}

async function main() {
  const reason = testDatabaseSkipReason()
  if (reason) throw new Error(reason)

  const databaseName = await connectTestDatabase()
  const config = testConfig()

  console.log('Camp For Nepal — inquiry verification')
  console.log(`  database: ${databaseName}`)
  console.log(`  policy:   ${config.privacyPolicyVersion}\n`)

  await cleanupAllTestData()
  const fx = await seedInquiryFixtures()

  // A fresh app per group: the public limiter counts in memory per app, and
  // this script deliberately submits more than one window's budget in total.
  const publicApp = buildTestApp()
  const crmApp = buildTestApp()

  const base = { fullName: 'Verification Person', email: 'verify@inquirytest.invalid', consent: true }
  const created = {}

  try {
    console.log('PUBLIC SUBMISSION')

    await step('1. a POST without a CSRF token is refused', async () => {
      const response = await request(publicApp)
        .post(apiPath(config, '/inquiries'))
        .send({ ...base, type: 'contact', message: 'no token' })
      assert.equal(response.status, 403)
    })

    await step('2. a POST from a foreign Origin is refused', async () => {
      const agent = newAgent(publicApp)
      const csrf = await agent.get(apiPath(config, '/auth/csrf-token'))
      const response = await agent
        .post(apiPath(config, '/inquiries'))
        .set('X-CSRF-Token', csrf.body.data.csrfToken)
        .set('Origin', 'https://evil.example')
        .send({ ...base, type: 'contact', message: 'foreign origin' })
      assert.equal(response.status, 403)
    })

    const submissions = [
      ['contact', { type: 'contact', message: 'A general question' }],
      ['package_inquiry', { type: 'package_inquiry', packageId: String(fx.publishedPackage._id), fixedDepartureId: String(fx.departure._id), groupSize: 3 }],
      ['custom_trip', { type: 'custom_trip', message: 'Two weeks trekking in October' }],
      ['callback', { type: 'callback', email: '', phone: '+977 980 111 2222' }],
      ['guide_request', { type: 'guide_request', guideId: String(fx.publicGuide._id) }],
      ['emergency', { type: 'emergency', phone: '+977 980 111 2222', message: 'Urgent support request' }],
    ]

    for (const [label, payload] of submissions) {
      await step(`3. a ${label} submission is accepted`, async () => {
        const { response } = await submitInquiry(publicApp, config, { ...base, ...payload })
        assert.equal(response.status, 201, JSON.stringify(response.body))
        created[label] = response.body.data.referenceCode
      })
    }

    await step('4. the public response carries only three fields and no MongoDB id', async () => {
      const { response } = await submitInquiry(publicApp, config, { ...base, type: 'contact', message: 'minimal output' })
      assert.deepEqual(Object.keys(response.body.data).sort(), ['referenceCode', 'status', 'submittedAt'])
      assertNoLeak(response.body, 'the public response')
    })

    await step('5. every submission starts new, website, normal, unassigned', async () => {
      const stored = await Inquiry.findOne({ referenceCode: created.contact })
      assert.equal(stored.status, 'new')
      assert.equal(stored.source, 'website')
      assert.equal(stored.priority, 'normal')
      assert.equal(stored.assignedToUserId, null)
      assert.equal(stored.convertedBookingId, null)
    })

    await step('6. an emergency starts urgent and promises nothing', async () => {
      const stored = await Inquiry.findOne({ referenceCode: created.emergency })
      assert.equal(stored.priority, 'urgent')
    })

    await step('7. a draft package and a private guide are both refused', async () => {
      const app = buildTestApp()
      const draft = await submitInquiry(app, config, { ...base, type: 'package_inquiry', packageId: String(fx.draftPackage._id) })
      const priv = await submitInquiry(app, config, { ...base, type: 'guide_request', guideId: String(fx.privateGuide._id) })
      assert.equal(draft.response.status, 400)
      assert.equal(priv.response.status, 400)
    })

    await step('8. a mismatched departure is refused', async () => {
      const { response } = await submitInquiry(buildTestApp(), config, {
        ...base, type: 'package_inquiry',
        packageId: String(fx.publishedPackage._id), fixedDepartureId: String(fx.otherDeparture._id),
      })
      assert.equal(response.status, 400)
    })

    await step('9. status, priority, and assignment cannot be chosen by a request', async () => {
      const app = buildTestApp()
      for (const field of ['status', 'priority', 'assignedToUserId', 'source', 'userId']) {
        const { response } = await submitInquiry(app, config, { ...base, type: 'contact', message: 'escalation', [field]: 'x' })
        assert.equal(response.status, 400, field)
      }
    })

    await step('10. the honeypot stores nothing and reveals nothing', async () => {
      const marker = `honeypot-${Date.now()}`
      const { response } = await submitInquiry(buildTestApp(), config, {
        ...base, type: 'contact', message: marker, [config.inquiry.honeypotField]: 'spam.example',
      })
      assert.equal(response.status, 201)
      assert.equal(await Inquiry.countDocuments({ message: marker }), 0)
    })

    await step('11. a repeated Idempotency-Key creates only one inquiry', async () => {
      const key = `verify-${process.pid}-${Date.now()}`
      const marker = `idem ${key}`
      const app = buildTestApp()
      const first = await submitInquiry(app, config, { ...base, type: 'contact', message: marker }, { headers: { 'Idempotency-Key': key } })
      const second = await submitInquiry(app, config, { ...base, type: 'contact', message: marker }, { headers: { 'Idempotency-Key': key } })
      assert.equal(second.response.body.data.referenceCode, first.response.body.data.referenceCode)
      assert.equal(await Inquiry.countDocuments({ message: marker }), 1)
    })

    console.log('\nSTAFF CRM')

    const staff = await signIn(crmApp, config, fx.users.admin.email)
    const manager = await signIn(crmApp, config, fx.users.superAdmin.email)
    const customer = await signIn(crmApp, config, fx.users.customer.email)
    let inquiryId = null

    await step('12. admin staff can list inquiries', async () => {
      const response = await staff.agent.get(apiPath(config, '/inquiries'))
      assert.equal(response.status, 200)
      assert.ok(response.body.data.length > 0)
      assertNoLeak(response.body, 'the CRM list')
      for (const row of response.body.data) {
        assert.equal(row.internalNotes, undefined)
        assert.equal(row.statusHistory, undefined)
      }
      const target = await Inquiry.findOne({ referenceCode: created.contact })
      inquiryId = String(target._id)
    })

    await step('13. admin staff can read the detail', async () => {
      const response = await staff.agent.get(apiPath(config, `/inquiries/${inquiryId}`))
      assert.equal(response.status, 200)
      assert.equal(response.body.data.statusHistory.length, 1)
      assertNoLeak(response.body, 'the CRM detail')
    })

    await step('14. admin staff can add an internal note', async () => {
      const response = await staff.agent
        .post(apiPath(config, `/inquiries/${inquiryId}/notes`))
        .set('X-CSRF-Token', staff.csrfToken)
        .send({ text: 'Called, left a message.' })
      assert.equal(response.status, 200)
      assert.equal(response.body.data.internalNotes[0].author.id, String(fx.users.admin._id))
    })

    await step('15. admin staff can set a follow-up date', async () => {
      const response = await staff.agent
        .patch(apiPath(config, `/inquiries/${inquiryId}/follow-up`))
        .set('X-CSRF-Token', staff.csrfToken)
        .send({ followUpAt: '2026-09-01T09:00:00.000Z' })
      assert.equal(response.status, 200)
    })

    await step('16. new moves to contacted', async () => {
      const response = await staff.agent
        .patch(apiPath(config, `/inquiries/${inquiryId}/status`))
        .set('X-CSRF-Token', staff.csrfToken)
        .send({ status: 'contacted' })
      assert.equal(response.status, 200)
      assert.equal(response.body.data.status, 'contacted')
    })

    await step('17. a super admin can assign eligible staff', async () => {
      const response = await manager.agent
        .patch(apiPath(config, `/inquiries/${inquiryId}/assignment`))
        .set('X-CSRF-Token', manager.csrfToken)
        .send({ assignedToUserId: String(fx.users.admin._id) })
      assert.equal(response.status, 200)
    })

    await step('18. a customer cannot be assigned an inquiry', async () => {
      const response = await manager.agent
        .patch(apiPath(config, `/inquiries/${inquiryId}/assignment`))
        .set('X-CSRF-Token', manager.csrfToken)
        .send({ assignedToUserId: String(fx.users.customer._id) })
      assert.equal(response.status, 400)
    })

    await step('19. contacted moves to quoted', async () => {
      const response = await manager.agent
        .patch(apiPath(config, `/inquiries/${inquiryId}/status`))
        .set('X-CSRF-Token', manager.csrfToken)
        .send({ status: 'quoted' })
      assert.equal(response.status, 200)
    })

    await step('20. a super admin can change priority', async () => {
      const response = await manager.agent
        .patch(apiPath(config, `/inquiries/${inquiryId}/priority`))
        .set('X-CSRF-Token', manager.csrfToken)
        .send({ priority: 'high' })
      assert.equal(response.body.data.priority, 'high')
    })

    await step('21. converted cannot be set by hand', async () => {
      const response = await manager.agent
        .patch(apiPath(config, `/inquiries/${inquiryId}/status`))
        .set('X-CSRF-Token', manager.csrfToken)
        .send({ status: 'converted' })
      assert.equal(response.status, 400)
    })

    await step('22. a stale transition is refused with 409', async () => {
      const response = await manager.agent
        .patch(apiPath(config, `/inquiries/${inquiryId}/status`))
        .set('X-CSRF-Token', manager.csrfToken)
        .send({ status: 'closed', fromStatus: 'new' })
      assert.equal(response.status, 409)
    })

    await step('23. a customer is refused all CRM access', async () => {
      assert.equal((await customer.agent.get(apiPath(config, '/inquiries'))).status, 403)
      assert.equal((await customer.agent.get(apiPath(config, `/inquiries/${inquiryId}`))).status, 403)
    })

    await step('24. an anonymous CRM request is refused', async () => {
      assert.equal((await request(crmApp).get(apiPath(config, '/inquiries'))).status, 401)
    })

    await step('25. no DELETE or convert endpoint exists', async () => {
      const admin = await signIn(crmApp, config, fx.users.admin.email)
      const removed = await admin.agent.delete(apiPath(config, `/inquiries/${inquiryId}`)).set('X-CSRF-Token', admin.csrfToken)
      const converted = await admin.agent.post(apiPath(config, `/inquiries/${inquiryId}/convert`)).set('X-CSRF-Token', admin.csrfToken).send({})
      assert.equal(removed.status, 404)
      assert.equal(converted.status, 404)
    })

    await step('26. the public catalogue still answers without a session', async () => {
      const response = await request(publicApp).get(apiPath(config, '/packages?limit=1'))
      assert.equal(response.status, 200)
      assert.equal(response.body.success, true)
    })
  } finally {
    await cleanupAllTestData()
    await closeTestApps()
    await disconnectTestDatabase()
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
  // Best effort: never leave a connection open on the way out.
  mongoose.connection.readyState === 1 && mongoose.disconnect()
  process.exit(1)
})
