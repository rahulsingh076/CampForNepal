// The staff CRM: list, detail, notes, follow-up, priority, assignment.
import assert from 'node:assert/strict'
import test, { after, before, describe } from 'node:test'
import Inquiry from '../../src/modules/inquiries/inquiry.model.js'
import {
  apiPath, buildTestApp, cleanupInquiryFixtures, closeTestApps, connectTestDatabase,
  disconnectTestDatabase, seedInquiryFixtures, signIn, submitInquiry, testConfig,
  testDatabaseSkipReason,
} from '../helpers/inquiryTestContext.js'

const skip = testDatabaseSkipReason()
const base = { fullName: 'Jiwoo Park', email: 'jiwoo@inquirytest.invalid', consent: true }

describe('inquiry CRM', { skip }, () => {
  let config
  let app
  let fx
  let staff
  let manager

  async function newInquiry(patch = {}) {
    const { response } = await submitInquiry(buildTestApp(), config, {
      ...base, type: 'contact', message: `crm ${Math.random()}`, ...patch,
    })
    return Inquiry.findOne({ referenceCode: response.body.data.referenceCode })
  }

  before(async () => {
    await connectTestDatabase()
    config = testConfig()
    app = buildTestApp()
    fx = await seedInquiryFixtures()
    staff = await signIn(app, config, fx.users.admin.email)
    manager = await signIn(app, config, fx.users.superAdmin.email)
  })

  after(async () => {
    await cleanupInquiryFixtures()
    await closeTestApps()
    await disconnectTestDatabase()
  })

  describe('list', () => {
    test('returns pagination metadata', async () => {
      await newInquiry()
      const response = await staff.agent.get(apiPath(config, '/inquiries?limit=2'))
      assert.equal(response.status, 200)
      assert.equal(typeof response.body.meta.total, 'number')
      assert.equal(response.body.meta.limit, 2)
      assert.ok(response.body.data.length <= 2)
    })

    test('filters by type, status, and priority', async () => {
      await newInquiry({ type: 'emergency', phone: '+977 980 111 2222', message: 'filter fixture' })
      const byType = await staff.agent.get(apiPath(config, '/inquiries?type=emergency'))
      assert.ok(byType.body.data.every((row) => row.type === 'emergency'))

      const byStatus = await staff.agent.get(apiPath(config, '/inquiries?status=new'))
      assert.ok(byStatus.body.data.every((row) => row.status === 'new'))

      const byPriority = await staff.agent.get(apiPath(config, '/inquiries?priority=urgent'))
      assert.ok(byPriority.body.data.every((row) => row.priority === 'urgent'))
    })

    test('filters unassigned and assigned', async () => {
      const inquiry = await newInquiry()
      const unassigned = await staff.agent.get(apiPath(config, '/inquiries?unassigned=true'))
      assert.ok(unassigned.body.data.every((row) => row.assignedTo === null))

      await manager.agent
        .patch(apiPath(config, `/inquiries/${inquiry._id}/assignment`))
        .set('X-CSRF-Token', manager.csrfToken)
        .send({ assignedToUserId: String(fx.users.admin._id) })

      const assigned = await staff.agent.get(apiPath(config, `/inquiries?assignedToUserId=${fx.users.admin._id}`))
      assert.ok(assigned.body.data.length >= 1)
      assert.ok(assigned.body.data.every((row) => row.assignedTo?.id === String(fx.users.admin._id)))
    })

    test('filters by country and a created-date range', async () => {
      await newInquiry({ country: 'Bhutan' })
      const byCountry = await staff.agent.get(apiPath(config, '/inquiries?country=Bhutan'))
      assert.ok(byCountry.body.data.length >= 1)

      const future = await staff.agent.get(apiPath(config, '/inquiries?createdFrom=2099-01-01'))
      assert.equal(future.body.data.length, 0)
    })

    test('searches the reference code and contact fields', async () => {
      const inquiry = await newInquiry()
      const byReference = await staff.agent.get(apiPath(config, `/inquiries?search=${inquiry.referenceCode}`))
      assert.equal(byReference.body.data.length, 1)
      assert.equal(byReference.body.data[0].referenceCode, inquiry.referenceCode)

      const byName = await staff.agent.get(apiPath(config, '/inquiries?search=Jiwoo'))
      assert.ok(byName.body.data.length >= 1)
    })

    test('a regex in the search term is escaped, not executed', async () => {
      // Unescaped, `.*` would match everything and a nested quantifier could
      // hang the process.
      const response = await staff.agent.get(apiPath(config, '/inquiries?search=.*'))
      assert.equal(response.status, 200)
      assert.equal(response.body.data.length, 0)

      const evil = await staff.agent.get(apiPath(config, '/inquiries?search=(a%2B)%2B%24'))
      assert.equal(evil.status, 200)
    })

    test('accepts allowed sorts and rejects anything else', async () => {
      for (const sort of ['createdAt', '-createdAt', 'updatedAt', '-updatedAt', 'followUpAt', '-followUpAt', 'referenceCode', '-referenceCode']) {
        const response = await staff.agent.get(apiPath(config, `/inquiries?sort=${sort}`))
        assert.equal(response.status, 200, sort)
      }
      const rejected = await staff.agent.get(apiPath(config, '/inquiries?sort=priority'))
      assert.equal(rejected.status, 400)
    })

    test('an unknown filter value is rejected rather than ignored', async () => {
      assert.equal((await staff.agent.get(apiPath(config, '/inquiries?status=archived'))).status, 400)
      assert.equal((await staff.agent.get(apiPath(config, '/inquiries?type=complaint'))).status, 400)
    })

    test('a list row carries no notes, history, or internal field', async () => {
      const inquiry = await newInquiry()
      await staff.agent
        .post(apiPath(config, `/inquiries/${inquiry._id}/notes`))
        .set('X-CSRF-Token', staff.csrfToken)
        .send({ text: 'a private note that must not appear in a list' })

      const response = await staff.agent.get(apiPath(config, '/inquiries'))
      const body = JSON.stringify(response.body)
      for (const field of ['internalNotes', 'statusHistory', 'idempotencyKeyHash', 'spamSignals', 'submissionMetadata', '"_id"', '__v', 'a private note']) {
        assert.ok(!body.includes(field), field)
      }
    })
  })

  describe('detail', () => {
    test('returns the full record for authorised staff', async () => {
      const inquiry = await newInquiry()
      const response = await staff.agent.get(apiPath(config, `/inquiries/${inquiry._id}`))
      assert.equal(response.status, 200)
      assert.equal(response.body.data.referenceCode, inquiry.referenceCode)
      assert.equal(response.body.data.statusHistory.length, 1)
      assert.equal(response.body.data.statusHistory[0].toStatus, 'new')
    })

    test('a malformed id is a 404, not a 500', async () => {
      const response = await staff.agent.get(apiPath(config, '/inquiries/not-an-id'))
      assert.equal(response.status, 404)
    })

    test('a missing inquiry is a 404', async () => {
      const response = await staff.agent.get(apiPath(config, '/inquiries/507f1f77bcf86cd799439099'))
      assert.equal(response.status, 404)
    })

    test('leaks no internal or security field', async () => {
      const inquiry = await newInquiry()
      const response = await staff.agent.get(apiPath(config, `/inquiries/${inquiry._id}`))
      const body = JSON.stringify(response.body)
      for (const field of ['idempotencyKeyHash', 'spamSignals', 'submissionMetadata', 'passwordHash', 'sessionVersion', 'failedLoginAttempts', 'lockUntil', 'sourceId', '"_id"', '__v']) {
        assert.ok(!body.includes(field), field)
      }
    })
  })

  describe('notes', () => {
    test('an authorised note is stored with the session author and server time', async () => {
      const inquiry = await newInquiry()
      const before = Date.now()
      const response = await staff.agent
        .post(apiPath(config, `/inquiries/${inquiry._id}/notes`))
        .set('X-CSRF-Token', staff.csrfToken)
        .send({ text: 'Called, no answer.' })

      assert.equal(response.status, 200)
      const note = response.body.data.internalNotes[0]
      assert.equal(note.text, 'Called, no answer.')
      assert.equal(note.author.fullName, fx.users.admin.fullName)
      assert.ok(new Date(note.createdAt).getTime() >= before)
    })

    test('an author supplied in the body is ignored — the session decides', async () => {
      const inquiry = await newInquiry()
      const response = await staff.agent
        .post(apiPath(config, `/inquiries/${inquiry._id}/notes`))
        .set('X-CSRF-Token', staff.csrfToken)
        .send({ text: 'Impersonation attempt', authorUserId: String(fx.users.admin._id), createdAt: '1999-01-01' })

      assert.equal(response.status, 200)
      const note = response.body.data.internalNotes[0]
      assert.equal(note.author.id, String(fx.users.admin._id))
      assert.ok(new Date(note.createdAt).getFullYear() > 2020)
    })

    test('notes append and never replace', async () => {
      const inquiry = await newInquiry()
      for (const text of ['first', 'second', 'third']) {
        await staff.agent
          .post(apiPath(config, `/inquiries/${inquiry._id}/notes`))
          .set('X-CSRF-Token', staff.csrfToken)
          .send({ text })
      }
      const response = await staff.agent.get(apiPath(config, `/inquiries/${inquiry._id}`))
      assert.deepEqual(response.body.data.internalNotes.map((note) => note.text), ['first', 'second', 'third'])
    })

    test('an empty or over-long note is refused', async () => {
      const inquiry = await newInquiry()
      const send = (text) =>
        staff.agent
          .post(apiPath(config, `/inquiries/${inquiry._id}/notes`))
          .set('X-CSRF-Token', staff.csrfToken)
          .send({ text })

      assert.equal((await send('   ')).status, 400)
      assert.equal((await send('x'.repeat(config.inquiry.maxNoteLength + 1))).status, 400)
      assert.equal((await send(123)).status, 400)
    })

    test('a note is stored as plain text, never interpreted', async () => {
      const inquiry = await newInquiry()
      const response = await staff.agent
        .post(apiPath(config, `/inquiries/${inquiry._id}/notes`))
        .set('X-CSRF-Token', staff.csrfToken)
        .send({ text: '<script>alert(1)</script>' })

      // Stored verbatim: React escapes it on the way out. A regex-stripped
      // version would only tempt somebody to render it as HTML.
      assert.equal(response.body.data.internalNotes[0].text, '<script>alert(1)</script>')
    })
  })

  describe('follow-up', () => {
    test('a valid date is stored and null clears it', async () => {
      const inquiry = await newInquiry()
      const set = await staff.agent
        .patch(apiPath(config, `/inquiries/${inquiry._id}/follow-up`))
        .set('X-CSRF-Token', staff.csrfToken)
        .send({ followUpAt: '2026-09-01T09:00:00.000Z' })
      assert.equal(set.body.data.followUpAt, '2026-09-01T09:00:00.000Z')

      const cleared = await staff.agent
        .patch(apiPath(config, `/inquiries/${inquiry._id}/follow-up`))
        .set('X-CSRF-Token', staff.csrfToken)
        .send({ followUpAt: null })
      assert.equal(cleared.body.data.followUpAt, null)
    })

    test('a past date is allowed, for recording an overdue follow-up', async () => {
      const inquiry = await newInquiry()
      const response = await staff.agent
        .patch(apiPath(config, `/inquiries/${inquiry._id}/follow-up`))
        .set('X-CSRF-Token', staff.csrfToken)
        .send({ followUpAt: '2020-01-01T00:00:00.000Z' })
      assert.equal(response.status, 200)
    })

    test('a malformed date is refused', async () => {
      const inquiry = await newInquiry()
      const response = await staff.agent
        .patch(apiPath(config, `/inquiries/${inquiry._id}/follow-up`))
        .set('X-CSRF-Token', staff.csrfToken)
        .send({ followUpAt: 'next tuesday-ish' })
      assert.equal(response.status, 400)
    })
  })

  describe('priority', () => {
    test('a manager may change it', async () => {
      const inquiry = await newInquiry()
      const response = await manager.agent
        .patch(apiPath(config, `/inquiries/${inquiry._id}/priority`))
        .set('X-CSRF-Token', manager.csrfToken)
        .send({ priority: 'high' })
      assert.equal(response.body.data.priority, 'high')
    })

    test('a manager may downgrade an urgent one', async () => {
      const inquiry = await newInquiry({ type: 'emergency', phone: '+977 980 111 2222', message: 'downgrade me' })
      const response = await manager.agent
        .patch(apiPath(config, `/inquiries/${inquiry._id}/priority`))
        .set('X-CSRF-Token', manager.csrfToken)
        .send({ priority: 'normal' })
      assert.equal(response.body.data.priority, 'normal')
    })

    test('an unknown priority is refused', async () => {
      const inquiry = await newInquiry()
      const response = await manager.agent
        .patch(apiPath(config, `/inquiries/${inquiry._id}/priority`))
        .set('X-CSRF-Token', manager.csrfToken)
        .send({ priority: 'critical' })
      assert.equal(response.status, 400)
    })
  })

  describe('assignment', () => {
    test('every assignable admin role is accepted', async () => {
      for (const role of ['admin', 'superAdmin']) {
        const inquiry = await newInquiry()
        const response = await manager.agent
          .patch(apiPath(config, `/inquiries/${inquiry._id}/assignment`))
          .set('X-CSRF-Token', manager.csrfToken)
          .send({ assignedToUserId: String(fx.users[role]._id) })
        assert.equal(response.status, 200, role)
        assert.equal(response.body.data.assignedTo.id, String(fx.users[role]._id))
      }
    })

    test('a customer or guide cannot be assigned', async () => {
      for (const role of ['customer', 'guideUser']) {
        const inquiry = await newInquiry()
        const response = await manager.agent
          .patch(apiPath(config, `/inquiries/${inquiry._id}/assignment`))
          .set('X-CSRF-Token', manager.csrfToken)
          .send({ assignedToUserId: String(fx.users[role]._id) })
        assert.equal(response.status, 400, role)
      }
    })

    test('a suspended admin cannot be assigned new work', async () => {
      const User = (await import('../../src/modules/users/user.model.js')).default
      await User.updateOne({ _id: fx.users.admin._id }, { $set: { status: 'suspended' } })

      const inquiry = await newInquiry()
      const response = await manager.agent
        .patch(apiPath(config, `/inquiries/${inquiry._id}/assignment`))
        .set('X-CSRF-Token', manager.csrfToken)
        .send({ assignedToUserId: String(fx.users.admin._id) })

      assert.equal(response.status, 400)
      await User.updateOne({ _id: fx.users.admin._id }, { $set: { status: 'active' } })
    })

    test('a role supplied in the body cannot override the stored one', async () => {
      // The target's role is read from the database. If the body were trusted,
      // anybody could assign a customer by claiming they are an admin.
      const inquiry = await newInquiry()
      const response = await manager.agent
        .patch(apiPath(config, `/inquiries/${inquiry._id}/assignment`))
        .set('X-CSRF-Token', manager.csrfToken)
        .send({ assignedToUserId: String(fx.users.customer._id), role: 'admin' })
      assert.equal(response.status, 400)
    })

    test('null unassigns', async () => {
      const inquiry = await newInquiry()
      await manager.agent
        .patch(apiPath(config, `/inquiries/${inquiry._id}/assignment`))
        .set('X-CSRF-Token', manager.csrfToken)
        .send({ assignedToUserId: String(fx.users.admin._id) })

      const response = await manager.agent
        .patch(apiPath(config, `/inquiries/${inquiry._id}/assignment`))
        .set('X-CSRF-Token', manager.csrfToken)
        .send({ assignedToUserId: null })
      assert.equal(response.body.data.assignedTo, null)
    })

    test('an unknown target is refused', async () => {
      const inquiry = await newInquiry()
      const response = await manager.agent
        .patch(apiPath(config, `/inquiries/${inquiry._id}/assignment`))
        .set('X-CSRF-Token', manager.csrfToken)
        .send({ assignedToUserId: '507f1f77bcf86cd799439099' })
      assert.equal(response.status, 400)
    })
  })
})
