// Shared non-destructive checks for dataClient writes and the seed validator.
// A real API must repeat these rules server-side; browser storage is not trust.
import { isSafeEmail, isSafeExternalUrl, isSafeImageUrl, isSafeInternalPath } from './urlSafety.js'
import { isSafeMediaValue } from './media.js'
import { ADMIN_ROUTES, CUSTOMER_ROUTES, PUBLIC_ROUTES, STANDALONE_ROUTES } from '../config/routes.js'

export const ENTITY_STATUSES = {
  destinations: ['draft', 'published', 'archived', 'hidden'],
  activities: ['draft', 'published', 'archived', 'hidden'],
  packages: ['draft', 'published', 'archived', 'hidden'],
  mediaAssets: ['draft', 'published', 'hidden', 'archived'],
  events: ['draft', 'published', 'cancelled', 'completed', 'archived'],
  guides: ['draft', 'published', 'archived', 'hidden'],
  blogPosts: ['draft', 'published', 'archived', 'hidden'],
  travelUpdates: ['draft', 'published', 'archived', 'hidden'],
  travelInfoPages: ['draft', 'published', 'archived', 'hidden'],
  certificates: ['draft', 'published', 'archived', 'hidden'],
  reviews: ['published', 'pending', 'rejected'],
  users: ['active', 'suspended'],
  fixedDepartures: ['draft', 'booking_open', 'almost_full', 'guaranteed', 'closed', 'cancelled', 'completed'],
  inquiries: ['new', 'contacted', 'quoted', 'converted', 'lost', 'closed'],
  bookings: ['booked', 'cancelled'],
  messageThreads: ['open', 'closed'],
}

const SLUG_SHAPE = /^[a-z0-9]+(-[a-z0-9]+)*$/
const ISO_DATE = /^\d{4}-\d{2}-\d{2}(T[\d:.]+(Z|[+-]\d{2}:\d{2}))?$/
const PRICE_BASES = new Set(['person', 'per_person', 'group', 'per_group', 'day', 'per_day'])
const USER_ROLES = new Set(['customer', 'guide', 'admin', 'super_admin'])
const ALL_ROUTES = [...PUBLIC_ROUTES, ...CUSTOMER_ROUTES, ...ADMIN_ROUTES, ...Object.values(STANDALONE_ROUTES).map((path) => ({ path }))]
const STATIC_PATHS = new Set(ALL_ROUTES.map((route) => route.path))
const DYNAMIC_PATTERNS = ALL_ROUTES
  .filter((route) => route.path.includes(':'))
  .map((route) => new RegExp(`^${route.path.replace(/:[^/]+/g, '[^/]+')}$`))

const REQUIRED_FIELDS = {
  destinations: ['title', 'slug', 'region', 'shortDescription', 'fullDescription', 'status'],
  activities: ['title', 'slug', 'category', 'shortDescription', 'fullDescription', 'status'],
  packages: ['title', 'slug', 'type', 'region', 'shortDescription', 'overview', 'price', 'status'],
  mediaAssets: ['title', 'type', 'sourceType', 'sourceUrl', 'status'],
  events: ['title', 'slug', 'eventType', 'shortDescription', 'fullDescription', 'startDateTime', 'timezone', 'status'],
  fixedDepartures: ['packageId', 'title', 'startDate', 'endDate', 'durationDays', 'totalSeats', 'price', 'status'],
  guides: ['fullName', 'slug', 'guideType', 'status'],
  blogPosts: ['title', 'slug', 'content', 'status'],
  travelUpdates: ['title', 'slug', 'content', 'status'],
  travelInfoPages: ['title', 'slug', 'category', 'summary', 'content', 'status'],
  certificates: ['title', 'issuer', 'status'],
  users: ['fullName', 'email', 'role', 'status'],
  bookings: ['reference', 'packageId', 'status'],
  inquiries: ['type', 'status', 'fullName', 'email'],
  reviews: ['customerName', 'rating', 'title', 'reviewText', 'status'],
}

const ARRAY_RELATIONS = [
  ['packages', 'destinationIds', 'destinations'],
  ['packages', 'activityIds', 'activities'],
  ['events', 'relatedPackageIds', 'packages'],
  ['events', 'relatedDestinationIds', 'destinations'],
  ['destinations', 'relatedPackageIds', 'packages'],
  ['destinations', 'relatedGuideIds', 'guides'],
  ['activities', 'relatedDestinationIds', 'destinations'],
  ['activities', 'relatedPackageIds', 'packages'],
  ['blogPosts', 'relatedPackageIds', 'packages'],
  ['travelUpdates', 'relatedDestinationIds', 'destinations'],
  ['travelUpdates', 'relatedPackageIds', 'packages'],
  ['travelInfoPages', 'relatedPackageIds', 'packages'],
  ['fixedDepartures', 'assignedGuideIds', 'guides'],
]

const SINGLE_RELATIONS = [
  ['fixedDepartures', 'packageId', 'packages'],
  ['bookings', 'inquiryId', 'inquiries'],
  ['bookings', 'packageId', 'packages'],
  ['bookings', 'departureId', 'fixedDepartures'],
  ['bookings', 'userId', 'users'],
  ['bookings', 'assignedGuideId', 'guides'],
  ['reviews', 'packageId', 'packages'],
  ['reviews', 'guideId', 'guides'],
  ['reviews', 'userId', 'users'],
  ['reviews', 'bookingId', 'bookings'],
  ['messageThreads', 'userId', 'users'],
  ['messageThreads', 'relatedBookingId', 'bookings'],
  ['notifications', 'userId', 'users'],
  ['inquiries', 'packageId', 'packages'],
  ['inquiries', 'guideId', 'guides'],
  ['inquiries', 'userId', 'users'],
  ['inquiries', 'assignedTo', 'users'],
  ['users', 'guideId', 'guides'],
]

function hasValue(value) {
  return value !== null && value !== undefined && value !== ''
}

function recordId(record) {
  return record?.id || record?.code || record?.countryCode
}

function issue(message) {
  return { valid: false, message }
}

function isKnownInternalRoute(path) {
  const clean = String(path).split('?')[0].split('#')[0].replace(/\/$/, '') || '/'
  return STATIC_PATHS.has(clean) || DYNAMIC_PATTERNS.some((pattern) => pattern.test(clean))
}

function checkRelations(entity, record, getRows) {
  for (const [from, field, target] of ARRAY_RELATIONS) {
    if (from !== entity || record[field] === undefined) continue
    if (!Array.isArray(record[field])) return `${field} must be a list.`
    const known = new Set(getRows(target).map(recordId))
    if (record[field].some((id) => !known.has(id))) return `${field} contains an unknown ${target.slice(0, -1)}.`
  }

  for (const [from, field, target] of SINGLE_RELATIONS) {
    if (from !== entity || !hasValue(record[field])) continue
    const known = new Set(getRows(target).map(recordId))
    if (!known.has(record[field])) return `${field} does not resolve to a ${target.slice(0, -1)}.`
  }

  return ''
}

function checkImages(entity, record) {
  if (record.gallery !== undefined && (!Array.isArray(record.gallery) || record.gallery.some((item) => !isSafeMediaValue(item)))) {
    return 'Gallery media must use safe image URLs, or safe external video/reel URLs with optional source metadata.'
  }
  for (const field of ['mediaGallery', 'videos', 'seasonalMedia', 'beforeAfterMedia']) {
    if (record[field] !== undefined && (!Array.isArray(record[field]) || record[field].some((item) => !isSafeMediaValue(item)))) {
      return `${field} must contain safe media URLs and source metadata.`
    }
  }
  for (const field of ['coverImage', 'heroMedia']) {
    if (record[field] !== undefined && !isSafeMediaValue(record[field])) {
      return `${field} must use a safe media URL and source metadata.`
    }
  }
  if (entity === 'events' && record.coverMedia !== undefined && !isSafeMediaValue(record.coverMedia)) {
    return 'coverMedia must use a safe media URL and source metadata.'
  }
  if (entity === 'mediaAssets') {
    if (!isSafeMediaValue({
      type: record.type,
      sourceType: record.sourceType,
      src: record.sourceUrl,
      thumbnailSrc: record.thumbnailUrl,
      alt: record.alt,
      caption: record.caption,
      focalPosition: record.focalPosition,
      sourceName: record.sourceName,
      sourceReference: record.sourceReference,
      licenceName: record.licence,
    })) {
      return 'Media assets must use safe image URLs, safe external video/reel URLs, or approved local asset paths.'
    }
  }
  for (const [index, day] of (record.itinerary || []).entries()) {
    if (day?.media !== undefined && (!Array.isArray(day.media) || day.media.some((item) => !isSafeMediaValue(item)))) {
      return `itinerary[${index}].media must contain safe media URLs and source metadata.`
    }
  }
  for (const field of ['photo', 'featuredImage', 'image', 'routeMap']) {
    if (hasValue(record[field]) && !isSafeImageUrl(record[field])) {
      return `${field} must use a site-relative path or an https URL.`
    }
  }
  return ''
}

export function validateRecord(entity, record, getRows, { idField = 'id' } = {}) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) return issue('This record is not valid.')

  for (const field of REQUIRED_FIELDS[entity] || []) {
    if (!hasValue(record[field])) return issue(`${field} is required.`)
  }

  if (record.slug !== undefined) {
    if (!SLUG_SHAPE.test(record.slug)) return issue('Slug must use lowercase letters, numbers, and hyphens only.')
    if (getRows(entity).some((row) => row.slug === record.slug && row[idField] !== record[idField])) {
      return issue('That slug is already in use.')
    }
    // Blog posts and travel updates share /blog/:slug, so the two underlying
    // collections must not create a route collision between each other.
    const sibling = entity === 'blogPosts' ? 'travelUpdates' : entity === 'travelUpdates' ? 'blogPosts' : null
    if (sibling && getRows(sibling).some((row) => row.slug === record.slug)) {
      return issue('That slug is already in use by another blog update.')
    }
  }

  const allowedStatuses = ENTITY_STATUSES[entity]
  if (record.status !== undefined && allowedStatuses && !allowedStatuses.includes(record.status)) {
    return issue(`Unknown ${entity} status.`)
  }

  const relationProblem = checkRelations(entity, record, getRows)
  if (relationProblem) return issue(relationProblem)

  if (['users', 'inquiries'].includes(entity) && !isSafeEmail(record.email)) {
    return issue('Enter a valid email address.')
  }
  if (entity === 'users' && !USER_ROLES.has(record.role)) return issue('Unknown user role.')
  if (entity === 'bookings' && record.leadTraveller?.email && !isSafeEmail(record.leadTraveller.email)) {
    return issue('Lead traveller email is not valid.')
  }

  for (const field of entity === 'packages' ? ['price', 'discountPrice'] : entity === 'fixedDepartures' ? ['price'] : []) {
    if (record[field] === null && field === 'discountPrice') continue
    if (hasValue(record[field]) && (!Number.isFinite(record[field]) || record[field] < 0)) {
      return issue(`${field} must be a non-negative number.`)
    }
  }
  if (entity === 'packages' && record.discountPrice !== null && record.discountPrice !== undefined && record.discountPrice >= record.price) {
    return issue('Discount price must be lower than the regular price.')
  }
  if (['packages', 'fixedDepartures'].includes(entity)) {
    const basis = record.priceBasis ?? record.priceUnit ?? 'per_person'
    const normalized = String(basis).trim().toLowerCase().replace(/[\s-]+/g, '_')
    if (!PRICE_BASES.has(normalized)) return issue('Price basis must be per person, per group, or per day.')
  }

  if (entity === 'fixedDepartures') {
    if (!ISO_DATE.test(record.startDate) || !ISO_DATE.test(record.endDate) || record.endDate < record.startDate) {
      return issue('Departure dates must be valid and end after the start.')
    }
    if (!Number.isInteger(record.totalSeats) || record.totalSeats < 0 || !Number.isInteger(record.bookedSeats) || record.bookedSeats < 0 || record.bookedSeats > record.totalSeats) {
      return issue('Booked seats must be zero or more and cannot exceed total seats.')
    }
  }
  if (entity === 'certificates' && record.issuedDate && record.expiryDate && (!ISO_DATE.test(record.issuedDate) || !ISO_DATE.test(record.expiryDate) || record.expiryDate < record.issuedDate)) {
    return issue('Certificate dates must be valid and expire after issue date.')
  }
  if (entity === 'travelUpdates' && record.publishedAt && record.expiresAt && (!ISO_DATE.test(record.publishedAt) || !ISO_DATE.test(record.expiresAt) || record.expiresAt < record.publishedAt)) {
    return issue('Update dates must be valid and expire after publication.')
  }
  if (entity === 'events') {
    if (!ISO_DATE.test(record.startDateTime)) return issue('Event start date/time must be valid.')
    if (record.endDateTime && (!ISO_DATE.test(record.endDateTime) || record.endDateTime < record.startDateTime)) {
      return issue('Event end date/time must be valid and after the start.')
    }
    if (record.mapLink && !isSafeExternalUrl(record.mapLink)) return issue('Event map link must use an https URL.')
    if (record.ctaLink && !isSafeExternalUrl(record.ctaLink) && (!isSafeInternalPath(record.ctaLink) || !isKnownInternalRoute(record.ctaLink))) {
      return issue('Event CTA link must point to an implemented site route or a safe https URL.')
    }
  }

  const imageProblem = checkImages(entity, record)
  if (imageProblem) return issue(imageProblem)

  if (entity === 'notifications' && record.link && (!isSafeInternalPath(record.link) || !isKnownInternalRoute(record.link))) {
    return issue('Notification link must point to an implemented site route.')
  }

  return { valid: true, message: '' }
}

export function validateSingleton(name, record) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) return issue('This content record is not valid.')

  const internalLinks = []
  if (name === 'menu') {
    const visit = (item) => {
      if (item?.path) internalLinks.push(item.path)
      ;(item?.children || []).forEach(visit)
    }
    ;(record.mainMenu || []).forEach(visit)
    ;(record.customerMenu || []).forEach(visit)
    ;(record.adminMenu || []).forEach(visit)
    if (record.globalAction?.path) internalLinks.push(record.globalAction.path)
  }
  if (name === 'footer') {
    ;(record.columns || []).forEach((column) => (column.links || []).forEach((link) => internalLinks.push(link.path)))
    ;(record.legalLinks || []).forEach((link) => internalLinks.push(link.path))
    if ((record.socialLinks || []).some((link) => !isSafeExternalUrl(link.url))) return issue('Social links must use https URLs.')
  }
  if (name === 'cmsHomepage') {
    const heroLinks = [record.hero?.primaryCtaLink, record.hero?.secondaryCtaLink]
    const sectionLinks = (record.sections || []).flatMap((section) => [
      section.ctaLink,
      section.inquiryLink,
      ...(section.supportLinks || []).map((link) => link.path),
    ])
    internalLinks.push(...heroLinks.filter(Boolean), record.quickExplore?.browseLink, ...sectionLinks.filter(Boolean))
  }
  if (name === 'contactDetails') {
    if (record.mapLink && !isSafeExternalUrl(record.mapLink)) return issue('Map link must use an https URL.')
    for (const field of ['facebookPageUrl', 'facebookMessengerUrl', 'instagramUrl']) {
      if (record[field] && !isSafeExternalUrl(record[field])) return issue(`${field} must use an https URL.`)
    }
    if ((record.socialLinks || []).some((link) => !isSafeExternalUrl(link.url))) return issue('Social links must use https URLs.')
    for (const field of ['publicEmail', 'email', 'supportEmail']) {
      if (record[field] && !isSafeEmail(record[field])) return issue(`${field} is not a valid email address.`)
    }
  }
  if (internalLinks.some((link) => !isSafeInternalPath(link) || !isKnownInternalRoute(link))) {
    return issue('Navigation and CTA links must point to an implemented site route.')
  }

  return { valid: true, message: '' }
}
