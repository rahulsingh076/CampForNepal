// Role checks. These run without a database because a wrong answer here is a
// privilege escalation, and that deserves fast, exhaustive coverage.
import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import { ROLES, STAFF_ROLES } from '../../src/constants/roles.js'
import requireRole, { requireStaff } from '../../src/middleware/requireRole.js'
import { validateRegistration } from '../../src/modules/auth/auth.validation.js'

function run(middleware, user) {
  let error
  middleware({ user }, {}, (passed) => {
    error = passed
  })
  return error
}

describe('requireRole — construction', () => {
  test('an unknown role name fails at boot, not at request time', () => {
    assert.throws(() => requireRole('superadmin'), /unknown role/)
    assert.throws(() => requireRole('admin', 'manager'), /unknown role/)
  })

  test('an empty allowlist is a mistake, not "allow everyone"', () => {
    assert.throws(() => requireRole(), /at least one role/)
  })

  test('an array of roles is accepted as well as a list', () => {
    const middleware = requireRole(['admin', 'super_admin'])
    assert.equal(run(middleware, { role: 'admin' }), undefined)
  })
})

describe('requireRole — decisions', () => {
  test('an allowed role passes', () => {
    assert.equal(run(requireRole('admin'), { role: 'admin' }), undefined)
  })

  test('every other role is refused with 403', () => {
    const middleware = requireRole('admin')
    for (const role of ROLES.filter((r) => r !== 'admin')) {
      assert.equal(run(middleware, { role })?.status, 403, `${role} should not have passed`)
    }
  })

  test('super_admin is not automatically allowed — there is no hierarchy', () => {
    // Every route names the roles it accepts. Nothing inherits access from
    // being "higher up", because there is no up.
    assert.equal(run(requireRole('admin'), { role: 'super_admin' })?.status, 403)
  })

  test('a missing user is 401, not a silent pass', () => {
    // If requireAuth were ever left off a route, this is what stops the request
    // rather than letting an anonymous caller through.
    assert.equal(run(requireRole('admin'), undefined)?.status, 401)
  })

  test('a user with no role is refused', () => {
    assert.equal(run(requireRole('admin'), {})?.status, 403)
  })

  test('the refusal does not reveal which roles would have worked', () => {
    const error = run(requireRole('admin', 'super_admin'), { role: 'customer' })
    assert.ok(!error.message.includes('admin'))
    assert.ok(!error.message.includes('super_admin'))
  })
})

// The simplified dashboard model has customer/guide on the public side and
// admin/super_admin in the operations panel.
describe('requireRole — the named role scenarios', () => {
  const ADMIN_ONLY = requireRole('admin', 'super_admin')
  // Deliberately excludes super_admin, to prove nothing is implicit.
  const LITERAL_ADMIN_ONLY = requireRole('admin')

  test('a customer is denied a staff-only route', () => {
    assert.equal(run(ADMIN_ONLY, { role: 'customer' })?.status, 403)
  })

  test('admin passes the admin allowlist', () => {
    assert.equal(run(ADMIN_ONLY, { role: 'admin' }), undefined)
  })

  test('super_admin passes only where it is explicitly included', () => {
    assert.equal(run(ADMIN_ONLY, { role: 'super_admin' }), undefined)
    assert.equal(run(LITERAL_ADMIN_ONLY, { role: 'super_admin' })?.status, 403)
  })

  test('a guide reaches none of them', () => {
    for (const middleware of [ADMIN_ONLY, LITERAL_ADMIN_ONLY]) {
      assert.equal(run(middleware, { role: 'guide' })?.status, 403)
    }
  })
})

describe('requireRole — the role comes from req.user, never the body', () => {
  test('a role in the request body is not consulted', () => {
    // requireRole only ever reads req.user.role, which requireAuth loaded from
    // the database. If it read the body, this would pass.
    const middleware = requireRole('admin')
    const request = { user: { role: 'customer' }, body: { role: 'admin' }, query: { role: 'admin' } }

    let error
    middleware(request, {}, (passed) => {
      error = passed
    })
    assert.equal(error?.status, 403)
  })

  test('a role that merely contains an allowed name is refused', () => {
    // Substring matching would let "not_admin" through a check for "admin".
    const middleware = requireRole('admin')
    assert.equal(run(middleware, { role: 'admin_readonly' })?.status, 403)
    assert.equal(run(middleware, { role: 'super_admin' })?.status, 403)
  })
})

describe('requireStaff', () => {
  test('every staff role passes', () => {
    const middleware = requireStaff()
    for (const role of STAFF_ROLES) {
      assert.equal(run(middleware, { role }), undefined, role)
    }
  })

  test('a customer and a guide do not', () => {
    const middleware = requireStaff()
    assert.equal(run(middleware, { role: 'customer' })?.status, 403)
    assert.equal(run(middleware, { role: 'guide' })?.status, 403)
  })
})

describe('registration cannot choose a role', () => {
  test('role and status in the body are dropped, not assigned', () => {
    const clean = validateRegistration({
      fullName: 'Mallory Example',
      email: 'mallory@example.com',
      password: 'a-long-enough-password',
      role: 'super_admin',
      status: 'active',
      sessionVersion: 99,
      passwordHash: '$argon2id$forged',
    })

    assert.deepEqual(Object.keys(clean).sort(), ['email', 'fullName', 'password', 'preferences'])
    assert.equal(clean.role, undefined)
    assert.equal(clean.status, undefined)
    assert.equal(clean.sessionVersion, undefined)
    assert.equal(clean.passwordHash, undefined)
  })

  test('an object where a string belongs is refused, so a query cannot be injected', () => {
    assert.throws(
      () => validateRegistration({ fullName: 'A Name', email: { $ne: null }, password: 'x'.repeat(12) }),
      { status: 400 }
    )
  })
})
