// Connects the authentication tests to a database of their own.
//
// These tests create and delete real users. They load the ordinary `.env`, so
// the safety here is not optional: the URI's host is reused but the **database
// name is replaced** with `AUTH_TEST_DATABASE_NAME`, and four assertions run
// against the live connection before anything is deleted.
//
// Nothing in this file ever prints a URI.
import mongoose from 'mongoose'
import { connectDatabase, disconnectDatabase } from '../../src/config/database.js'
import User from '../../src/modules/users/user.model.js'

// A database name that would be a catastrophe to clear.
const FORBIDDEN_NAMES = ['camp_for_nepal', 'production', 'staging']

// Every account these tests create uses this domain, so cleanup is precise
// rather than "empty the collection".
export const TEST_EMAIL_DOMAIN = 'authtest.invalid'
const TEST_EMAIL_PATTERN = /@authtest\.invalid$/

let counter = 0
export function testEmail(prefix = 'user') {
  counter += 1
  return `${prefix}-${process.pid}-${counter}@${TEST_EMAIL_DOMAIN}`
}

// Swaps the database name in a connection string, leaving host, credentials,
// and options untouched.
export function withDatabaseName(uri, databaseName) {
  const url = new URL(uri)
  url.pathname = `/${databaseName}`
  return url.toString()
}

export function testDatabaseName() {
  return (process.env.AUTH_TEST_DATABASE_NAME || '').trim()
}

// Returns a sentence explaining why these tests cannot run, or undefined when
// they can. Skipping keeps `npm test` green on a machine with no .env, while
// still refusing to run against the wrong database.
//
// undefined rather than null on purpose: node:test treats `skip: null` as
// truthy and would silently skip the whole suite.
export function testDatabaseSkipReason() {
  if (!process.env.MONGODB_URI) return 'no MONGODB_URI — run npm run test:auth, which loads .env'
  if (!process.env.SESSION_SECRETS) return 'no SESSION_SECRETS — see .env.example'

  const name = testDatabaseName()
  if (!name) return 'no AUTH_TEST_DATABASE_NAME — see .env.example'
  if (!name.endsWith('_test')) return `AUTH_TEST_DATABASE_NAME "${name}" does not end in _test`
  if (FORBIDDEN_NAMES.includes(name)) return `AUTH_TEST_DATABASE_NAME must not be "${name}"`

  return undefined
}

// Throws unless the live connection is pointed somewhere safe to delete from.
// Checked against `mongoose.connection.name`, not against the configured
// string, because only the former is what is actually open.
function assertSafeToDelete() {
  const name = mongoose.connection.name
  if (!name) throw new Error('Not connected to a database.')
  if (!name.endsWith('_test')) {
    throw new Error(`Refusing to touch "${name}": a test database name must end in _test.`)
  }
  if (FORBIDDEN_NAMES.includes(name)) {
    throw new Error(`Refusing to touch "${name}".`)
  }
  if (name !== testDatabaseName()) {
    throw new Error(`Connected to "${name}" but AUTH_TEST_DATABASE_NAME is "${testDatabaseName()}".`)
  }
  return name
}

export async function connectTestDatabase() {
  const reason = testDatabaseSkipReason()
  if (reason) throw new Error(`Cannot connect: ${reason}`)

  await connectDatabase(withDatabaseName(process.env.MONGODB_URI, testDatabaseName()))
  return assertSafeToDelete()
}

// Removes only what these tests created, and only after the guard passes.
export async function cleanupTestUsers() {
  assertSafeToDelete()
  await User.deleteMany({ email: TEST_EMAIL_PATTERN })
}

// Sessions belong to the test database too, so clearing them cannot affect
// anybody. Still guarded.
export async function cleanupTestSessions() {
  assertSafeToDelete()
  await mongoose.connection.db.collection('sessions').deleteMany({})
}

export async function disconnectTestDatabase() {
  await disconnectDatabase()
}

export default {
  testDatabaseSkipReason,
  connectTestDatabase,
  cleanupTestUsers,
  cleanupTestSessions,
  disconnectTestDatabase,
  testEmail,
}
