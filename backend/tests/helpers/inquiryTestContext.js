// Fixtures and guards for the inquiry tests.
//
// These tests create and delete real records, so the database guard is not
// optional: the connection name is checked against INQUIRY_TEST_DATABASE_NAME
// and four assertions run before anything is deleted. `dropDatabase` is never
// called.
//
// Everything created here is fictional. No real customer detail, no real
// password, no real email domain.
import mongoose from 'mongoose'
import request from 'supertest'
import createApp from '../../src/app.js'
import { connectDatabase, disconnectDatabase } from '../../src/config/database.js'
import loadEnv from '../../src/config/env.js'
import FixedDeparture from '../../src/modules/fixedDepartures/fixedDeparture.model.js'
import Guide from '../../src/modules/guides/guide.model.js'
import Inquiry from '../../src/modules/inquiries/inquiry.model.js'
import Package from '../../src/modules/packages/package.model.js'
import User from '../../src/modules/users/user.model.js'
import { hashPassword } from '../../src/utils/password.js'
import { fixedDepartureFixture, guideFixture, packageFixture } from './modelFixtures.js'

const FORBIDDEN_NAMES = ['camp_for_nepal', 'production', 'staging']

// A reserved TLD. Nothing sent here can reach a real mailbox.
export const TEST_EMAIL_DOMAIN = 'inquirytest.invalid'
export const TEST_PASSWORD = 'annapurna-base-camp-2026'

// node --test gives each test file its own process, so a pid scopes cleanup to
// the file that created the records. Without it, one file's teardown deletes
// another file's fixtures mid-run and produces failures that look real.
const PROCESS_START = new Date()

let counter = 0
export function testEmail(prefix = 'person') {
  counter += 1
  return `${prefix}-${process.pid}-${counter}@${TEST_EMAIL_DOMAIN}`
}

export function testDatabaseName() {
  return (process.env.INQUIRY_TEST_DATABASE_NAME || '').trim()
}

// Returns why these tests cannot run, or undefined when they can.
//
// undefined rather than null: node:test treats `skip: null` as truthy and
// would silently skip the whole suite.
export function testDatabaseSkipReason() {
  if (!process.env.MONGODB_URI) return 'no MONGODB_URI — run npm run test:inquiries, which loads .env'
  if (!process.env.SESSION_SECRETS) return 'no SESSION_SECRETS — see .env.example'

  const name = testDatabaseName()
  if (!name) return 'no INQUIRY_TEST_DATABASE_NAME — see .env.example'
  if (!name.endsWith('_test')) return `INQUIRY_TEST_DATABASE_NAME "${name}" does not end in _test`
  if (FORBIDDEN_NAMES.includes(name)) return `INQUIRY_TEST_DATABASE_NAME must not be "${name}"`
  return undefined
}

function assertSafeToDelete() {
  const name = mongoose.connection.name
  if (!name) throw new Error('Not connected to a database.')
  if (!name.endsWith('_test')) throw new Error(`Refusing to touch "${name}": must end in _test.`)
  if (FORBIDDEN_NAMES.includes(name)) throw new Error(`Refusing to touch "${name}".`)
  if (name !== testDatabaseName()) {
    throw new Error(`Connected to "${name}" but INQUIRY_TEST_DATABASE_NAME is "${testDatabaseName()}".`)
  }
  return name
}

export function withDatabaseName(uri, databaseName) {
  const url = new URL(uri)
  url.pathname = `/${databaseName}`
  return url.toString()
}

export async function connectTestDatabase() {
  const reason = testDatabaseSkipReason()
  if (reason) throw new Error(`Cannot connect: ${reason}`)
  await connectDatabase(withDatabaseName(process.env.MONGODB_URI, testDatabaseName()))
  return assertSafeToDelete()
}

export function testConfig() {
  return loadEnv(process.env)
}

// A fresh app per group: the public rate limiter counts in memory per app, so
// a shared one would let one group exhaust another group's budget and produce
// 429s that look like real failures.
const builtApps = []
export function buildTestApp() {
  const app = createApp(testConfig())
  builtApps.push(app)
  return app
}

export async function closeTestApps() {
  await Promise.all(builtApps.map((app) => app.locals.sessionStore?.close()))
  builtApps.length = 0
}

// ------------------------------------------------------------------ fixtures

// The shared catalogue fixtures are already known-valid against every model,
// so these only override what an inquiry test cares about: the slug (unique
// per run) and the visibility flags.
function testPackage(overrides = {}) {
  return packageFixture({ slug: `test-trek-${process.pid}-${(counter += 1)}`, ...overrides })
}

function testGuide(overrides = {}) {
  return guideFixture({ slug: `test-guide-${process.pid}-${(counter += 1)}`, ...overrides })
}

export async function createStaffUser(role, overrides = {}) {
  return User.create({
    fullName: `Test ${role}`,
    email: testEmail(role),
    passwordHash: await hashPassword(TEST_PASSWORD),
    role,
    status: 'active',
    ...overrides,
  })
}

// The minimum catalogue the inquiry tests need: something publishable to
// reference, and something hidden to be refused.
export async function seedInquiryFixtures() {
  assertSafeToDelete()

  const publishedPackage = await Package.create(testPackage())
  const draftPackage = await Package.create(testPackage({ title: 'Draft Trek', status: 'draft' }))
  const publicGuide = await Guide.create(testGuide({ publicProfile: true, status: 'published' }))
  const privateGuide = await Guide.create(
    testGuide({ fullName: 'Private Guide', publicProfile: false })
  )

  const departure = await FixedDeparture.create(
    fixedDepartureFixture({ packageId: publishedPackage._id, status: 'booking_open' })
  )
  // Belongs to a different package AND is a draft, so it fails both checks.
  const otherDeparture = await FixedDeparture.create(
    fixedDepartureFixture({ packageId: draftPackage._id, status: 'draft' })
  )

  const [admin, superAdmin, customer, guideUser] =
    await Promise.all([
      createStaffUser('admin'),
      createStaffUser('super_admin'),
      createStaffUser('customer'),
      createStaffUser('guide'),
    ])

  return {
    publishedPackage,
    draftPackage,
    publicGuide,
    privateGuide,
    departure,
    otherDeparture,
    users: { admin, superAdmin, customer, guideUser },
  }
}

// ------------------------------------------------------------------ requests

export function apiPath(config, path) {
  return `${config.apiPrefix}${path}`
}

export function newAgent(app) {
  return request.agent(app)
}

export async function getCsrfToken(agent, config) {
  const response = await agent.get(apiPath(config, '/auth/csrf-token'))
  return response.body?.data?.csrfToken
}

// Signs in and returns an agent whose cookie jar holds the session, plus the
// rotated CSRF token that login issued.
export async function signIn(app, config, email) {
  const agent = newAgent(app)
  const token = await getCsrfToken(agent, config)
  const response = await agent
    .post(apiPath(config, '/auth/login'))
    .set('X-CSRF-Token', token)
    .send({ email, password: TEST_PASSWORD })

  return { agent, response, csrfToken: response.body?.data?.csrfToken }
}

export async function submitInquiry(app, config, body, { agent, headers = {} } = {}) {
  const client = agent || newAgent(app)
  const token = await getCsrfToken(client, config)

  let pending = client.post(apiPath(config, '/inquiries')).set('X-CSRF-Token', token)
  for (const [name, value] of Object.entries(headers)) pending = pending.set(name, value)

  const response = await pending.send(body)
  return { agent: client, response }
}

// ------------------------------------------------------------------- cleanup

// Only what THIS process created, and only after the guard passes.
//
// Scoped by pid (users, packages, guides) and by start time (inquiries, which
// carry no pid of their own). Sessions are left alone entirely: clearing them
// would sign out a concurrently running file mid-test.
export async function cleanupInquiryFixtures() {
  assertSafeToDelete()
  const mine = new RegExp(`-${process.pid}-`)

  await Promise.all([
    Inquiry.deleteMany({ createdAt: { $gte: PROCESS_START } }),
    User.deleteMany({ email: new RegExp(`-${process.pid}-\\d+@${TEST_EMAIL_DOMAIN}$`) }),
    Package.deleteMany({ slug: mine }),
    Guide.deleteMany({ slug: mine }),
    FixedDeparture.deleteMany({ createdAt: { $gte: PROCESS_START } }),
  ])
}

// Removes everything any inquiry test ever created. Used by the verification
// script and by a manual tidy-up, never between test files.
export async function cleanupAllTestData() {
  assertSafeToDelete()
  await Promise.all([
    Inquiry.deleteMany({}),
    User.deleteMany({ email: new RegExp(`@${TEST_EMAIL_DOMAIN}$`) }),
    Package.deleteMany({ slug: /^test-trek-/ }),
    Guide.deleteMany({ slug: /^test-guide-/ }),
    FixedDeparture.deleteMany({}),
  ])
  await mongoose.connection.db.collection('sessions').deleteMany({})
}

export async function disconnectTestDatabase() {
  await disconnectDatabase()
}

export default {
  testDatabaseSkipReason,
  connectTestDatabase,
  seedInquiryFixtures,
  cleanupInquiryFixtures,
  cleanupAllTestData,
  disconnectTestDatabase,
  buildTestApp,
  closeTestApps,
  submitInquiry,
  signIn,
}
