// Reshapes frontend seed records for MongoDB.
//
// STRUCTURAL CHANGES ONLY. This file trims whitespace, turns date strings into
// Dates, defaults a missing array to [], normalises difficulty casing the same
// way the frontend does at read time, and separates source relation ids from
// the ObjectId fields they will become.
//
// It does not write content. No description is rewritten, no price adjusted, no
// status changed, no image replaced, no missing field invented. Zero and false
// are preserved — they are values, not absences.
import { normaliseDifficulty } from '../constants/difficultyLevels.js'

const text = (value) => {
  if (typeof value !== 'string') return value
  const trimmed = value.trim()
  // A blank optional string becomes undefined so it is simply absent rather
  // than stored as "".
  return trimmed === '' ? undefined : trimmed
}

const list = (value) => (Array.isArray(value) ? value : [])

// Trims each entry and drops blanks, without reordering or deduplicating.
const textList = (value) =>
  list(value)
    .map((item) => (typeof item === 'string' ? item.trim() : item))
    .filter((item) => item !== '' && item !== null && item !== undefined)

// Returns a Date, or the original value when it cannot be parsed — validation
// reports it rather than this file silently dropping it.
const date = (value) => {
  if (value === undefined || value === null || value === '') return undefined
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? value : parsed
}

// Preserves 0. `value || undefined` would turn a legitimate zero into nothing.
const number = (value) =>
  typeof value === 'number' && Number.isFinite(value) ? value : undefined

// Preserves false.
const boolean = (value, fallback = undefined) =>
  typeof value === 'boolean' ? value : fallback

const seo = (value) =>
  value
    ? {
        metaTitle: text(value.metaTitle),
        metaDescription: text(value.metaDescription),
        keywords: textList(value.keywords),
      }
    : undefined

// Each normaliser returns { document, relations }. `document` holds fields
// ready to write; `relations` holds the source-id arrays that pass two of the
// migration resolves into ObjectIds.

export function normalizeDestination(row) {
  return {
    sourceId: text(row.id),
    document: {
      title: text(row.title),
      slug: text(row.slug),
      region: text(row.region),
      shortDescription: text(row.shortDescription),
      fullDescription: text(row.fullDescription),
      coverImage: text(row.coverImage),
      heroMedia: text(row.heroMedia),
      gallery: textList(row.gallery),
      videos: textList(row.videos),
      seasonalMedia: textList(row.seasonalMedia),
      beforeAfterMedia: textList(row.beforeAfterMedia),
      bestSeason: textList(row.bestSeason),
      mapInfo: row.mapInfo
        ? {
            latitude: number(row.mapInfo.latitude),
            longitude: number(row.mapInfo.longitude),
            elevationMetres: number(row.mapInfo.elevationMetres),
            nearestAirport: text(row.mapInfo.nearestAirport),
          }
        : undefined,
      seo: seo(row.seo),
      status: text(row.status),
    },
    relations: {
      relatedPackageIds: textList(row.relatedPackageIds),
      relatedGuideIds: textList(row.relatedGuideIds),
    },
  }
}

export function normalizeActivity(row) {
  return {
    sourceId: text(row.id),
    document: {
      title: text(row.title),
      slug: text(row.slug),
      category: text(row.category),
      // Packages store "Challenging", activities store "challenging". The
      // frontend lowercases before lookup; this matches that exactly.
      difficulty: row.difficulty ? normaliseDifficulty(row.difficulty) : undefined,
      shortDescription: text(row.shortDescription),
      fullDescription: text(row.fullDescription),
      bestSeason: textList(row.bestSeason),
      safetyNotes: textList(row.safetyNotes),
      requiredPermits: textList(row.requiredPermits),
      coverImage: text(row.coverImage),
      heroMedia: text(row.heroMedia),
      gallery: textList(row.gallery),
      videos: textList(row.videos),
      seasonalMedia: textList(row.seasonalMedia),
      beforeAfterMedia: textList(row.beforeAfterMedia),
      seo: seo(row.seo),
      status: text(row.status),
    },
    relations: {
      relatedDestinationIds: textList(row.relatedDestinationIds),
      relatedPackageIds: textList(row.relatedPackageIds),
    },
  }
}

export function normalizePackage(row) {
  return {
    sourceId: text(row.id),
    document: {
      title: text(row.title),
      slug: text(row.slug),
      type: text(row.type),
      category: text(row.category),
      region: text(row.region),
      shortDescription: text(row.shortDescription),
      overview: text(row.overview),
      price: number(row.price),
      // null means "no discount" and is kept as null, not dropped.
      discountPrice: row.discountPrice === null ? null : number(row.discountPrice),
      duration: row.duration
        ? { days: number(row.duration.days), nights: number(row.duration.nights) }
        : undefined,
      difficulty: row.difficulty ? normaliseDifficulty(row.difficulty) : undefined,
      maxElevationMetres: number(row.maxElevationMetres),
      walkingPerDay: text(row.walkingPerDay),
      accommodation: text(row.accommodation),
      meals: text(row.meals),
      bestSeason: textList(row.bestSeason),
      groupSize: row.groupSize
        ? { min: number(row.groupSize.min), max: number(row.groupSize.max) }
        : undefined,
      highlights: textList(row.highlights),
      // `day` stays exactly as found: a number on most trips, a range label
      // such as '12-18' on the grouped Everest expedition.
      itinerary: list(row.itinerary).map((entry) => ({
        day: entry.day,
        title: text(entry.title),
        description: text(entry.description),
        elevationMetres: number(entry.elevationMetres),
        walkingHours: text(entry.walkingHours),
        accommodation: text(entry.accommodation),
        meals: text(entry.meals),
        media: textList(entry.media),
      })),
      costIncludes: textList(row.costIncludes),
      costExcludes: textList(row.costExcludes),
      gearList: textList(row.gearList),
      permits: textList(row.permits),
      routeMap: text(row.routeMap),
      coverImage: text(row.coverImage),
      heroMedia: text(row.heroMedia),
      gallery: textList(row.gallery),
      videos: textList(row.videos),
      seasonalMedia: textList(row.seasonalMedia),
      beforeAfterMedia: textList(row.beforeAfterMedia),
      faq: list(row.faq).map((entry) => ({
        question: text(entry.question),
        answer: text(entry.answer),
      })),
      reviewsSummary: row.reviewsSummary
        ? {
            averageRating: number(row.reviewsSummary.averageRating),
            totalReviews: number(row.reviewsSummary.totalReviews),
          }
        : undefined,
      seo: seo(row.seo),
      status: text(row.status),
      featured: boolean(row.featured, false),
    },
    relations: {
      destinationIds: textList(row.destinationIds),
      activityIds: textList(row.activityIds),
    },
  }
}

export function normalizeMediaAsset(row) {
  return {
    sourceId: text(row.id),
    document: {
      title: text(row.title),
      slug: text(row.slug),
      type: text(row.type),
      sourceType: text(row.sourceType),
      sourceUrl: text(row.sourceUrl),
      embedUrl: text(row.embedUrl),
      thumbnailUrl: text(row.thumbnailUrl),
      alt: text(row.alt),
      caption: text(row.caption),
      width: number(row.width),
      height: number(row.height),
      durationSeconds: number(row.durationSeconds),
      focalPosition: text(row.focalPosition),
      tags: textList(row.tags),
      sourceName: text(row.sourceName),
      sourceReference: text(row.sourceReference),
      photographerOrCreator: text(row.photographerOrCreator),
      licence: text(row.licence),
      attributionRequired: boolean(row.attributionRequired, false),
      verifiedAt: date(row.verifiedAt),
      status: text(row.status),
      usageLocations: list(row.usageLocations).map((entry) => ({
        entityType: text(entry.entityType),
        entityId: text(entry.entityId),
        entityTitle: text(entry.entityTitle),
        field: text(entry.field),
      })),
    },
    relations: {},
  }
}

export function normalizeEvent(row) {
  return {
    sourceId: text(row.id),
    document: {
      title: text(row.title),
      slug: text(row.slug),
      eventType: text(row.eventType),
      shortDescription: text(row.shortDescription),
      fullDescription: text(row.fullDescription),
      startDateTime: date(row.startDateTime),
      endDateTime: date(row.endDateTime),
      timezone: text(row.timezone),
      venueName: text(row.venueName),
      address: text(row.address),
      mapLink: text(row.mapLink),
      organizer: text(row.organizer),
      coverMedia: row.coverMedia,
      gallery: textList(row.gallery),
      videos: textList(row.videos),
      ctaLabel: text(row.ctaLabel),
      ctaLink: text(row.ctaLink),
      status: text(row.status),
      featured: boolean(row.featured, false),
      seo: seo(row.seo),
    },
    relations: {
      relatedPackageIds: textList(row.relatedPackageIds),
      relatedDestinationIds: textList(row.relatedDestinationIds),
    },
  }
}

export function normalizeFixedDeparture(row) {
  return {
    sourceId: text(row.id),
    document: {
      title: text(row.title),
      startDate: date(row.startDate),
      endDate: date(row.endDate),
      durationDays: number(row.durationDays),
      totalSeats: number(row.totalSeats),
      bookedSeats: number(row.bookedSeats),
      price: number(row.price),
      status: text(row.status),
      guaranteed: boolean(row.guaranteed, false),
      internalNotes: text(row.internalNotes),
    },
    relations: {
      packageId: text(row.packageId),
      assignedGuideIds: textList(row.assignedGuideIds),
    },
  }
}

export function normalizeGuide(row) {
  return {
    sourceId: text(row.id),
    document: {
      fullName: text(row.fullName),
      slug: text(row.slug),
      photo: text(row.photo),
      bio: text(row.bio),
      guideType: text(row.guideType),
      languages: textList(row.languages),
      regions: textList(row.regions),
      experienceYears: number(row.experienceYears),
      rating: number(row.rating),
      totalReviews: number(row.totalReviews),
      summitsOrTrips: text(row.summitsOrTrips),
      pricePerDay: number(row.pricePerDay),
      certifications: textList(row.certifications),
      verificationStatus: text(row.verificationStatus),
      availabilityStatus: text(row.availabilityStatus),
      publicProfile: boolean(row.publicProfile, false),
      status: text(row.status),
    },
    relations: {},
  }
}

export function normalizeReview(row) {
  return {
    sourceId: text(row.id),
    document: {
      customerName: text(row.customerName),
      country: text(row.country),
      rating: number(row.rating),
      title: text(row.title),
      reviewText: text(row.reviewText),
      verifiedBooking: boolean(row.verifiedBooking, false),
      status: text(row.status),
      adminReply: text(row.adminReply),
      // Published reviews carry their seed date so ordering survives the move.
      publishedAt: row.status === 'published' ? date(row.createdAt) : undefined,
    },
    relations: {
      packageId: text(row.packageId),
      guideId: text(row.guideId),
      // Recorded, never written: no Booking or User model exists, so these are
      // reported as deferred rather than turned into invalid ObjectIds.
      deferredBookingId: text(row.bookingId),
      deferredUserId: text(row.userId),
    },
  }
}

const NORMALISERS = {
  destinations: normalizeDestination,
  activities: normalizeActivity,
  packages: normalizePackage,
  mediaAssets: normalizeMediaAsset,
  events: normalizeEvent,
  fixedDepartures: normalizeFixedDeparture,
  guides: normalizeGuide,
  reviews: normalizeReview,
}

export default function normalizeCatalogData(rawCatalog) {
  const normalised = {}
  for (const [entity, normalise] of Object.entries(NORMALISERS)) {
    normalised[entity] = (rawCatalog[entity] || []).map((row) => normalise(row))
  }
  return normalised
}
