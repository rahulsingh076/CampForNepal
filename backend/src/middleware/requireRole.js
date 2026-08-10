// Authorization: an explicit allowlist of roles per route.
//
// Deliberately not a hierarchy. With "level >= 3" checks, inserting a role in
// the middle silently grants it everything above that number; with an
// allowlist, a new role gets access to exactly the routes someone adds it to.
//
// Must run after requireAuth. If req.user is missing the request is refused —
// an authorization check that quietly passes when authentication was forgotten
// is worse than no check at all.
import { isRole, STAFF_ROLES } from '../constants/roles.js'
import ApiError from '../utils/ApiError.js'

export default function requireRole(...allowedRoles) {
  const allowed = allowedRoles.flat()

  // A typo in a role name would otherwise become a route nobody can reach —
  // failing at boot makes it a five-second fix instead of a support ticket.
  if (allowed.length === 0) throw new Error('requireRole needs at least one role')
  const unknown = allowed.filter((role) => !isRole(role))
  if (unknown.length > 0) {
    throw new Error(`requireRole received unknown role(s): ${unknown.join(', ')}`)
  }

  const allowedSet = new Set(allowed)

  return function checkRole(req, _res, next) {
    if (!req.user) {
      return next(ApiError.unauthorized('You need to sign in to do that.'))
    }
    if (!allowedSet.has(req.user.role)) {
      // The message never names the roles that would have worked: that is a
      // map of the admin surface handed to whoever probes the endpoint.
      return next(ApiError.forbidden('You do not have access to that.'))
    }
    return next()
  }
}

// A convenience for routes that belong to the operations panel as a whole.
export function requireStaff() {
  return requireRole(...STAFF_ROLES)
}
