import { STAFF_ROLES } from '../../constants/roles.js'
import { PUBLIC_MEDIA_STATUS } from '../../constants/mediaStatuses.js'
import { PUBLIC_EVENT_STATUSES } from '../../constants/eventStatuses.js'
import { parseEnum, parsePagination, parseSearch, searchFilter } from '../../database/publicQuery.js'
import {
  publicGuidesOnly,
  publishedOnly,
  publishedReviewsOnly,
} from '../../database/publicVisibility.js'
import ApiError from '../../utils/ApiError.js'
import Activity from '../activities/activity.model.js'
import Destination from '../destinations/destination.model.js'
import Event from '../events/event.model.js'
import MediaAsset from '../media/mediaAsset.model.js'
import FixedDeparture from '../fixedDepartures/fixedDeparture.model.js'
import Guide from '../guides/guide.model.js'
import Inquiry from '../inquiries/inquiry.model.js'
import Package from '../packages/package.model.js'
import Review from '../reviews/review.model.js'
import User from '../users/user.model.js'

const PUBLIC_TYPES = ['all', 'packages', 'destinations', 'activities', 'guides', 'reviews', 'events', 'media']
const ADMIN_TYPES = ['all', 'packages', 'destinations', 'activities', 'guides', 'reviews', 'events', 'media', 'departures', 'inquiries', 'customers', 'users']

function idOf(value) {
  if (!value) return null
  if (typeof value === 'string') return value
  if (value._id) return String(value._id)
  return String(value)
}

function item(type, record, { title, description = '', url = '', reference = '', status = '', extra = {} } = {}) {
  return {
    id: idOf(record._id || record.id),
    type,
    title,
    description,
    url,
    reference,
    status,
    ...extra,
  }
}

async function limitQuery(query, limit) {
  return query.limit(limit).lean()
}

async function publicSearchGroup(name, q, limit) {
  if (name === 'packages') {
    const rows = await limitQuery(Package.find({ ...publishedOnly(), ...searchFilter(q, ['title', 'region', 'shortDescription', 'overview']) }).select('title slug shortDescription region status'), limit)
    return rows.map((row) => item('package', row, { title: row.title, description: row.shortDescription || row.region, url: `/packages/${row.slug}`, status: row.status }))
  }
  if (name === 'destinations') {
    const rows = await limitQuery(Destination.find({ ...publishedOnly(), ...searchFilter(q, ['title', 'region', 'shortDescription', 'fullDescription']) }).select('title slug shortDescription region status'), limit)
    return rows.map((row) => item('destination', row, { title: row.title, description: row.shortDescription || row.region, url: `/destinations/${row.slug}`, status: row.status }))
  }
  if (name === 'activities') {
    const rows = await limitQuery(Activity.find({ ...publishedOnly(), ...searchFilter(q, ['title', 'category', 'shortDescription', 'fullDescription']) }).select('title slug shortDescription category status'), limit)
    return rows.map((row) => item('activity', row, { title: row.title, description: row.shortDescription || row.category, url: `/things-to-do/${row.slug}`, status: row.status }))
  }
  if (name === 'guides') {
    const rows = await limitQuery(Guide.find({ ...publicGuidesOnly(), ...searchFilter(q, ['fullName', 'guideType', 'regions', 'bio']) }).select('fullName slug guideType regions status'), limit)
    return rows.map((row) => item('guide', row, { title: row.fullName, description: row.guideType || (row.regions || []).join(', '), url: `/guides/${row.slug}`, status: row.status }))
  }
  if (name === 'reviews') {
    const rows = await limitQuery(Review.find({ ...publishedReviewsOnly(), ...searchFilter(q, ['title', 'reviewText']) }).select('title reviewText status rating'), limit)
    return rows.map((row) => item('review', row, { title: row.title, description: row.reviewText, url: '/reviews', status: row.status, extra: { rating: row.rating } }))
  }
  if (name === 'events') {
    const rows = await limitQuery(Event.find({ status: { $in: PUBLIC_EVENT_STATUSES }, ...searchFilter(q, ['title', 'eventType', 'shortDescription', 'venueName']) }).select('title slug shortDescription eventType status'), limit)
    return rows.map((row) => item('event', row, { title: row.title, description: row.shortDescription || row.eventType, url: `/events/${row.slug}`, status: row.status }))
  }
  if (name === 'media') {
    const rows = await limitQuery(MediaAsset.find({ status: PUBLIC_MEDIA_STATUS, type: { $in: ['video', 'reel'] }, ...searchFilter(q, ['title', 'tags', 'caption', 'sourceName']) }).select('title type caption sourceName sourceUrl status'), limit)
    return rows.map((row) => item(row.type, row, { title: row.title, description: row.caption || row.sourceName, url: row.sourceUrl, status: row.status }))
  }
  return []
}

async function adminContentSearchGroup(name, q, limit) {
  if (name === 'packages') {
    const rows = await limitQuery(Package.find(searchFilter(q, ['title', 'region', 'shortDescription', 'overview'])).select('title shortDescription region status'), limit)
    return rows.map((row) => item('package', row, { title: row.title, description: row.shortDescription || row.region, url: '/admin/packages', status: row.status }))
  }
  if (name === 'destinations') {
    const rows = await limitQuery(Destination.find(searchFilter(q, ['title', 'region', 'shortDescription', 'fullDescription'])).select('title shortDescription region status'), limit)
    return rows.map((row) => item('destination', row, { title: row.title, description: row.shortDescription || row.region, url: '/admin/destinations', status: row.status }))
  }
  if (name === 'activities') {
    const rows = await limitQuery(Activity.find(searchFilter(q, ['title', 'category', 'shortDescription', 'fullDescription'])).select('title shortDescription category status'), limit)
    return rows.map((row) => item('activity', row, { title: row.title, description: row.shortDescription || row.category, url: '/admin/activities', status: row.status }))
  }
  if (name === 'guides') {
    const rows = await limitQuery(Guide.find(searchFilter(q, ['fullName', 'guideType', 'regions', 'bio'])).select('fullName guideType regions status'), limit)
    return rows.map((row) => item('guide', row, { title: row.fullName, description: row.guideType || (row.regions || []).join(', '), url: '/admin/guides', status: row.status }))
  }
  if (name === 'reviews') {
    const rows = await limitQuery(Review.find(searchFilter(q, ['title', 'reviewText'])).select('title reviewText status rating'), limit)
    return rows.map((row) => item('review', row, { title: row.title, description: row.reviewText, url: '/admin/reviews', status: row.status, extra: { rating: row.rating } }))
  }
  if (name === 'events') {
    const rows = await limitQuery(Event.find(searchFilter(q, ['title', 'eventType', 'shortDescription', 'venueName'])).select('title shortDescription eventType status'), limit)
    return rows.map((row) => item('event', row, { title: row.title, description: row.shortDescription || row.eventType, url: '/admin/events', status: row.status }))
  }
  if (name === 'media') {
    const rows = await limitQuery(MediaAsset.find(searchFilter(q, ['title', 'tags', 'caption', 'sourceName'])).select('title type caption sourceName status'), limit)
    return rows.map((row) => item(row.type || 'media', row, { title: row.title, description: row.caption || row.sourceName, url: '/admin/media', status: row.status }))
  }
  return []
}

export async function publicSearch(query, config) {
  const q = parseSearch(query.q || query.search)
  if (!q) return { items: [], meta: { q: '', type: 'all', total: 0 } }
  const type = parseEnum(query.type, 'type', PUBLIC_TYPES) || 'all'
  const { limit } = parsePagination(query, config)
  const groups = type === 'all' ? PUBLIC_TYPES.filter((entry) => entry !== 'all') : [type]
  const nested = await Promise.all(groups.map((group) => publicSearchGroup(group, q, limit)))
  const items = nested.flat().slice(0, limit)
  return { items, meta: { q, type, total: items.length } }
}

function adminAllowedGroups(role, requested) {
  if (!STAFF_ROLES.includes(role)) throw ApiError.forbidden('You do not have access to that.')
  const ordinaryContent = ['packages', 'destinations', 'activities', 'guides', 'reviews', 'events', 'media']
  const operations = ['departures', 'inquiries']
  let allowed = []
  if (['admin', 'super_admin'].includes(role)) allowed.push(...ordinaryContent, ...operations, 'customers')
  if (role === 'super_admin') allowed.push('users')
  allowed = [...new Set(allowed)]
  if (requested === 'all') return allowed
  return allowed.includes(requested) ? [requested] : []
}

async function adminSearchGroup(name, q, limit) {
  if (['packages', 'destinations', 'activities', 'guides', 'reviews', 'events', 'media'].includes(name)) {
    return adminContentSearchGroup(name, q, limit)
  }
  if (name === 'departures') {
    const rows = await limitQuery(FixedDeparture.find(searchFilter(q, ['title', 'status'])).select('title status startDate endDate'), limit)
    return rows.map((row) => item('departure', row, { title: row.title, description: `${row.startDate?.toISOString?.().slice(0, 10) || ''} to ${row.endDate?.toISOString?.().slice(0, 10) || ''}`, url: '/admin/fixed-departures', status: row.status }))
  }
  if (name === 'inquiries') {
    const rows = await limitQuery(Inquiry.find(searchFilter(q, ['referenceCode', 'contact.fullName', 'contact.email', 'contact.phone', 'contact.whatsapp', 'subject'])).select('referenceCode contact.fullName contact.email subject status createdAt'), limit)
    return rows.map((row) => item('inquiry', row, { title: row.contact?.fullName || row.referenceCode, description: row.subject || row.contact?.email || '', reference: row.referenceCode, url: '/admin/inquiries', status: row.status }))
  }
  if (name === 'customers' || name === 'users') {
    const roleFilter = name === 'customers' ? { role: 'customer' } : {}
    const rows = await limitQuery(User.find({ ...roleFilter, ...searchFilter(q, ['fullName', 'email']) }).select('fullName email role status'), limit)
    return rows.map((row) => item(name === 'customers' ? 'customer' : 'user', row, { title: row.fullName, description: row.email, url: '/admin/users', status: row.status, extra: { role: row.role } }))
  }
  return []
}

export async function adminGlobalSearch(query, config, role) {
  const q = parseSearch(query.q || query.search)
  if (!q) return { items: [], meta: { q: '', type: 'all', total: 0 } }
  const type = parseEnum(query.type, 'type', ADMIN_TYPES) || 'all'
  const { limit } = parsePagination(query, config)
  const groups = adminAllowedGroups(role, type)
  const nested = await Promise.all(groups.map((group) => adminSearchGroup(group, q, limit)))
  const items = nested.flat().slice(0, limit)
  return { items, meta: { q, type, total: items.length, role } }
}
