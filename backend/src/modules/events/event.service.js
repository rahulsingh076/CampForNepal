import {
  EVENT_STATUSES,
  PUBLIC_EVENT_STATUSES,
} from '../../constants/eventStatuses.js'
import {
  buildPageMeta,
  parseBoolean,
  parseDateRange,
  parseEnum,
  parsePagination,
  parseSearch,
  parseSort,
  searchFilter,
  sortToObject,
} from '../../database/publicQuery.js'
import { DESTINATION_SUMMARY_FIELDS, PACKAGE_SUMMARY_FIELDS } from '../../database/publicVisibility.js'
import ApiError from '../../utils/ApiError.js'
import { toPlainText } from '../../utils/plainText.js'
import Event from './event.model.js'
import { serializeAdminEvent, serializePublicEvent } from './event.serializer.js'

const SORTABLE = ['title', 'startDateTime', 'createdAt', 'updatedAt']
const SEARCH_FIELDS = ['title', 'eventType', 'shortDescription', 'fullDescription', 'venueName', 'address']
const PUBLIC_FIELDS = 'title slug eventType shortDescription fullDescription startDateTime endDateTime timezone venueName address mapLink organizer coverMedia gallery videos relatedPackageIds relatedDestinationIds ctaLabel ctaLink status featured seo createdAt updatedAt'

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function cleanString(value, limit = 1000) {
  return typeof value === 'string' ? toPlainText(value).slice(0, limit) : ''
}

function cleanDate(value, field) {
  if (value === undefined || value === null || value === '') return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) throw ApiError.badRequest(`${field} must be a valid date/time.`)
  return parsed
}

function cleanIds(value) {
  return Array.isArray(value) ? value.filter((item) => typeof item === 'string' && item) : []
}

function cleanSeo(value = {}) {
  return {
    metaTitle: cleanString(value.metaTitle, 200),
    metaDescription: cleanString(value.metaDescription, 400),
    keywords: Array.isArray(value.keywords) ? value.keywords.map((item) => cleanString(item, 80)).filter(Boolean) : [],
  }
}

export function cleanEventPayload(body = {}, { create = false } = {}) {
  const has = (field) => Object.prototype.hasOwnProperty.call(body, field)
  const title = cleanString(body.title, 200)
  if (create && !title) throw ApiError.badRequest('An event title is required.')
  const startDateTime = body.startDateTime !== undefined
    ? cleanDate(body.startDateTime, 'startDateTime')
    : undefined
  if (create && !startDateTime) throw ApiError.badRequest('An event start date/time is required.')

  const payload = {
    ...(title ? { title } : {}),
    ...(has('slug') || title ? { slug: slugify(body.slug || title) } : {}),
    ...(has('eventType') || create ? { eventType: cleanString(body.eventType, 120) } : {}),
    ...(has('shortDescription') || create ? { shortDescription: cleanString(body.shortDescription, 600) } : {}),
    ...(has('fullDescription') || create ? { fullDescription: cleanString(body.fullDescription, 20000) } : {}),
    ...(startDateTime !== undefined ? { startDateTime } : {}),
    ...(has('endDateTime') ? { endDateTime: cleanDate(body.endDateTime, 'endDateTime') } : {}),
    ...(has('timezone') || create ? { timezone: cleanString(body.timezone, 80) || 'Asia/Kathmandu' } : {}),
    ...(has('venueName') || create ? { venueName: cleanString(body.venueName, 200) } : {}),
    ...(has('address') || create ? { address: cleanString(body.address, 500) } : {}),
    ...(has('mapLink') || create ? { mapLink: cleanString(body.mapLink, 1000) } : {}),
    ...(has('organizer') || create ? { organizer: cleanString(body.organizer, 200) } : {}),
    ...(has('coverMedia') || create ? { coverMedia: body.coverMedia || null } : {}),
    ...(has('gallery') || create ? { gallery: Array.isArray(body.gallery) ? body.gallery : [] } : {}),
    ...(has('videos') || create ? { videos: Array.isArray(body.videos) ? body.videos : [] } : {}),
    ...(has('relatedPackageIds') || create ? { relatedPackageIds: cleanIds(body.relatedPackageIds) } : {}),
    ...(has('relatedDestinationIds') || create ? { relatedDestinationIds: cleanIds(body.relatedDestinationIds) } : {}),
    ...(has('ctaLabel') || create ? { ctaLabel: cleanString(body.ctaLabel, 100) } : {}),
    ...(has('ctaLink') || create ? { ctaLink: cleanString(body.ctaLink, 500) } : {}),
    ...(has('status') || create ? { status: cleanString(body.status || 'draft', 40) } : {}),
    ...(has('featured') || create ? { featured: Boolean(body.featured) } : {}),
    ...(has('seo') || create ? { seo: cleanSeo(body.seo) } : {}),
  }

  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined))
}

function buildPublicFilter(query) {
  const filter = { status: { $in: PUBLIC_EVENT_STATUSES } }
  const search = parseSearch(query.search || query.q)
  if (search) Object.assign(filter, searchFilter(search, SEARCH_FIELDS))
  if (query.eventType) filter.eventType = String(query.eventType).slice(0, 120)
  const featured = parseBoolean(query.featured, 'featured')
  if (featured !== undefined) filter.featured = featured
  const dateRange = parseDateRange(query.dateFrom, query.dateTo)
  if (dateRange) filter.startDateTime = dateRange
  return filter
}

function buildAdminFilter(query) {
  const filter = {}
  const search = parseSearch(query.search || query.q)
  if (search) Object.assign(filter, searchFilter(search, SEARCH_FIELDS))
  const status = parseEnum(query.status, 'status', EVENT_STATUSES)
  if (status) filter.status = status
  if (query.eventType) filter.eventType = String(query.eventType).slice(0, 120)
  const featured = parseBoolean(query.featured, 'featured')
  if (featured !== undefined) filter.featured = featured
  const dateRange = parseDateRange(query.dateFrom, query.dateTo)
  if (dateRange) filter.startDateTime = dateRange
  return filter
}

function populateEvent(query) {
  return query
    .populate({ path: 'relatedPackageIds', select: PACKAGE_SUMMARY_FIELDS })
    .populate({ path: 'relatedDestinationIds', select: DESTINATION_SUMMARY_FIELDS })
}

export async function listPublicEvents(query, config) {
  const { page, limit, skip } = parsePagination(query, config)
  const sort = parseSort(query.sort, SORTABLE, 'startDateTime')
  const filter = buildPublicFilter(query)
  const [items, total] = await Promise.all([
    populateEvent(Event.find(filter).select(PUBLIC_FIELDS).sort(sortToObject(sort)).skip(skip).limit(limit)),
    Event.countDocuments(filter),
  ])
  return {
    items: items.map(serializePublicEvent),
    meta: { ...buildPageMeta({ page, limit, total }), sort },
  }
}

export async function getPublicEvent(slug) {
  const event = await populateEvent(Event.findOne({ slug: String(slug).toLowerCase(), status: { $in: PUBLIC_EVENT_STATUSES } }).select(PUBLIC_FIELDS))
  if (!event) throw ApiError.notFound('Event not found.')
  return serializePublicEvent(event)
}

export async function listAdminEvents(query, config) {
  const { page, limit, skip } = parsePagination(query, config)
  const sort = parseSort(query.sort, SORTABLE, '-startDateTime')
  const filter = buildAdminFilter(query)
  const [items, total] = await Promise.all([
    populateEvent(Event.find(filter).sort(sortToObject(sort)).skip(skip).limit(limit)),
    Event.countDocuments(filter),
  ])
  return {
    items: items.map(serializeAdminEvent),
    meta: { ...buildPageMeta({ page, limit, total }), sort },
  }
}

export async function getAdminEvent(id) {
  const event = await populateEvent(Event.findById(id))
  if (!event) throw ApiError.notFound('Event not found.')
  return serializeAdminEvent(event)
}

export async function createEvent(body) {
  const event = await Event.create(cleanEventPayload(body, { create: true }))
  return serializeAdminEvent(event)
}

export async function updateEvent(id, body) {
  const event = await Event.findByIdAndUpdate(id, { $set: cleanEventPayload(body) }, { new: true, runValidators: true })
  if (!event) throw ApiError.notFound('Event not found.')
  return serializeAdminEvent(event)
}

export async function deleteEvent(id) {
  const event = await Event.findByIdAndDelete(id)
  if (!event) throw ApiError.notFound('Event not found.')
  return serializeAdminEvent(event)
}
