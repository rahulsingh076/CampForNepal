// Checks the whole normalised catalogue before a single document is written.
//
// The seed is all-or-nothing on purpose: a half-migrated catalogue with
// dangling relations is worse than no migration, and much harder to diagnose.
// Every problem is collected and reported together, so one run reveals the full
// list rather than one error per attempt.
import { CONTENT_STATUSES } from '../constants/contentStatuses.js'
import { DEPARTURE_STATUSES } from '../constants/departureStatuses.js'
import { DIFFICULTY_LEVELS } from '../constants/difficultyLevels.js'
import { GUIDE_TYPES, PACKAGE_TYPES } from '../constants/packageTypes.js'
import {
  MEDIA_SOURCE_TYPES,
  MEDIA_STATUSES,
  MEDIA_TYPES,
} from '../constants/mediaStatuses.js'
import { EVENT_STATUSES } from '../constants/eventStatuses.js'
import {
  AVAILABILITY_STATUSES,
  REVIEW_STATUSES,
  VERIFICATION_STATUSES,
} from '../constants/verificationStatuses.js'
import { isSafeMediaValue, isSafeUrl, isSlug } from '../database/validators.js'

function problemList() {
  const problems = []
  return {
    problems,
    add(entity, sourceId, field, value, reason) {
      problems.push({ entity, sourceId, field, value, reason })
    },
  }
}

// Every record must be addressable, and a duplicate would make the upsert
// ambiguous — two source records fighting over one document.
function checkUniqueSourceIds(entity, records, report) {
  const seen = new Map()
  records.forEach((record, index) => {
    const { sourceId } = record
    if (!sourceId) {
      report.add(entity, `index ${index}`, 'id', sourceId, 'every source record needs an id')
      return
    }
    if (seen.has(sourceId)) {
      report.add(entity, sourceId, 'id', sourceId, `duplicate of index ${seen.get(sourceId)}`)
    }
    seen.set(sourceId, index)
  })
}

// A duplicate slug makes a public URL ambiguous.
function checkUniqueSlugs(entity, records, report) {
  const seen = new Map()
  records.forEach((record) => {
    const slug = record.document.slug
    if (!slug) {
      report.add(entity, record.sourceId, 'slug', slug, 'a public record needs a slug')
      return
    }
    if (!isSlug(slug)) {
      report.add(entity, record.sourceId, 'slug', slug, 'not a valid slug')
    }
    if (seen.has(slug)) {
      report.add(entity, record.sourceId, 'slug', slug, `duplicate of ${seen.get(slug)}`)
    }
    seen.set(slug, record.sourceId)
  })
}

function checkEnum(entity, record, field, value, allowed, report) {
  if (value === undefined) return
  if (!allowed.includes(value)) {
    report.add(entity, record.sourceId, field, value, `must be one of: ${allowed.join(', ')}`)
  }
}

function checkRequired(entity, record, fields, report) {
  for (const field of fields) {
    const value = record.document[field]
    if (value === undefined || value === null || value === '') {
      report.add(entity, record.sourceId, field, value, 'required field is missing')
    }
  }
}

function checkMediaList(entity, record, field, values, report) {
  for (const media of values || []) {
    if (!isSafeMediaValue(media)) {
      report.add(entity, record.sourceId, field, media, 'unsafe or malformed media')
    }
  }
}

function checkMediaItem(entity, record, field, value, report) {
  if (value !== undefined && !isSafeMediaValue(value)) {
    report.add(entity, record.sourceId, field, value, 'unsafe or malformed media')
  }
}

// Each relation must point at a source record that exists, or the resolve step
// would leave a dangling reference.
function checkRelation(entity, record, field, ids, knownIds, targetEntity, report) {
  for (const id of ids || []) {
    if (!knownIds.has(id)) {
      report.add(entity, record.sourceId, field, id, `no ${targetEntity} has this source id`)
    }
  }
}

export default function validateCatalogSeed(catalog) {
  const report = problemList()
  const deferred = []

  const ids = {
    destinations: new Set(catalog.destinations.map((r) => r.sourceId)),
    activities: new Set(catalog.activities.map((r) => r.sourceId)),
    packages: new Set(catalog.packages.map((r) => r.sourceId)),
    mediaAssets: new Set(catalog.mediaAssets.map((r) => r.sourceId)),
    events: new Set(catalog.events.map((r) => r.sourceId)),
    guides: new Set(catalog.guides.map((r) => r.sourceId)),
  }

  for (const entity of Object.keys(catalog)) {
    checkUniqueSourceIds(entity, catalog[entity], report)
  }
  for (const entity of ['destinations', 'activities', 'packages', 'guides', 'mediaAssets', 'events']) {
    checkUniqueSlugs(entity, catalog[entity], report)
  }

  // ------------------------------------------------------------ destinations
  for (const record of catalog.destinations) {
    checkRequired('destinations', record, ['title', 'slug', 'region'], report)
    checkEnum('destinations', record, 'status', record.document.status, CONTENT_STATUSES, report)
    checkMediaItem('destinations', record, 'coverImage', record.document.coverImage, report)
    checkMediaItem('destinations', record, 'heroMedia', record.document.heroMedia, report)
    checkMediaList('destinations', record, 'gallery', record.document.gallery, report)
    checkMediaList('destinations', record, 'videos', record.document.videos, report)
    checkMediaList('destinations', record, 'seasonalMedia', record.document.seasonalMedia, report)
    checkMediaList('destinations', record, 'beforeAfterMedia', record.document.beforeAfterMedia, report)
    checkRelation('destinations', record, 'relatedPackageIds', record.relations.relatedPackageIds, ids.packages, 'package', report)
    checkRelation('destinations', record, 'relatedGuideIds', record.relations.relatedGuideIds, ids.guides, 'guide', report)

    const map = record.document.mapInfo
    if (map?.latitude !== undefined && (map.latitude < -90 || map.latitude > 90)) {
      report.add('destinations', record.sourceId, 'mapInfo.latitude', map.latitude, 'outside -90..90')
    }
    if (map?.longitude !== undefined && (map.longitude < -180 || map.longitude > 180)) {
      report.add('destinations', record.sourceId, 'mapInfo.longitude', map.longitude, 'outside -180..180')
    }
  }

  // -------------------------------------------------------------- activities
  for (const record of catalog.activities) {
    checkRequired('activities', record, ['title', 'slug'], report)
    checkEnum('activities', record, 'status', record.document.status, CONTENT_STATUSES, report)
    checkEnum('activities', record, 'difficulty', record.document.difficulty, DIFFICULTY_LEVELS, report)
    checkMediaItem('activities', record, 'coverImage', record.document.coverImage, report)
    checkMediaItem('activities', record, 'heroMedia', record.document.heroMedia, report)
    checkMediaList('activities', record, 'gallery', record.document.gallery, report)
    checkMediaList('activities', record, 'videos', record.document.videos, report)
    checkMediaList('activities', record, 'seasonalMedia', record.document.seasonalMedia, report)
    checkMediaList('activities', record, 'beforeAfterMedia', record.document.beforeAfterMedia, report)
    checkRelation('activities', record, 'relatedDestinationIds', record.relations.relatedDestinationIds, ids.destinations, 'destination', report)
    checkRelation('activities', record, 'relatedPackageIds', record.relations.relatedPackageIds, ids.packages, 'package', report)
  }

  // ---------------------------------------------------------------- packages
  for (const record of catalog.packages) {
    const doc = record.document
    checkRequired('packages', record, ['title', 'slug', 'type', 'price'], report)
    checkEnum('packages', record, 'type', doc.type, PACKAGE_TYPES, report)
    checkEnum('packages', record, 'status', doc.status, CONTENT_STATUSES, report)
    checkEnum('packages', record, 'difficulty', doc.difficulty, DIFFICULTY_LEVELS, report)
    checkMediaItem('packages', record, 'coverImage', doc.coverImage, report)
    checkMediaItem('packages', record, 'heroMedia', doc.heroMedia, report)
    checkMediaList('packages', record, 'gallery', doc.gallery, report)
    checkMediaList('packages', record, 'videos', doc.videos, report)
    checkMediaList('packages', record, 'seasonalMedia', doc.seasonalMedia, report)
    checkMediaList('packages', record, 'beforeAfterMedia', doc.beforeAfterMedia, report)
    for (const [index, entry] of (doc.itinerary || []).entries()) {
      checkMediaList('packages', record, `itinerary[${index}].media`, entry.media, report)
    }
    if (doc.routeMap && !isSafeUrl(doc.routeMap)) {
      report.add('packages', record.sourceId, 'routeMap', doc.routeMap, 'unsafe or malformed URL')
    }

    if (typeof doc.price === 'number' && doc.price < 0) {
      report.add('packages', record.sourceId, 'price', doc.price, 'price cannot be negative')
    }
    if (typeof doc.discountPrice === 'number') {
      if (doc.discountPrice < 0) {
        report.add('packages', record.sourceId, 'discountPrice', doc.discountPrice, 'cannot be negative')
      }
      if (typeof doc.price === 'number' && doc.discountPrice > doc.price) {
        report.add('packages', record.sourceId, 'discountPrice', doc.discountPrice, `greater than price (${doc.price})`)
      }
    }
    if (doc.maxElevationMetres !== undefined && doc.maxElevationMetres < 0) {
      report.add('packages', record.sourceId, 'maxElevationMetres', doc.maxElevationMetres, 'cannot be negative')
    }

    const rating = doc.reviewsSummary?.averageRating
    if (rating !== undefined && (rating < 0 || rating > 5)) {
      report.add('packages', record.sourceId, 'reviewsSummary.averageRating', rating, 'outside 0..5')
    }

    for (const [index, entry] of (doc.faq || []).entries()) {
      if (!entry.question || !entry.answer) {
        report.add('packages', record.sourceId, `faq[${index}]`, entry.question || entry.answer, 'an FAQ entry needs both a question and an answer')
      }
    }

    checkRelation('packages', record, 'destinationIds', record.relations.destinationIds, ids.destinations, 'destination', report)
    checkRelation('packages', record, 'activityIds', record.relations.activityIds, ids.activities, 'activity', report)
  }

  // ----------------------------------------------------------- media assets
  for (const record of catalog.mediaAssets) {
    const doc = record.document
    checkRequired('mediaAssets', record, ['title', 'type', 'sourceType', 'sourceUrl', 'status'], report)
    checkEnum('mediaAssets', record, 'type', doc.type, MEDIA_TYPES, report)
    checkEnum('mediaAssets', record, 'sourceType', doc.sourceType, MEDIA_SOURCE_TYPES, report)
    checkEnum('mediaAssets', record, 'status', doc.status, MEDIA_STATUSES, report)
    checkMediaItem('mediaAssets', record, 'sourceUrl', {
      type: doc.type,
      sourceType: doc.sourceType,
      src: doc.sourceUrl,
      thumbnailSrc: doc.thumbnailUrl,
      alt: doc.alt,
      caption: doc.caption,
      focalPosition: doc.focalPosition,
      sourceName: doc.sourceName,
      sourceReference: doc.sourceReference,
      licenceName: doc.licence,
    }, report)
  }

  // ---------------------------------------------------------------- events
  for (const record of catalog.events) {
    const doc = record.document
    checkRequired('events', record, ['title', 'slug', 'eventType', 'startDateTime', 'status'], report)
    checkEnum('events', record, 'status', doc.status, EVENT_STATUSES, report)
    checkMediaItem('events', record, 'coverMedia', doc.coverMedia, report)
    checkMediaList('events', record, 'gallery', doc.gallery, report)
    checkMediaList('events', record, 'videos', doc.videos, report)
    if (doc.startDateTime !== undefined && !(doc.startDateTime instanceof Date)) {
      report.add('events', record.sourceId, 'startDateTime', doc.startDateTime, 'not a valid date')
    }
    if (doc.endDateTime !== undefined && !(doc.endDateTime instanceof Date)) {
      report.add('events', record.sourceId, 'endDateTime', doc.endDateTime, 'not a valid date')
    }
    if (doc.startDateTime instanceof Date && doc.endDateTime instanceof Date && doc.endDateTime < doc.startDateTime) {
      report.add('events', record.sourceId, 'endDateTime', doc.endDateTime.toISOString(), 'earlier than startDateTime')
    }
    checkRelation('events', record, 'relatedPackageIds', record.relations.relatedPackageIds, ids.packages, 'package', report)
    checkRelation('events', record, 'relatedDestinationIds', record.relations.relatedDestinationIds, ids.destinations, 'destination', report)
  }

  // --------------------------------------------------------- fixedDepartures
  for (const record of catalog.fixedDepartures) {
    const doc = record.document
    checkRequired('fixedDepartures', record, ['startDate', 'endDate', 'totalSeats'], report)
    checkEnum('fixedDepartures', record, 'status', doc.status, DEPARTURE_STATUSES, report)

    if (doc.startDate instanceof Date && doc.endDate instanceof Date && doc.endDate < doc.startDate) {
      report.add('fixedDepartures', record.sourceId, 'endDate', doc.endDate.toISOString(), 'earlier than startDate')
    }
    for (const field of ['startDate', 'endDate']) {
      if (doc[field] !== undefined && !(doc[field] instanceof Date)) {
        report.add('fixedDepartures', record.sourceId, field, doc[field], 'not a valid date')
      }
    }

    const { totalSeats, bookedSeats } = doc
    if (typeof totalSeats === 'number' && totalSeats < 0) {
      report.add('fixedDepartures', record.sourceId, 'totalSeats', totalSeats, 'cannot be negative')
    }
    if (typeof bookedSeats === 'number' && bookedSeats < 0) {
      report.add('fixedDepartures', record.sourceId, 'bookedSeats', bookedSeats, 'cannot be negative')
    }
    if (typeof totalSeats === 'number' && typeof bookedSeats === 'number' && bookedSeats > totalSeats) {
      report.add('fixedDepartures', record.sourceId, 'bookedSeats', bookedSeats, `greater than totalSeats (${totalSeats})`)
    }
    if (typeof doc.price === 'number' && doc.price < 0) {
      report.add('fixedDepartures', record.sourceId, 'price', doc.price, 'cannot be negative')
    }

    if (!record.relations.packageId) {
      report.add('fixedDepartures', record.sourceId, 'packageId', undefined, 'a departure must belong to a package')
    } else {
      checkRelation('fixedDepartures', record, 'packageId', [record.relations.packageId], ids.packages, 'package', report)
    }
    checkRelation('fixedDepartures', record, 'assignedGuideIds', record.relations.assignedGuideIds, ids.guides, 'guide', report)
  }

  // ------------------------------------------------------------------ guides
  for (const record of catalog.guides) {
    const doc = record.document
    checkRequired('guides', record, ['fullName', 'slug'], report)
    checkEnum('guides', record, 'status', doc.status, CONTENT_STATUSES, report)
    checkEnum('guides', record, 'guideType', doc.guideType, GUIDE_TYPES, report)
    checkEnum('guides', record, 'verificationStatus', doc.verificationStatus, VERIFICATION_STATUSES, report)
    checkEnum('guides', record, 'availabilityStatus', doc.availabilityStatus, AVAILABILITY_STATUSES, report)

    if (doc.photo && !isSafeUrl(doc.photo)) {
      report.add('guides', record.sourceId, 'photo', doc.photo, 'unsafe or malformed URL')
    }
    if (doc.rating !== undefined && (doc.rating < 0 || doc.rating > 5)) {
      report.add('guides', record.sourceId, 'rating', doc.rating, 'outside 0..5')
    }
    if (doc.experienceYears !== undefined && doc.experienceYears < 0) {
      report.add('guides', record.sourceId, 'experienceYears', doc.experienceYears, 'cannot be negative')
    }
    if (doc.pricePerDay !== undefined && doc.pricePerDay < 0) {
      report.add('guides', record.sourceId, 'pricePerDay', doc.pricePerDay, 'cannot be negative')
    }
  }

  // ----------------------------------------------------------------- reviews
  for (const record of catalog.reviews) {
    const doc = record.document
    checkRequired('reviews', record, ['customerName', 'rating', 'reviewText'], report)
    checkEnum('reviews', record, 'status', doc.status, REVIEW_STATUSES, report)

    if (doc.rating !== undefined && (doc.rating < 1 || doc.rating > 5)) {
      report.add('reviews', record.sourceId, 'rating', doc.rating, 'a review rating must be 1..5')
    }

    const { packageId, guideId } = record.relations
    if (!packageId && !guideId) {
      report.add('reviews', record.sourceId, 'packageId/guideId', null, 'a review must target a package or a guide')
    }
    if (packageId) checkRelation('reviews', record, 'packageId', [packageId], ids.packages, 'package', report)
    if (guideId) checkRelation('reviews', record, 'guideId', [guideId], ids.guides, 'guide', report)

    // Not an error. No Booking or User model exists yet, so the source value is
    // recorded as deferred rather than coerced into an invalid ObjectId.
    if (record.relations.deferredBookingId) {
      deferred.push({ entity: 'reviews', sourceId: record.sourceId, field: 'bookingId', value: record.relations.deferredBookingId })
    }
    if (record.relations.deferredUserId) {
      deferred.push({ entity: 'reviews', sourceId: record.sourceId, field: 'userId', value: record.relations.deferredUserId })
    }
  }

  return { problems: report.problems, deferred, ok: report.problems.length === 0 }
}

// Groups problems by entity so a failure reads as a report rather than a wall.
export function formatValidationReport(problems) {
  if (problems.length === 0) return 'No problems found.'

  const byEntity = new Map()
  for (const problem of problems) {
    if (!byEntity.has(problem.entity)) byEntity.set(problem.entity, [])
    byEntity.get(problem.entity).push(problem)
  }

  const lines = [`${problems.length} problem(s) found. Nothing was written.\n`]
  for (const [entity, entityProblems] of byEntity) {
    lines.push(`${entity} (${entityProblems.length}):`)
    for (const problem of entityProblems) {
      lines.push(`  [${problem.sourceId}] ${problem.field} = ${JSON.stringify(problem.value)} — ${problem.reason}`)
    }
    lines.push('')
  }
  return lines.join('\n')
}
