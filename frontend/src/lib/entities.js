// The one place seed files are imported. Everything else goes through dataClient.
import activities from '../data/activities.js'
import auditLogs from '../data/auditLogs.js'
import blogPosts from '../data/blogPosts.js'
import bookings from '../data/bookings.js'
import certificates from '../data/certificates.js'
import cmsHomepage from '../data/cmsHomepage.js'
import contactDetails from '../data/contactDetails.js'
import countries from '../data/countries.js'
import currencies from '../data/currencies.js'
import destinations from '../data/destinations.js'
import events from '../data/events.js'
import fixedDepartures from '../data/fixedDepartures.js'
import footer from '../data/footer.js'
import guides from '../data/guides.js'
import inquiries from '../data/inquiries.js'
import languages from '../data/languages.js'
import mediaAssets from '../data/mediaAssets.js'
import menu from '../data/menu.js'
import messageThreads from '../data/messageThreads.js'
import notifications from '../data/notifications.js'
import notificationTemplates from '../data/notificationTemplates.js'
import packages from '../data/packages.js'
import planYourTripPage from '../data/planYourTripPage.js'
import reviews from '../data/reviews.js'
import sitePages from '../data/sitePages.js'
import siteSettings from '../data/siteSettings.js'
import travelInfoPages from '../data/travelInfoPages.js'
import travelUpdates from '../data/travelUpdates.js'
import users from '../data/users.js'

// idPrefix is used when creating a new record, e.g. pkg-014.
// idField says which property identifies a row — the three reference lists are
// keyed by their standard code rather than a generated id.
export const COLLECTIONS = {
  countries: { seed: countries, idField: 'countryCode', label: 'Country' },
  languages: { seed: languages, idField: 'code', label: 'Language' },
  currencies: { seed: currencies, idField: 'code', label: 'Currency' },
  destinations: { seed: destinations, idPrefix: 'dest', label: 'Destination' },
  activities: { seed: activities, idPrefix: 'act', label: 'Activity' },
  packages: { seed: packages, idPrefix: 'pkg', label: 'Package' },
  fixedDepartures: { seed: fixedDepartures, idPrefix: 'dep', label: 'Fixed departure' },
  guides: { seed: guides, idPrefix: 'guide', label: 'Guide' },
  mediaAssets: { seed: mediaAssets, idPrefix: 'media', label: 'Media asset' },
  events: { seed: events, idPrefix: 'event', label: 'Event' },
  reviews: { seed: reviews, idPrefix: 'rev', label: 'Review' },
  blogPosts: { seed: blogPosts, idPrefix: 'post', label: 'Blog post' },
  travelUpdates: { seed: travelUpdates, idPrefix: 'upd', label: 'Travel update' },
  travelInfoPages: { seed: travelInfoPages, idPrefix: 'info', label: 'Travel info page' },
  certificates: { seed: certificates, idPrefix: 'cert', label: 'Certificate' },
  users: { seed: users, idPrefix: 'user', label: 'User' },
  bookings: { seed: bookings, idPrefix: 'bkg', label: 'Booking' },
  inquiries: { seed: inquiries, idPrefix: 'inq', label: 'Inquiry' },
  messageThreads: { seed: messageThreads, idPrefix: 'thr', label: 'Message thread' },
  notifications: { seed: notifications, idPrefix: 'notif', label: 'Notification' },
  auditLogs: { seed: auditLogs, idPrefix: 'log', label: 'Audit log' },
}

// Single objects rather than lists — the CMS content.
export const SINGLETONS = {
  cmsHomepage: { seed: cmsHomepage, label: 'Homepage content' },
  menu: { seed: menu, label: 'Navigation menu' },
  footer: { seed: footer, label: 'Footer' },
  contactDetails: { seed: contactDetails, label: 'Contact details' },
  sitePages: { seed: sitePages, label: 'Static pages' },
  siteSettings: { seed: siteSettings, label: 'Site settings' },
  notificationTemplates: { seed: notificationTemplates, label: 'Notification templates' },
  planYourTripPage: { seed: planYourTripPage, label: 'Plan your trip page' },
}
