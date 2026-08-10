// Who may reach the CRM, enforced on the server.
//
// The React admin panel hides links a role should not see. That is a courtesy,
// not a boundary — these tests are the boundary.
import assert from 'node:assert/strict'
import test, { after, before, describe } from 'node:test'
import request from 'supertest'
import {
  apiPath, buildTestApp, cleanupInquiryFixtures, closeTestApps, connectTestDatabase,
  disconnectTestDatabase, seedInquiryFixtures, signIn, submitInquiry, testConfig,
  testDatabaseSkipReason,
} from '../helpers/inquiryTestContext.js'

const skip = testDatabaseSkipReason()

describe('inquiry CRM authorization', { skip }, () => {
  let config
  let app
  let fx
  let inquiryId

  before(async () => {
    await connectTestDatabase()
    config = testConfig()
    app = buildTestApp()
    fx = await seedInquiryFixtures()

    const { response } = await submitInquiry(app, config, {
      fullName: 'Jiwoo Park', email: 'jiwoo@inquirytest.invalid',
      type: 'contact', message: 'authorization fixture', consent: true,
    })
    const Inquiry = (await import('../../src/modules/inquiries/inquiry.model.js')).default
    const stored = await Inquiry.findOne({ referenceCode: response.body.data.referenceCode })
    inquiryId = String(stored._id)
  })

  after(async () => {
    await cleanupInquiryFixtures()
    await closeTestApps()
    await disconnectTestDatabase()
  })

  describe('without a session', () => {
    test('every CRM route answers 401', async () => {
      const routes = [
        ['get', `/inquiries`],
        ['get', `/inquiries/${inquiryId}`],
        ['patch', `/inquiries/${inquiryId}/status`],
        ['patch', `/inquiries/${inquiryId}/assignment`],
        ['patch', `/inquiries/${inquiryId}/follow-up`],
        ['patch', `/inquiries/${inquiryId}/priority`],
        ['post', `/inquiries/${inquiryId}/notes`],
      ]
      for (const [method, path] of routes) {
        // GET reaches requireAuth directly; unsafe methods meet CSRF first,
        // which is also a refusal. Either way nothing gets through.
        const response = await request(app)[method](apiPath(config, path)).send({})
        assert.ok([401, 403].includes(response.status), `${method} ${path} → ${response.status}`)
      }
    })

    test('a GET list is specifically 401, not 403', async () => {
      const response = await request(app).get(apiPath(config, '/inquiries'))
      assert.equal(response.status, 401)
    })
  })

  describe('roles with no inquiry access', () => {
    for (const role of ['customer', 'guideUser']) {
      test(`${role} is refused the list`, async () => {
        const { agent } = await signIn(app, config, fx.users[role].email)
        const response = await agent.get(apiPath(config, '/inquiries'))
        assert.equal(response.status, 403)
      })

      test(`${role} is refused the detail`, async () => {
        const { agent } = await signIn(app, config, fx.users[role].email)
        const response = await agent.get(apiPath(config, `/inquiries/${inquiryId}`))
        assert.equal(response.status, 403)
      })
    }

    test('the refusal never names the roles that would have worked', async () => {
      const { agent } = await signIn(app, config, fx.users.customer.email)
      const response = await agent.get(apiPath(config, '/inquiries'))
      const body = JSON.stringify(response.body)
      for (const role of ['admin', 'super_admin']) {
        assert.ok(!body.includes(role), role)
      }
    })
  })

  describe('roles with inquiry access', () => {
    for (const role of ['admin', 'superAdmin']) {
      test(`${role} may list and read`, async () => {
        const { agent } = await signIn(app, config, fx.users[role].email)
        assert.equal((await agent.get(apiPath(config, '/inquiries'))).status, 200)
        assert.equal((await agent.get(apiPath(config, `/inquiries/${inquiryId}`))).status, 200)
      })
    }
  })

  describe('admin handling actions', () => {
    test('admin may assign, change priority, add notes, and set follow-ups', async () => {
      const { agent, csrfToken } = await signIn(app, config, fx.users.admin.email)
      assert.equal(
        (await agent.patch(apiPath(config, `/inquiries/${inquiryId}/assignment`)).set('X-CSRF-Token', csrfToken).send({ assignedToUserId: String(fx.users.admin._id) })).status,
        200
      )
      assert.equal(
        (await agent.patch(apiPath(config, `/inquiries/${inquiryId}/priority`)).set('X-CSRF-Token', csrfToken).send({ priority: 'high' })).status,
        200
      )
      assert.equal(
        (await agent.post(apiPath(config, `/inquiries/${inquiryId}/notes`)).set('X-CSRF-Token', csrfToken).send({ text: 'A note' })).status,
        200
      )
      assert.equal(
        (await agent.patch(apiPath(config, `/inquiries/${inquiryId}/follow-up`)).set('X-CSRF-Token', csrfToken).send({ followUpAt: null })).status,
        200
      )
    })

    test('super admin may assign and prioritise', async () => {
      const { agent, csrfToken } = await signIn(app, config, fx.users.superAdmin.email)
      assert.equal((await agent.patch(apiPath(config, `/inquiries/${inquiryId}/assignment`)).set('X-CSRF-Token', csrfToken).send({ assignedToUserId: null })).status, 200)
      assert.equal((await agent.patch(apiPath(config, `/inquiries/${inquiryId}/priority`)).set('X-CSRF-Token', csrfToken).send({ priority: 'normal' })).status, 200)
    })
  })

  describe('CSRF applies to staff routes too', () => {
    test('a signed-in staff request without a token is refused', async () => {
      const { agent } = await signIn(app, config, fx.users.admin.email)
      const response = await agent
        .post(apiPath(config, `/inquiries/${inquiryId}/notes`))
        .send({ text: 'no token' })
      assert.equal(response.status, 403)
    })
  })

  describe('the endpoints that must not exist', () => {
    test('there is no DELETE for an inquiry', async () => {
      // An inquiry is somebody's request for help and part of the audit trail.
      // It is closed, never erased.
      const { agent, csrfToken } = await signIn(app, config, fx.users.superAdmin.email)
      const response = await agent
        .delete(apiPath(config, `/inquiries/${inquiryId}`))
        .set('X-CSRF-Token', csrfToken)
      assert.equal(response.status, 404)
    })

    test('there is no manual conversion endpoint', async () => {
      // Conversion creates a booking, so it belongs to booking creation.
      const { agent, csrfToken } = await signIn(app, config, fx.users.superAdmin.email)
      const response = await agent
        .post(apiPath(config, `/inquiries/${inquiryId}/convert`))
        .set('X-CSRF-Token', csrfToken)
        .send({})
      assert.equal(response.status, 404)
    })
  })
})
