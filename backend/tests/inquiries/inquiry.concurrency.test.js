// Two staff members working the same inquiry at the same time.
//
// The status update is a conditional write: it names the status the caller
// believed was current. If somebody else moved it first, the update matches
// nothing and this reports a conflict — rather than silently overwriting their
// transition and dropping the history entry they just wrote.
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

describe('status transitions and concurrency', { skip }, () => {
  let config
  let app
  let fx
  let staff
  let manager

  async function newInquiry() {
    const { response } = await submitInquiry(buildTestApp(), config, {
      ...base, type: 'contact', message: `transition ${Math.random()}`,
    })
    return Inquiry.findOne({ referenceCode: response.body.data.referenceCode })
  }

  const move = (session, id, body) =>
    session.agent
      .patch(apiPath(config, `/inquiries/${id}/status`))
      .set('X-CSRF-Token', session.csrfToken)
      .send(body)

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

  describe('allowed moves', () => {
    test('new to contacted', async () => {
      const inquiry = await newInquiry()
      const response = await move(staff, inquiry._id, { status: 'contacted' })
      assert.equal(response.status, 200)
      assert.equal(response.body.data.status, 'contacted')
    })

    test('contacted to quoted', async () => {
      const inquiry = await newInquiry()
      await move(staff, inquiry._id, { status: 'contacted' })
      const response = await move(manager, inquiry._id, { status: 'quoted' })
      assert.equal(response.status, 200)
    })

    test('quoted to lost, and quoted to closed', async () => {
      for (const status of ['lost', 'closed']) {
        const inquiry = await newInquiry()
        await move(staff, inquiry._id, { status: 'contacted' })
        await move(staff, inquiry._id, { status: 'quoted' })
        assert.equal((await move(staff, inquiry._id, { status })).status, 200, status)
      }
    })

    test('new straight to lost or closed', async () => {
      for (const status of ['lost', 'closed']) {
        const inquiry = await newInquiry()
        assert.equal((await move(staff, inquiry._id, { status })).status, 200, status)
      }
    })
  })

  describe('refused moves', () => {
    test('the lifecycle never runs backwards', async () => {
      const inquiry = await newInquiry()
      await move(staff, inquiry._id, { status: 'contacted' })
      assert.equal((await move(staff, inquiry._id, { status: 'new' })).status, 409)
    })

    test('a closed inquiry is terminal', async () => {
      const inquiry = await newInquiry()
      await move(staff, inquiry._id, { status: 'closed' })
      assert.equal((await move(staff, inquiry._id, { status: 'contacted' })).status, 409)
    })

    test('converted cannot be chosen by hand', async () => {
      // An inquiry becomes converted because a booking was created, not
      // because somebody picked it from a menu.
      const inquiry = await newInquiry()
      const response = await move(manager, inquiry._id, { status: 'converted' })
      assert.equal(response.status, 400)
      assert.match(response.body.message, /booking is created/)
    })

    test('an unknown status is refused', async () => {
      const inquiry = await newInquiry()
      assert.equal((await move(staff, inquiry._id, { status: 'archived' })).status, 400)
      assert.equal((await move(staff, inquiry._id, { status: 42 })).status, 400)
      assert.equal((await move(staff, inquiry._id, {})).status, 400)
    })
  })

  describe('the audit trail', () => {
    test('every move appends, and nothing is rewritten', async () => {
      const inquiry = await newInquiry()
      await move(staff, inquiry._id, { status: 'contacted' })
      await move(manager, inquiry._id, { status: 'quoted' })
      const response = await move(manager, inquiry._id, { status: 'closed', reason: 'Booked elsewhere' })

      const history = response.body.data.statusHistory
      assert.equal(history.length, 4)
      assert.deepEqual(history.map((entry) => entry.toStatus), ['new', 'contacted', 'quoted', 'closed'])
      assert.deepEqual(history.map((entry) => entry.fromStatus), [null, 'new', 'contacted', 'quoted'])
      assert.equal(history[3].reason, 'Booked elsewhere')
    })

    test('the actor comes from the session, not the body', async () => {
      const inquiry = await newInquiry()
      const response = await move(staff, inquiry._id, {
        status: 'contacted',
        changedByUserId: String(fx.users.admin._id),
        changedAt: '1999-01-01T00:00:00.000Z',
      })

      const last = response.body.data.statusHistory.at(-1)
      assert.equal(last.changedBy.id, String(fx.users.admin._id))
      assert.ok(new Date(last.changedAt).getFullYear() > 2020)
    })

    test('the initial record has no actor — a public submission has no staff', async () => {
      const inquiry = await newInquiry()
      const response = await staff.agent.get(apiPath(config, `/inquiries/${inquiry._id}`))
      const first = response.body.data.statusHistory[0]
      assert.equal(first.fromStatus, null)
      assert.equal(first.toStatus, 'new')
      assert.equal(first.changedBy, null)
    })
  })

  describe('two people at once', () => {
    test('a stale fromStatus loses, with 409', async () => {
      const inquiry = await newInquiry()
      // Both read "new". One moves it to contacted first.
      assert.equal((await move(staff, inquiry._id, { status: 'contacted', fromStatus: 'new' })).status, 200)

      // The second still believes it is "new".
      const stale = await move(manager, inquiry._id, { status: 'lost', fromStatus: 'new' })
      assert.equal(stale.status, 409)
    })

    test("the winner's transition survives intact", async () => {
      const inquiry = await newInquiry()
      await move(staff, inquiry._id, { status: 'contacted', fromStatus: 'new' })
      await move(manager, inquiry._id, { status: 'lost', fromStatus: 'new' })

      const response = await staff.agent.get(apiPath(config, `/inquiries/${inquiry._id}`))
      assert.equal(response.body.data.status, 'contacted')
      // Two entries, not three: the loser wrote nothing.
      assert.equal(response.body.data.statusHistory.length, 2)
    })

    test('simultaneous identical moves produce exactly one transition', async () => {
      const inquiry = await newInquiry()
      const results = await Promise.all([
        move(staff, inquiry._id, { status: 'contacted', fromStatus: 'new' }),
        move(manager, inquiry._id, { status: 'contacted', fromStatus: 'new' }),
      ])

      const succeeded = results.filter((response) => response.status === 200)
      const conflicted = results.filter((response) => response.status === 409)
      assert.equal(succeeded.length, 1)
      assert.equal(conflicted.length, 1)

      const detail = await staff.agent.get(apiPath(config, `/inquiries/${inquiry._id}`))
      assert.equal(detail.body.data.statusHistory.length, 2)
    })
  })
})
