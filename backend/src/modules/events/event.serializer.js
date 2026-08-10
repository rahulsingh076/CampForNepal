function idOf(value) {
  if (!value) return null
  if (typeof value === 'string') return value
  if (value._id) return String(value._id)
  return String(value)
}

function isoDate(value) {
  if (!value) return null
  if (value instanceof Date) return value.toISOString()
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
}

function summary(record) {
  if (!record || typeof record !== 'object') return null
  return {
    id: idOf(record._id || record.id),
    title: record.title || record.fullName || '',
    slug: record.slug || '',
  }
}

export function serializePublicEvent(event) {
  const relatedPackages = event.relatedPackageIds || []
  const relatedDestinations = event.relatedDestinationIds || []

  return {
    id: idOf(event._id || event.id),
    title: event.title,
    slug: event.slug,
    eventType: event.eventType || '',
    shortDescription: event.shortDescription || '',
    fullDescription: event.fullDescription || '',
    startDateTime: isoDate(event.startDateTime),
    endDateTime: isoDate(event.endDateTime),
    timezone: event.timezone || 'Asia/Kathmandu',
    venueName: event.venueName || '',
    address: event.address || '',
    mapLink: event.mapLink || '',
    organizer: event.organizer || '',
    coverMedia: event.coverMedia || null,
    gallery: event.gallery || [],
    videos: event.videos || [],
    relatedPackageIds: relatedPackages.map(idOf).filter(Boolean),
    relatedDestinationIds: relatedDestinations.map(idOf).filter(Boolean),
    relatedPackages: relatedPackages.map(summary).filter(Boolean),
    relatedDestinations: relatedDestinations.map(summary).filter(Boolean),
    ctaLabel: event.ctaLabel || '',
    ctaLink: event.ctaLink || '',
    status: event.status,
    featured: Boolean(event.featured),
    seo: event.seo || {},
    createdAt: isoDate(event.createdAt),
    updatedAt: isoDate(event.updatedAt),
  }
}

export const serializeAdminEvent = serializePublicEvent
