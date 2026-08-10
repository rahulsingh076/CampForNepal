// Navigation menus for the public site, the customer dashboard and the admin panel.
const mainMenu = [
  {
    label: 'Explore Nepal',
    path: '/destinations',
    children: [
      { label: 'Destinations', path: '/destinations', children: [] },
      { label: 'Things To Do', path: '/things-to-do', children: [] },
      { label: 'Travel Info', path: '/travel-info', children: [] },
    ],
  },
  {
    label: 'Trips',
    path: '/packages',
    children: [
      { label: 'All Trips', path: '/packages', children: [] },
      { label: 'Trekking', path: '/trekking', children: [] },
      { label: 'Expeditions', path: '/expeditions', children: [] },
      { label: 'Fixed Departures', path: '/fixed-departures', children: [] },
    ],
  },
  {
    label: 'Plan',
    path: '/plan-your-trip',
    children: [
      { label: 'Our Guides', path: '/guides', children: [] },
      { label: 'Custom Trip', path: '/custom-trip', children: [] },
      { label: 'Plan Your Trip', path: '/plan-your-trip', children: [] },
    ],
  },
  {
    label: 'Stories',
    path: '/blog',
    children: [
      { label: 'Blog and Updates', path: '/blog', children: [] },
      { label: 'Events', path: '/events', children: [] },
      { label: 'Reviews', path: '/reviews', children: [] },
    ],
  },
  {
    label: 'Company',
    path: '/about',
    children: [
      { label: 'About', path: '/about', children: [] },
      { label: 'Certificates', path: '/certificates', children: [] },
      { label: 'Contact', path: '/contact', children: [] },
    ],
  },
]

const globalAction = { label: 'Plan My Trip', path: '/custom-trip' }

const customerMenu = [
  { label: 'Dashboard', path: '/customer', children: [] },
  { label: 'My Bookings', path: '/customer/bookings', children: [] },
  { label: 'My Inquiries', path: '/customer/messages', children: [] },
  { label: 'Saved Trips', path: '/customer/wishlist', children: [] },
  { label: 'My Reviews', path: '/customer/reviews', children: [] },
  { label: 'Travel Documents', path: '/customer/documents', children: [] },
  { label: 'Profile', path: '/customer/profile', children: [] },
]

const adminMenu = [
  {
    label: 'Overview',
    path: '/admin',
    children: [],
  },
  {
    label: 'Bookings',
    path: '/admin/bookings',
    children: [],
  },
  {
    label: 'Inquiries',
    path: '/admin/inquiries',
    children: [],
  },
  {
    label: 'Catalogue',
    path: '/admin/content',
    children: [
      { label: 'Packages', path: '/admin/packages', children: [] },
      { label: 'Destinations', path: '/admin/destinations', children: [] },
      { label: 'Activities', path: '/admin/activities', children: [] },
      { label: 'Fixed Departures', path: '/admin/fixed-departures', children: [] },
      { label: 'Media Library', path: '/admin/media', children: [] },
      { label: 'Events', path: '/admin/events', children: [] },
    ],
  },
  {
    label: 'Guides',
    path: '/admin/guides',
    children: [],
  },
  {
    label: 'Content',
    path: '/admin/content',
    children: [
      { label: 'Homepage', path: '/admin/website/homepage', children: [] },
      { label: 'Blog Posts', path: '/admin/posts', children: [] },
      { label: 'Travel Updates', path: '/admin/posts', children: [] },
      { label: 'Travel Info Pages', path: '/admin/website/travel-info', children: [] },
      { label: 'Certificates', path: '/admin/website/certificates', children: [] },
      { label: 'Menus', path: '/admin/website/menu', children: [] },
      { label: 'Footer', path: '/admin/website/footer', children: [] },
    ],
  },
  {
    label: 'Reviews',
    path: '/admin/reviews',
    children: [],
  },
  {
    label: 'Users',
    path: '/admin/users',
    children: [],
  },
  {
    label: 'Settings',
    path: '/admin/settings',
    children: [
      { label: 'Contact Details', path: '/admin/website/contact', children: [] },
      { label: 'Languages', path: '/admin/settings', children: [] },
      { label: 'Currencies', path: '/admin/settings', children: [] },
      { label: 'Audit Log', path: '/admin/audit-log', children: [] },
    ],
  },
]

const menu = { mainMenu, customerMenu, adminMenu, globalAction }

export { mainMenu, customerMenu, adminMenu, globalAction }
export default menu
