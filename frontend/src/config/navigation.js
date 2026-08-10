// Sidebar navigation for the signed-in areas. Public nav comes from menu.js
// via dataClient, because the admin can edit that; these are app structure.

// Roles that belong in the admin panel rather than the customer dashboard.
export const STAFF_ROLES = ['admin', 'super_admin']

export const CUSTOMER_ROLES = ['customer']

export const ADMIN_ROLE_LABELS = {
  admin: 'Admin',
  super_admin: 'Super Admin',
}

const ADMIN_ACCESS = ['admin', 'super_admin']
const SUPER_ADMIN_ACCESS = ['super_admin']

// Where someone lands right after logging in.
export function homePathForRole(role) {
  if (STAFF_ROLES.includes(role)) return '/admin'
  if (CUSTOMER_ROLES.includes(role)) return '/customer'
  return '/'
}

export const CUSTOMER_NAV = [
  { label: 'Dashboard', path: '/customer', icon: 'grid' },
  { label: 'My Bookings', path: '/customer/bookings', icon: 'ticket' },
  { label: 'Wishlist', path: '/customer/wishlist', icon: 'heart' },
  { label: 'Messages', path: '/customer/messages', icon: 'message' },
  { label: 'Documents', path: '/customer/documents', icon: 'file' },
  { label: 'My Reviews', path: '/customer/reviews', icon: 'star' },
  { label: 'Profile', path: '/customer/profile', icon: 'user' },
]

export const ADMIN_NAV = [
  {
    heading: 'Overview',
    items: [{ label: 'Dashboard', path: '/admin', icon: 'grid', roles: ADMIN_ACCESS }],
  },
  {
    heading: 'Content',
    items: [
      { label: 'Catalogue', path: '/admin/content', icon: 'layers', roles: ADMIN_ACCESS },
      { label: 'Destinations', path: '/admin/destinations', icon: 'layers', roles: ADMIN_ACCESS },
      { label: 'Activities', path: '/admin/activities', icon: 'layers', roles: ADMIN_ACCESS },
      { label: 'Packages', path: '/admin/packages', icon: 'layers', roles: ADMIN_ACCESS },
      { label: 'Fixed departures', path: '/admin/fixed-departures', icon: 'ticket', roles: ADMIN_ACCESS },
      { label: 'Guides', path: '/admin/guides', icon: 'user', roles: ADMIN_ACCESS },
      { label: 'Media library', path: '/admin/media', icon: 'image', roles: ADMIN_ACCESS },
      { label: 'Events', path: '/admin/events', icon: 'calendar', roles: ADMIN_ACCESS },
      { label: 'Posts', path: '/admin/posts', icon: 'message', roles: ADMIN_ACCESS },
      { label: 'Reviews', path: '/admin/reviews', icon: 'star', roles: ADMIN_ACCESS },
      { label: 'Website', path: '/admin/website', icon: 'layout', roles: ADMIN_ACCESS },
    ],
  },
  {
    heading: 'Operations',
    items: [
      { label: 'Bookings', path: '/admin/bookings', icon: 'ticket', roles: ADMIN_ACCESS },
      { label: 'Inquiries', path: '/admin/inquiries', icon: 'inbox', roles: ADMIN_ACCESS },
    ],
  },
  {
    heading: 'Administration',
    items: [
      { label: 'Users and Roles', path: '/admin/users', icon: 'user', roles: SUPER_ADMIN_ACCESS },
      { label: 'Settings', path: '/admin/settings', icon: 'settings', roles: SUPER_ADMIN_ACCESS },
      { label: 'Audit Log', path: '/admin/audit-log', icon: 'file', roles: ADMIN_ACCESS },
    ],
  },
]

export function adminNavForRole(role) {
  return ADMIN_NAV.map((group) => ({
    ...group,
    items: group.items.filter((item) => item.roles.includes(role)),
  })).filter((group) => group.items.length > 0)
}

export function canAccessAdminPath(role, path) {
  const item = ADMIN_NAV.flatMap((group) => group.items).find((entry) => entry.path === path)
  return Boolean(item && !item.disabled && item.roles.includes(role))
}

// One small inline icon set, so no icon library is needed.
export const NAV_ICONS = {
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  ticket: 'M4 8a2 2 0 012-2h12a2 2 0 012 2v1a2 2 0 000 4v1a2 2 0 01-2 2H6a2 2 0 01-2-2v-1a2 2 0 000-4V8z',
  heart: 'M12 20s-7-4.5-7-9a4 4 0 017-2.6A4 4 0 0119 11c0 4.5-7 9-7 9z',
  message: 'M20 12a7 7 0 01-7 7H8l-4 3v-4a7 7 0 010-12h5a7 7 0 017 6z',
  file: 'M7 3h7l5 5v13H7zM14 3v5h5',
  star: 'M12 4l2.5 5 5.5.8-4 3.9.9 5.5L12 16.6 7.1 19.2l.9-5.5-4-3.9L9.5 9z',
  user: 'M12 12a4 4 0 100-8 4 4 0 000 8zM5 21a7 7 0 0114 0',
  layers: 'M12 3l9 5-9 5-9-5zM3 13l9 5 9-5',
  layout: 'M4 5h16v14H4zM4 10h16M10 10v9',
  inbox: 'M4 13h4l1 3h6l1-3h4M4 13l2-8h12l2 8v6H4z',
  wallet: 'M4 7a2 2 0 012-2h12a2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V7zM4 9h12M16 14h.01',
  settings: 'M12 15a3 3 0 100-6 3 3 0 000 6zM4 12h2M18 12h2M12 4v2M12 18v2M6.3 6.3l1.4 1.4M16.3 16.3l1.4 1.4M17.7 6.3l-1.4 1.4M7.7 16.3l-1.4 1.4',
  image: 'M4 5h16v14H4zM7 15l3-3 3 3 2-2 3 3M8.5 9.5h.01',
  calendar: 'M7 3v4M17 3v4M4 8h16M5 5h14v16H5z',
  search: 'M11 18a7 7 0 100-14 7 7 0 000 14zM16 16l4 4',
}
