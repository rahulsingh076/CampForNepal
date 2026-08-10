// Every route in one place. The router, the sidebars, and the placeholder
// pages are all built from this list, so a path is only ever written once.

export const PUBLIC_ROUTES = [
  { path: '/', file: 'Home', title: 'Home' },
  { path: '/destinations', file: 'Destinations', title: 'Destinations' },
  { path: '/destinations/:slug', file: 'DestinationDetail', title: 'Destination' },
  { path: '/things-to-do', file: 'ThingsToDo', title: 'Things To Do' },
  { path: '/things-to-do/:slug', file: 'ActivityDetail', title: 'Activity' },
  { path: '/packages', file: 'Packages', title: 'Packages' },
  { path: '/packages/:slug', file: 'PackageDetail', title: 'Package' },
  { path: '/trekking', file: 'Trekking', title: 'Trekking' },
  { path: '/trekking/:slug', file: 'TrekkingDetail', title: 'Trek' },
  { path: '/expeditions', file: 'Expeditions', title: 'Expeditions' },
  { path: '/expeditions/:slug', file: 'ExpeditionDetail', title: 'Expedition' },
  { path: '/fixed-departures', file: 'FixedDepartures', title: 'Fixed Departures' },
  { path: '/guides', file: 'Guides', title: 'Our Guides' },
  { path: '/guides/:slug', file: 'GuideDetail', title: 'Guide' },
  { path: '/custom-trip', file: 'CustomTrip', title: 'Custom Trip' },
  { path: '/plan-your-trip', file: 'PlanYourTrip', title: 'Plan Your Trip' },
  { path: '/blog', file: 'Blog', title: 'Blog and Updates' },
  { path: '/blog/:slug', file: 'BlogDetail', title: 'Article' },
  { path: '/events', file: 'Events', title: 'Events' },
  { path: '/events/:slug', file: 'EventDetail', title: 'Event' },
  { path: '/reviews', file: 'Reviews', title: 'Reviews' },
  { path: '/about', file: 'About', title: 'About Us' },
  { path: '/certificates', file: 'Certificates', title: 'Certificates' },
  { path: '/travel-info', file: 'TravelInfo', title: 'Travel Info' },
  { path: '/travel-info/:slug', file: 'TravelInfoDetail', title: 'Travel Info' },
  { path: '/contact', file: 'Contact', title: 'Contact' },
  { path: '/login', file: 'Login', title: 'Log In' },
  { path: '/register', file: 'Register', title: 'Create Account' },
  // The editable static pages all reuse the same CMS record. The legacy path
  // remains reachable, while new links use the explicit Cancellation Policy URL.
  { path: '/terms-and-conditions', file: 'Terms', title: 'Terms and Conditions' },
  { path: '/privacy-policy', file: 'PrivacyPolicy', title: 'Privacy Policy' },
  { path: '/cancellation-policy', file: 'BookingPolicy', title: 'Cancellation Policy' },
  { path: '/booking-policy', file: 'BookingPolicy', title: 'Cancellation Policy' },
]

export const CUSTOMER_ROUTES = [
  { path: '/customer', file: 'Dashboard', title: 'Dashboard' },
  { path: '/customer/bookings', file: 'Bookings', title: 'My Bookings' },
  { path: '/customer/bookings/:id', file: 'BookingDetail', title: 'Booking' },
  { path: '/customer/wishlist', file: 'Wishlist', title: 'Wishlist' },
  { path: '/customer/messages', file: 'Messages', title: 'Messages' },
  { path: '/customer/documents', file: 'Documents', title: 'Documents' },
  { path: '/customer/reviews', file: 'Reviews', title: 'My Reviews' },
  { path: '/customer/profile', file: 'Profile', title: 'Profile' },
  { path: '/customer/notifications', file: 'Notifications', title: 'Notifications' },
]

const ADMIN_ROLES = ['admin', 'super_admin']
const SUPER_ADMIN_ROLES = ['super_admin']

export const ADMIN_ROUTES = [
  { path: '/admin', file: 'Dashboard', title: 'Admin Dashboard', roles: ADMIN_ROLES },
  { path: '/admin/content', file: 'Content', title: 'Content', roles: ADMIN_ROLES },
  { path: '/admin/destinations', file: 'Destinations', title: 'Destinations', roles: ADMIN_ROLES },
  { path: '/admin/activities', file: 'Activities', title: 'Activities', roles: ADMIN_ROLES },
  { path: '/admin/packages', file: 'Packages', title: 'Packages', roles: ADMIN_ROLES },
  { path: '/admin/fixed-departures', file: 'FixedDepartures', title: 'Fixed Departures', roles: ADMIN_ROLES },
  { path: '/admin/guides', file: 'Guides', title: 'Guides', roles: ADMIN_ROLES },
  { path: '/admin/media', file: 'MediaLibrary', title: 'Media Library', roles: ADMIN_ROLES },
  { path: '/admin/events', file: 'Events', title: 'Events', roles: ADMIN_ROLES },
  { path: '/admin/posts', file: 'Posts', title: 'Posts', roles: ADMIN_ROLES },
  { path: '/admin/bookings', file: 'Bookings', title: 'Bookings', roles: ADMIN_ROLES },
  { path: '/admin/bookings/:id', file: 'BookingDetail', title: 'Booking detail', roles: ADMIN_ROLES },
  { path: '/admin/inquiries', file: 'Inquiries', title: 'Inquiries', roles: ADMIN_ROLES },
  { path: '/admin/notifications', file: 'Notifications', title: 'Notifications', roles: ADMIN_ROLES },
  { path: '/admin/website', file: 'Website', title: 'Website Builder', roles: ADMIN_ROLES },
  { path: '/admin/website/homepage', file: 'WebsiteHomepage', title: 'Homepage', roles: ADMIN_ROLES },
  { path: '/admin/website/menu', file: 'WebsiteMenu', title: 'Menu', roles: ADMIN_ROLES },
  { path: '/admin/website/footer', file: 'WebsiteFooter', title: 'Footer', roles: ADMIN_ROLES },
  { path: '/admin/website/pages', file: 'WebsitePages', title: 'Static pages', roles: ADMIN_ROLES },
  { path: '/admin/website/contact', file: 'WebsiteContact', title: 'Contact', roles: ADMIN_ROLES },
  { path: '/admin/website/certificates', file: 'WebsiteCertificates', title: 'Certificates', roles: ADMIN_ROLES },
  { path: '/admin/website/travel-info', file: 'WebsiteTravelInfo', title: 'Travel information', roles: ADMIN_ROLES },
  { path: '/admin/reviews', file: 'Reviews', title: 'Reviews', roles: ADMIN_ROLES },
  { path: '/admin/users', file: 'Users', title: 'Users and Roles', roles: SUPER_ADMIN_ROLES },
  { path: '/admin/settings', file: 'Settings', title: 'Settings', roles: SUPER_ADMIN_ROLES },
  { path: '/admin/audit-log', file: 'AuditLog', title: 'Audit Log', roles: ADMIN_ROLES },
]

// Paths that are neither public pages nor inside a dashboard. The router
// declares these individually; listing them here keeps ALL_PATHS complete for
// link and navigation checks.
export const STANDALONE_ROUTES = {
  welcome: '/welcome',
  adminLogin: '/admin/login',
  designPreview: '/design-preview',
}

// Routes that must never be indexed: private areas, sign-in pages, and the
// development-only design preview. Matched as prefixes.
export const NOINDEX_PREFIXES = ['/customer', '/admin', '/login', '/register', '/welcome', '/design-preview']

// Every path the app answers to, for checking that nav data does not 404.
export const ALL_PATHS = [
  ...PUBLIC_ROUTES.map((route) => route.path),
  ...CUSTOMER_ROUTES.map((route) => route.path),
  ...ADMIN_ROUTES.map((route) => route.path),
  ...Object.values(STANDALONE_ROUTES),
]
