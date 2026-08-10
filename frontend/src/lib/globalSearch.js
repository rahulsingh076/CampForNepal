import { matchesText } from './queryList.js'

export const PUBLIC_SEARCH_TYPES = [
  { value: 'all', label: 'All' },
  { value: 'package', label: 'Packages' },
  { value: 'destination', label: 'Places' },
  { value: 'activity', label: 'Activities' },
  { value: 'guide', label: 'Guides' },
  { value: 'post', label: 'Stories' },
  { value: 'event', label: 'Events' },
  { value: 'media', label: 'Videos' },
]

export const ADMIN_SEARCH_TYPES = [
  { value: 'all', label: 'All allowed' },
  { value: 'booking', label: 'Bookings' },
  { value: 'inquiry', label: 'Inquiries' },
  { value: 'customer', label: 'Customers' },
  { value: 'conversation', label: 'Chats' },
  { value: 'package', label: 'Packages' },
  { value: 'destination', label: 'Places' },
  { value: 'activity', label: 'Activities' },
  { value: 'guide', label: 'Guides' },
  { value: 'post', label: 'Posts' },
  { value: 'event', label: 'Events' },
  { value: 'media', label: 'Media' },
  { value: 'user', label: 'Users' },
]

function result(type, item, fields) {
  return {
    id: `${type}-${item.id}`,
    type,
    title: fields.title,
    description: fields.description || '',
    reference: fields.reference || '',
    url: fields.url || '',
  }
}

export function buildPublicSearchResults(collections, query, type = 'all') {
  if (!query.trim()) return []
  const rows = []

  collections.packages.items
    .filter((item) => item.status === 'published' && matchesText(query, [item.title, item.region, item.shortDescription, item.overview]))
    .forEach((item) => rows.push(result('package', item, { title: item.title, description: item.shortDescription, url: `/packages/${item.slug}` })))
  collections.destinations.items
    .filter((item) => item.status === 'published' && matchesText(query, [item.title, item.region, item.shortDescription, item.fullDescription]))
    .forEach((item) => rows.push(result('destination', item, { title: item.title, description: item.shortDescription, url: `/destinations/${item.slug}` })))
  collections.activities.items
    .filter((item) => item.status === 'published' && matchesText(query, [item.title, item.category, item.shortDescription, item.fullDescription]))
    .forEach((item) => rows.push(result('activity', item, { title: item.title, description: item.shortDescription, url: `/things-to-do/${item.slug}` })))
  collections.guides.items
    .filter((item) => item.status === 'published' && item.publicProfile && matchesText(query, [item.fullName, item.guideType, item.bio, item.regions]))
    .forEach((item) => rows.push(result('guide', item, { title: item.fullName, description: item.bio, url: `/guides/${item.slug}` })))
  ;[...collections.blogPosts.items, ...collections.travelUpdates.items]
    .filter((item) => item.status === 'published' && matchesText(query, [item.title, item.excerpt, item.summary, item.content, item.category]))
    .forEach((item) => rows.push(result('post', item, { title: item.title, description: item.excerpt || item.summary, url: `/blog/${item.slug}` })))
  collections.events.items
    .filter((item) => ['published', 'cancelled', 'completed'].includes(item.status) && matchesText(query, [item.title, item.eventType, item.shortDescription, item.fullDescription, item.venueName]))
    .forEach((item) => rows.push(result('event', item, { title: item.title, description: item.shortDescription, url: `/events/${item.slug}` })))
  collections.mediaAssets.items
    .filter((item) => item.status === 'published' && ['video', 'reel'].includes(item.type) && matchesText(query, [item.title, item.caption, item.tags, item.sourceName]))
    .forEach((item) => rows.push(result('media', item, { title: item.title, description: item.caption || item.sourceName, url: item.sourceUrl })))

  return rows.filter((item) => type === 'all' || item.type === type)
}

export function allowedAdminSearchTypes(role) {
  const content = ['package', 'destination', 'activity', 'guide', 'post', 'event', 'media']
  const operations = ['booking', 'inquiry', 'conversation']
  const allowed = []
  if (['admin', 'super_admin'].includes(role)) allowed.push(...content, ...operations, 'customer')
  if (role === 'super_admin') allowed.push('user')
  return new Set(allowed)
}

function pushIf(results, allowed, wanted, type, item, fields) {
  if (!allowed.has(type)) return
  if (wanted !== 'all' && wanted !== type) return
  results.push(result(type, item, fields))
}

export function buildAdminSearchResults(collections, query, type = 'all', role) {
  if (!query.trim()) return []
  const allowed = allowedAdminSearchTypes(role)
  const rows = []

  collections.bookings.items
    .filter((item) => matchesText(query, [item.reference, item.leadTraveller?.fullName, item.leadTraveller?.email, item.leadTraveller?.phone, item.status]))
    .forEach((item) => pushIf(rows, allowed, type, 'booking', item, { title: item.reference, description: item.leadTraveller?.fullName || item.status, reference: item.reference, url: `/admin/bookings/${item.id}` }))
  collections.inquiries.items
    .filter((item) => matchesText(query, [item.reference, item.fullName, item.email, item.phone, item.whatsapp, item.subject, item.message, item.status]))
    .forEach((item) => pushIf(rows, allowed, type, 'inquiry', item, { title: item.fullName, description: item.subject || item.email, reference: item.reference, url: '/admin/inquiries' }))
  collections.messageThreads.items
    .filter((item) => matchesText(query, [item.subject, item.lastMessage, item.status, item.userId, item.relatedBookingId]))
    .forEach((item) => pushIf(rows, allowed, type, 'conversation', item, { title: item.subject || item.id, description: item.lastMessage, url: '/admin/inquiries' }))
  collections.users.items
    .filter((item) => item.role === 'customer' && matchesText(query, [item.fullName, item.email, item.phone, item.status]))
    .forEach((item) => pushIf(rows, allowed, type, 'customer', item, { title: item.fullName, description: item.email, url: '/admin/users' }))
  collections.users.items
    .filter((item) => matchesText(query, [item.fullName, item.email, item.role, item.status]))
    .forEach((item) => pushIf(rows, allowed, type, 'user', item, { title: item.fullName, description: `${item.email} - ${item.role}`, url: '/admin/users' }))
  collections.packages.items
    .filter((item) => matchesText(query, [item.title, item.region, item.shortDescription, item.status]))
    .forEach((item) => pushIf(rows, allowed, type, 'package', item, { title: item.title, description: item.shortDescription, url: '/admin/packages' }))
  collections.destinations.items
    .filter((item) => matchesText(query, [item.title, item.region, item.shortDescription, item.status]))
    .forEach((item) => pushIf(rows, allowed, type, 'destination', item, { title: item.title, description: item.shortDescription, url: '/admin/destinations' }))
  collections.activities.items
    .filter((item) => matchesText(query, [item.title, item.category, item.shortDescription, item.status]))
    .forEach((item) => pushIf(rows, allowed, type, 'activity', item, { title: item.title, description: item.shortDescription, url: '/admin/activities' }))
  collections.guides.items
    .filter((item) => matchesText(query, [item.fullName, item.guideType, item.regions, item.status]))
    .forEach((item) => pushIf(rows, allowed, type, 'guide', item, { title: item.fullName, description: item.guideType, url: '/admin/guides' }))
  ;[...collections.blogPosts.items, ...collections.travelUpdates.items]
    .filter((item) => matchesText(query, [item.title, item.category, item.excerpt, item.summary, item.status]))
    .forEach((item) => pushIf(rows, allowed, type, 'post', item, { title: item.title, description: item.excerpt || item.summary, url: '/admin/posts' }))
  collections.events.items
    .filter((item) => matchesText(query, [item.title, item.eventType, item.shortDescription, item.venueName, item.status]))
    .forEach((item) => pushIf(rows, allowed, type, 'event', item, { title: item.title, description: item.shortDescription, url: '/admin/events' }))
  collections.mediaAssets.items
    .filter((item) => matchesText(query, [item.title, item.tags, item.type, item.sourceName, item.sourceReference, item.licence, item.status]))
    .forEach((item) => pushIf(rows, allowed, type, 'media', item, { title: item.title, description: `${item.type} - ${item.sourceType}`, url: '/admin/media' }))

  return rows
}
