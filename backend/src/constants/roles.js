// Camp For Nepal roles, exactly as the frontend defines them.
//
// Deliberately a flat list, not a numeric hierarchy: "level >= 5" style checks
// grant access by accident the moment a role is inserted in the middle.
// Authorization uses explicit allowlists instead — see requireRole.
export const ROLES = Object.freeze([
  'customer',
  'guide',
  'admin',
  'super_admin',
])

// Public registration always creates this. A role in a request body is ignored.
export const DEFAULT_ROLE = 'customer'

// Roles that belong to the operations panel rather than the customer area.
// Mirrors STAFF_ROLES in the frontend's config/navigation.js.
export const STAFF_ROLES = Object.freeze([
  'admin',
  'super_admin',
])

export function isRole(value) {
  return typeof value === 'string' && ROLES.includes(value)
}
