// The public submission endpoint, over HTTP, against a real database.
//
// Runs against INQUIRY_TEST_DATABASE_NAME and refuses anything that is not a
// _test database. Without one configured the whole file skips, so `npm test`
// stays green on a machine with no .env.
import assert from 'node:assert/strict'
import test, { after, before, describe } from 'node:test'
import request from 'supertest'
import Inquiry from '../../src/modules/inquiries/inquiry.model.js'
import {
  apiPath, buildTestApp, cleanupInquiryFixtures, closeTestApps, connectTestDatabase,
  disconnectTestDatabase, newAgent, seedInquiryFixtures, submitInquiry, testConfig,
  testDatabaseSkipReason,
} from '../helpers/inquiryTestContext.js'

const skip = testDatabaseSkipReason()
const base = { fullName: 'Jiwoo Park', email: 'jiwoo@inquirytest.invalid', consent: true }

describe('public inquiry submission', { skip }, () => {
  let config
  let fx

  before(async () => {
    await connectTestDatabase()
    config = testConfig()
    fx = await seedInquiryFixtures()
  })

  after(async () => {
    await cleanupInquiryFixtures()
    await closeTestApps()
    await disconnectTestDatabase()
  })

  describe('CSRF', () => {
    // A fresh app per group. The public limiter counts in memory per app, so a
    // shared one lets an early group spend a later group's budget and produce
    // 429s that look like real failures.
    let app
    before(() => {
      app = buildTestApp()
    })

    test('a submission without a token is refused', async () => {
      // Anonymous does not mean unprotected: a forged submission is exactly
      // what somebody would use to flood the CRM.
      const response = await request(app)
        .post(apiPath(config, '/inquiries'))
        .send({ ...base, type: 'contact', message: 'hi' })
      assert.equal(response.status, 403)
    })

    test('a submission from a disallowed Origin is refused', async () => {
      const agent = newAgent(app)
      const csrf = await agent.get(apiPath(config, '/auth/csrf-token'))
      const response = await agent
        .post(apiPath(config, '/inquiries'))
        .set('X-CSRF-Token', csrf.body.data.csrfToken)
        .set('Origin', 'https://evil.example')
        .send({ ...base, type: 'contact', message: 'hi' })
      assert.equal(response.status, 403)
    })
  })

  describe('each supported type', () => {
    // A fresh app per group. The public limiter counts in memory per app, so a
    // shared one lets an early group spend a later group's budget and produce
    // 429s that look like real failures.
    let app
    before(() => {
      app = buildTestApp()
    })

    test('contact', async () => {
      const { response } = await submitInquiry(app, config, { ...base, type: 'contact', message: 'A question' })
      assert.equal(response.status, 201)
      assert.equal(response.body.data.status, 'new')
    })

    test('package_inquiry, with a departure', async () => {
      const { response } = await submitInquiry(app, config, {
        ...base, type: 'package_inquiry',
        packageId: String(fx.publishedPackage._id),
        fixedDepartureId: String(fx.departure._id),
        groupSize: 3, preferredDate: '2026-10-01',
      })
      assert.equal(response.status, 201)
    })

    test('custom_trip', async () => {
      const { response } = await submitInquiry(app, config, {
        ...base, type: 'custom_trip', message: 'Two weeks trekking in October',
      })
      assert.equal(response.status, 201)
    })

    test('callback', async () => {
      const { response } = await submitInquiry(app, config, {
        type: 'callback', fullName: 'Jiwoo Park', email: '', phone: '+977 980 111 2222', consent: true,
      })
      assert.equal(response.status, 201)
    })

    test('guide_request', async () => {
      const { response } = await submitInquiry(app, config, {
        ...base, type: 'guide_request', guideId: String(fx.publicGuide._id),
      })
      assert.equal(response.status, 201)
    })

    test('emergency, with an honest message and no promise', async () => {
      const { response } = await submitInquiry(app, config, {
        ...base, type: 'emergency', phone: '+977 980 111 2222', message: 'Stuck at Lukla',
      })
      assert.equal(response.status, 201)
      assert.match(response.body.message, /does not guarantee immediate emergency assistance/)
      // No response time is promised anywhere.
      assert.ok(!/within \d+ hours?/i.test(response.body.message))
    })

    test('every submission starts at new, on the website, at normal priority', async () => {
      const { response } = await submitInquiry(app, config, {
        ...base, type: 'contact', message: 'server-controlled fields',
      })
      const stored = await Inquiry.findOne({ referenceCode: response.body.data.referenceCode })
      assert.equal(stored.status, 'new')
      assert.equal(stored.source, 'website')
      assert.equal(stored.priority, 'normal')
      assert.equal(stored.assignedToUserId, null)
      assert.equal(stored.convertedBookingId, null)
    })

    test('an emergency starts urgent because of its type, not who sent it', async () => {
      const { response } = await submitInquiry(app, config, {
        ...base, type: 'emergency', phone: '+977 980 111 2222', message: 'Urgent priority check',
      })
      const stored = await Inquiry.findOne({ referenceCode: response.body.data.referenceCode })
      assert.equal(stored.priority, 'urgent')
    })
  })

  describe('the public response', () => {
    // A fresh app per group. The public limiter counts in memory per app, so a
    // shared one lets an early group spend a later group's budget and produce
    // 429s that look like real failures.
    let app
    before(() => {
      app = buildTestApp()
    })

    test('carries exactly three fields and no MongoDB id', async () => {
      const { response } = await submitInquiry(app, config, { ...base, type: 'contact', message: 'minimal output' })
      assert.deepEqual(Object.keys(response.body.data).sort(), ['referenceCode', 'status', 'submittedAt'])
      assert.equal(response.body.data.id, undefined)
    })

    test('leaks nothing internal', async () => {
      const { response } = await submitInquiry(app, config, { ...base, type: 'contact', message: 'no leaks' })
      const body = JSON.stringify(response.body)
      for (const field of ['_id', '__v', 'internalNotes', 'statusHistory', 'spamSignals', 'idempotencyKeyHash', 'submissionMetadata', 'assignedTo', 'priority', 'userId']) {
        assert.ok(!body.includes(field), field)
      }
    })

    test('the reference code is random, not sequential', async () => {
      const codes = []
      for (let index = 0; index < 3; index += 1) {
        const { response } = await submitInquiry(app, config, { ...base, type: 'contact', message: `random ${index}` })
        codes.push(response.body.data.referenceCode)
      }
      for (const code of codes) assert.match(code, /^CFN-\d{4}-[23456789ACDEFGHJKLMNPQRTUVWXYZ]{6}$/)
      assert.equal(new Set(codes).size, 3)
    })

    test('the envelope keeps its four keys and a requestId', async () => {
      const { response } = await submitInquiry(app, config, { ...base, type: 'contact', message: 'envelope' })
      assert.deepEqual(Object.keys(response.body).sort(), ['data', 'message', 'meta', 'success'])
      assert.ok(response.body.meta.requestId)
    })
  })

  describe('catalogue references', () => {
    // A fresh app per group. The public limiter counts in memory per app, so a
    // shared one lets an early group spend a later group's budget and produce
    // 429s that look like real failures.
    let app
    before(() => {
      app = buildTestApp()
    })

    test('a draft package cannot receive an inquiry', async () => {
      const { response } = await submitInquiry(app, config, {
        ...base, type: 'package_inquiry', packageId: String(fx.draftPackage._id),
      })
      assert.equal(response.status, 400)
    })

    test('a private guide cannot receive a request', async () => {
      const { response } = await submitInquiry(app, config, {
        ...base, type: 'guide_request', guideId: String(fx.privateGuide._id),
      })
      assert.equal(response.status, 400)
    })

    test('the refusal does not reveal that the record exists', async () => {
      // Otherwise the endpoint becomes a way to enumerate unreleased trips.
      const draft = await submitInquiry(app, config, {
        ...base, type: 'package_inquiry', packageId: String(fx.draftPackage._id),
      })
      const missing = await submitInquiry(app, config, {
        ...base, type: 'package_inquiry', packageId: '507f1f77bcf86cd799439099',
      })
      assert.equal(draft.response.body.message, missing.response.body.message)
    })

    test('a departure belonging to another trip is refused', async () => {
      const { response } = await submitInquiry(app, config, {
        ...base, type: 'package_inquiry',
        packageId: String(fx.publishedPackage._id),
        fixedDepartureId: String(fx.otherDeparture._id),
      })
      assert.equal(response.status, 400)
    })

    test('a resolved package is snapshotted from the database, not the body', async () => {
      const { response } = await submitInquiry(app, config, {
        ...base, type: 'package_inquiry', packageId: String(fx.publishedPackage._id),
      })
      const stored = await Inquiry.findOne({ referenceCode: response.body.data.referenceCode })
      assert.equal(stored.snapshot.packageTitle, fx.publishedPackage.title)
      assert.equal(String(stored.trip.packageId), String(fx.publishedPackage._id))
    })

    test('seats are never reserved and bookedSeats never changes', async () => {
      const before = await fx.departure.constructor.findById(fx.departure._id)
      await submitInquiry(app, config, {
        ...base, type: 'package_inquiry',
        packageId: String(fx.publishedPackage._id), fixedDepartureId: String(fx.departure._id),
      })
      const after = await fx.departure.constructor.findById(fx.departure._id)
      assert.equal(after.bookedSeats, before.bookedSeats)
    })
  })

  describe('privileged fields', () => {
    // A fresh app per group. The public limiter counts in memory per app, so a
    // shared one lets an early group spend a later group's budget and produce
    // 429s that look like real failures.
    let app
    before(() => {
      app = buildTestApp()
    })

    for (const [field, value] of [['status', 'contacted'], ['priority', 'urgent'], ['assignedToUserId', '507f1f77bcf86cd799439011'], ['source', 'admin'], ['userId', '507f1f77bcf86cd799439011'], ['referenceCode', 'CFN-2026-AAAAAA']]) {
      test(`a body carrying "${field}" is refused`, async () => {
        const { response } = await submitInquiry(app, config, {
          ...base, type: 'contact', message: 'hi', [field]: value,
        })
        assert.equal(response.status, 400)
        assert.ok(response.body.meta.errors[field])
      })
    }
  })

  describe('consent', () => {
    // A fresh app per group. The public limiter counts in memory per app, so a
    // shared one lets an early group spend a later group's budget and produce
    // 429s that look like real failures.
    let app
    before(() => {
      app = buildTestApp()
    })

    test('a submission without consent is refused', async () => {
      const { response } = await submitInquiry(app, config, {
        fullName: 'Jiwoo Park', email: 'jiwoo@inquirytest.invalid', type: 'contact', message: 'no consent',
      })
      assert.equal(response.status, 400)
      assert.ok(response.body.meta.errors.consent)
    })

    test('the consent time and policy version come from the server', async () => {
      const before = Date.now()
      const { response } = await submitInquiry(app, config, { ...base, type: 'contact', message: 'consent record' })
      const stored = await Inquiry.findOne({ referenceCode: response.body.data.referenceCode })

      assert.equal(stored.consent.accepted, true)
      assert.equal(stored.consent.privacyPolicyVersion, config.privacyPolicyVersion)
      assert.ok(stored.consent.acceptedAt.getTime() >= before)
    })
  })

  describe('the honeypot', () => {
    // A fresh app per group. The public limiter counts in memory per app, so a
    // shared one lets an early group spend a later group's budget and produce
    // 429s that look like real failures.
    let app
    before(() => {
      app = buildTestApp()
    })

    test('a filled honeypot stores nothing at all', async () => {
      // Not even a flagged record: keeping spam would mean keeping the personal
      // details inside it.
      const marker = `honeypot-${Date.now()}`
      const { response } = await submitInquiry(app, config, {
        ...base, type: 'contact', message: marker, 'company-website': 'spam.example',
      })
      assert.equal(response.status, 201)
      assert.equal(await Inquiry.countDocuments({ message: marker }), 0)
    })

    test('the response does not reveal that spam was detected', async () => {
      const real = await submitInquiry(app, config, { ...base, type: 'contact', message: 'a real one' })
      const spam = await submitInquiry(app, config, {
        ...base, type: 'contact', message: 'spam', 'company-website': 'spam.example',
      })
      assert.equal(spam.response.status, real.response.status)
      assert.equal(spam.response.body.message, real.response.body.message)
    })
  })

  describe('idempotency', () => {
    // A fresh app per group. The public limiter counts in memory per app, so a
    // shared one lets an early group spend a later group's budget and produce
    // 429s that look like real failures.
    let app
    before(() => {
      app = buildTestApp()
    })

    test('the same key twice creates one inquiry', async () => {
      const key = `idem-${process.pid}-${Date.now()}`
      const marker = `idem ${key}`
      const first = await submitInquiry(app, config, { ...base, type: 'contact', message: marker }, { headers: { 'Idempotency-Key': key } })
      const second = await submitInquiry(app, config, { ...base, type: 'contact', message: marker }, { headers: { 'Idempotency-Key': key } })

      assert.equal(first.response.status, 201)
      assert.equal(second.response.status, 201)
      assert.equal(second.response.body.data.referenceCode, first.response.body.data.referenceCode)
      assert.equal(await Inquiry.countDocuments({ message: marker }), 1)
    })

    test('a raw key is never stored — only a hash', async () => {
      const key = `raw-key-${process.pid}-${Date.now()}`
      const { response } = await submitInquiry(app, config, { ...base, type: 'contact', message: 'hashed key' }, { headers: { 'Idempotency-Key': key } })
      const stored = await Inquiry.findOne({ referenceCode: response.body.data.referenceCode }).select('+idempotencyKeyHash')

      assert.notEqual(stored.idempotencyKeyHash, key)
      assert.match(stored.idempotencyKeyHash, /^[0-9a-f]{64}$/)
    })

    test('a too-short key is refused', async () => {
      const { response } = await submitInquiry(app, config, { ...base, type: 'contact', message: 'short key' }, { headers: { 'Idempotency-Key': 'abc' } })
      assert.equal(response.status, 400)
    })

    test('different keys create different inquiries', async () => {
      const marker = `distinct-${Date.now()}`
      await submitInquiry(app, config, { ...base, type: 'contact', message: marker }, { headers: { 'Idempotency-Key': `a-${marker}` } })
      await submitInquiry(app, config, { ...base, type: 'contact', message: marker }, { headers: { 'Idempotency-Key': `b-${marker}` } })
      assert.equal(await Inquiry.countDocuments({ message: marker }), 2)
    })
  })

  describe('privacy at rest', () => {
    // A fresh app per group. The public limiter counts in memory per app, so a
    // shared one lets an early group spend a later group's budget and produce
    // 429s that look like real failures.
    let app
    before(() => {
      app = buildTestApp()
    })

    test('no IP address, session id, or CSRF token is stored', async () => {
      const { response } = await submitInquiry(app, config, { ...base, type: 'contact', message: 'privacy at rest' })
      const stored = await Inquiry.findOne({ referenceCode: response.body.data.referenceCode })
        .select('+submissionMetadata +spamSignals +idempotencyKeyHash')
        .lean()

      const keys = Object.keys(stored.submissionMetadata || {})
      assert.deepEqual(keys.sort(), ['acceptLanguage', 'submittedAt'])
      const body = JSON.stringify(stored)
      for (const field of ['ipAddress', 'remoteAddress', 'sessionId', 'csrfToken', 'cookie', 'userAgent']) {
        assert.ok(!body.includes(field), field)
      }
    })
  })
})
