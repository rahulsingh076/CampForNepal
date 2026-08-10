// The User model, and above all what it refuses to serialise.
//
// No database needed: validation and toJSON both run in memory.
import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import { ROLES } from '../../src/constants/roles.js'
import { USER_STATUSES } from '../../src/constants/userStatuses.js'
import User from '../../src/modules/users/user.model.js'

// Every one of these tells an attacker something useful: the hash to crack
// offline, how many guesses remain before lockout, or whether a lock is active.
const PRIVATE_FIELDS = ['passwordHash', 'failedLoginAttempts', 'lockUntil', 'sessionVersion']

function userFixture(overrides = {}) {
  return {
    fullName: 'Pemba Sherpa',
    email: 'pemba@example.com',
    passwordHash: '$argon2id$v=19$m=19456,p=1,t=2$c2FsdHNhbHRzYWx0$aGFzaGhhc2hoYXNo',
    ...overrides,
  }
}

async function validationErrorFor(doc) {
  try {
    await doc.validate()
    return null
  } catch (error) {
    return error
  }
}

describe('User model — validation', () => {
  test('a complete user passes validation', async () => {
    assert.equal(await validationErrorFor(new User(userFixture())), null)
  })

  test('a missing name fails', async () => {
    const error = await validationErrorFor(new User(userFixture({ fullName: undefined })))
    assert.ok(error?.errors?.fullName)
  })

  test('a missing password hash fails, so an account cannot exist without one', async () => {
    const error = await validationErrorFor(new User(userFixture({ passwordHash: undefined })))
    assert.ok(error?.errors?.passwordHash)
  })

  test('a malformed email fails', async () => {
    for (const email of ['not-an-email', 'missing@domain', 'two @spaces.com', '@example.com']) {
      const error = await validationErrorFor(new User(userFixture({ email })))
      assert.ok(error?.errors?.email, `${email} should have been rejected`)
    }
  })

  test('an unknown role fails', async () => {
    const error = await validationErrorFor(new User(userFixture({ role: 'owner' })))
    assert.ok(error?.errors?.role)
  })

  test('every listed role is accepted', async () => {
    for (const role of ROLES) {
      assert.equal(await validationErrorFor(new User(userFixture({ role }))), null, role)
    }
  })

  test('an unknown status fails', async () => {
    const error = await validationErrorFor(new User(userFixture({ status: 'deleted' })))
    assert.ok(error?.errors?.status)
  })

  test('every listed status is accepted', async () => {
    for (const status of USER_STATUSES) {
      assert.equal(await validationErrorFor(new User(userFixture({ status }))), null, status)
    }
  })
})

describe('User model — defaults', () => {
  test('a new account is a customer', () => {
    assert.equal(new User(userFixture()).role, 'customer')
  })

  test('a new account is active', () => {
    assert.equal(new User(userFixture()).status, 'active')
  })

  test('a new account starts with no failures and session version 0', () => {
    const user = new User(userFixture())
    assert.equal(user.failedLoginAttempts, 0)
    assert.equal(user.sessionVersion, 0)
  })
})

describe('User model — email normalisation', () => {
  test('an email is stored lowercased and trimmed', () => {
    const user = new User(userFixture({ email: '  Pemba@Example.COM  ' }))
    assert.equal(user.email, 'pemba@example.com')
  })

  test('normalisation is what makes the unique index case-insensitive', () => {
    const a = new User(userFixture({ email: 'PEMBA@EXAMPLE.COM' }))
    const b = new User(userFixture({ email: 'pemba@example.com' }))
    assert.equal(a.email, b.email)
  })

  test('a plus address is NOT stripped — it is a different mailbox to its owner', () => {
    const user = new User(userFixture({ email: 'pemba+trek@example.com' }))
    assert.equal(user.email, 'pemba+trek@example.com')
  })
})

describe('User model — what reaches JSON', () => {
  test('no private field survives serialisation', () => {
    const json = new User(
      userFixture({ failedLoginAttempts: 4, lockUntil: new Date(), sessionVersion: 7 })
    ).toJSON()

    for (const field of PRIVATE_FIELDS) {
      assert.equal(json[field], undefined, `${field} leaked into JSON`)
    }
  })

  test('a private field is stripped even when it was explicitly loaded', () => {
    // select:false stops a query loading a field, but a document built in
    // memory still materialises defaults. The transform is what makes the
    // guarantee hold either way.
    const user = new User(userFixture())
    assert.ok(user.passwordHash, 'the document itself must still expose the hash internally')
    assert.equal(user.toJSON().passwordHash, undefined)
  })

  test('the hash is not reachable through JSON.stringify either', () => {
    const serialised = JSON.stringify(new User(userFixture()))
    assert.ok(!serialised.includes('argon2'))
    assert.ok(!serialised.includes('passwordHash'))
  })

  test('the public shape is exactly what the frontend expects', () => {
    const json = new User(userFixture()).toJSON()
    assert.deepEqual(Object.keys(json).sort(), [
      'email',
      'emailVerifiedAt',
      'fullName',
      'id',
      'lastLoginAt',
      'passwordChangedAt',
      'preferences',
      'role',
      'status',
    ])
  })

  test('_id becomes a string id and __v is gone', () => {
    const json = new User(userFixture()).toJSON()
    assert.equal(typeof json.id, 'string')
    assert.equal(json._id, undefined)
    assert.equal(json.__v, undefined)
  })
})

describe('User model — lockout', () => {
  test('no lockUntil means not locked', () => {
    assert.equal(new User(userFixture()).isLocked(), false)
  })

  test('a future lockUntil means locked', () => {
    const user = new User(userFixture({ lockUntil: new Date(Date.now() + 60_000) }))
    assert.equal(user.isLocked(), true)
  })

  test('a past lockUntil has simply expired — no cleanup job needed', () => {
    const user = new User(userFixture({ lockUntil: new Date(Date.now() - 60_000) }))
    assert.equal(user.isLocked(), false)
  })
})
