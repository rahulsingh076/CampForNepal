import { PUBLIC_EVENT_STATUSES } from '../../constants/eventStatuses.js'
import { publicDeparturesOnly, publishedOnly } from '../../database/publicVisibility.js'
import ApiError from '../../utils/ApiError.js'
import Destination from '../destinations/destination.model.js'
import Event from '../events/event.model.js'
import FixedDeparture from '../fixedDepartures/fixedDeparture.model.js'
import Inquiry from '../inquiries/inquiry.model.js'
import Package from '../packages/package.model.js'
import User from '../users/user.model.js'

function isoDate(value) {
  if (!value) return null
  if (value instanceof Date) return value.toISOString()
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
}

function generated(title, classification = 'public') {
  return {
    title,
    generatedAt: new Date().toISOString(),
    classification,
    printAuditAction: 'print_view_opened',
    physicalPrintCompleted: false,
    company: {
      name: 'Camp For Nepal',
      contact: 'Use the published website contact details.',
    },
  }
}

function mediaSummary(record) {
  return record ? {
    coverImage: record.coverImage || record.coverMedia || null,
    heroMedia: record.heroMedia || null,
    gallery: record.gallery || [],
    videos: record.videos || [],
  } : {}
}

export async function publicPackagePrint(slug, { itineraryOnly = false } = {}) {
  const doc = await Package.findOne({ ...publishedOnly(), slug: String(slug).toLowerCase() })
    .select('title slug shortDescription overview price discountPrice currency priceBasis duration difficulty maxElevationMetres walkingPerDay accommodation meals bestSeason groupSize highlights itinerary costIncludes costExcludes gearList permits routeMap coverImage heroMedia gallery videos faq status')
    .lean()
  if (!doc) throw ApiError.notFound('Package not found.')
  return {
    meta: generated(itineraryOnly ? `${doc.title} detailed itinerary` : `${doc.title} brochure`),
    package: {
      title: doc.title,
      slug: doc.slug,
      overview: itineraryOnly ? '' : doc.overview,
      shortDescription: doc.shortDescription,
      facts: {
        price: doc.price,
        discountPrice: doc.discountPrice,
        currency: doc.currency || 'USD',
        priceBasis: doc.priceBasis || 'per_person',
        duration: doc.duration,
        difficulty: doc.difficulty,
        maxElevationMetres: doc.maxElevationMetres,
        walkingPerDay: doc.walkingPerDay,
        accommodation: doc.accommodation,
        meals: doc.meals,
        bestSeason: doc.bestSeason || [],
        groupSize: doc.groupSize,
      },
      highlights: itineraryOnly ? [] : doc.highlights || [],
      itinerary: doc.itinerary || [],
      costIncludes: itineraryOnly ? [] : doc.costIncludes || [],
      costExcludes: itineraryOnly ? [] : doc.costExcludes || [],
      gearList: itineraryOnly ? [] : doc.gearList || [],
      permits: itineraryOnly ? [] : doc.permits || [],
      routeMap: itineraryOnly ? '' : doc.routeMap || '',
      faq: itineraryOnly ? [] : doc.faq || [],
      ...mediaSummary(doc),
    },
  }
}

export async function publicDestinationPrint(slug) {
  const doc = await Destination.findOne({ ...publishedOnly(), slug: String(slug).toLowerCase() })
    .select('title slug region shortDescription fullDescription coverImage heroMedia gallery videos bestSeason mapInfo status')
    .lean()
  if (!doc) throw ApiError.notFound('Destination not found.')
  return {
    meta: generated(`${doc.title} destination overview`),
    destination: {
      title: doc.title,
      slug: doc.slug,
      region: doc.region,
      shortDescription: doc.shortDescription,
      fullDescription: doc.fullDescription,
      bestSeason: doc.bestSeason || [],
      mapInfo: doc.mapInfo || {},
      ...mediaSummary(doc),
    },
  }
}

export async function publicEventPrint(slug) {
  const doc = await Event.findOne({ slug: String(slug).toLowerCase(), status: { $in: PUBLIC_EVENT_STATUSES } })
    .select('title slug eventType shortDescription fullDescription startDateTime endDateTime timezone venueName address mapLink organizer coverMedia gallery videos ctaLabel ctaLink status')
    .lean()
  if (!doc) throw ApiError.notFound('Event not found.')
  return {
    meta: generated(`${doc.title} event details`),
    event: {
      title: doc.title,
      slug: doc.slug,
      eventType: doc.eventType,
      shortDescription: doc.shortDescription,
      fullDescription: doc.fullDescription,
      startDateTime: isoDate(doc.startDateTime),
      endDateTime: isoDate(doc.endDateTime),
      timezone: doc.timezone,
      venueName: doc.venueName,
      address: doc.address,
      mapLink: doc.mapLink,
      organizer: doc.organizer,
      ctaLabel: doc.ctaLabel,
      ctaLink: doc.ctaLink,
      status: doc.status,
      ...mediaSummary(doc),
    },
  }
}

export async function adminCustomerPrint(id, actor) {
  const doc = await User.findById(id).select('fullName email role status preferences createdAt updatedAt').lean()
  if (!doc || doc.role !== 'customer') throw ApiError.notFound('Customer not found.')
  return {
    meta: { ...generated(`Customer operational details`, 'confidential'), generatedBy: actor?.fullName || 'Staff user' },
    customer: {
      id: String(doc._id),
      fullName: doc.fullName,
      email: doc.email,
      status: doc.status,
      preferences: doc.preferences || {},
      createdAt: isoDate(doc.createdAt),
      updatedAt: isoDate(doc.updatedAt),
    },
  }
}

export async function adminInquiryPrint(id, actor) {
  const doc = await Inquiry.findById(id).select('referenceCode type status priority contact trip snapshot subject message specialRequest callback followUpAt createdAt updatedAt').lean()
  if (!doc) throw ApiError.notFound('Inquiry not found.')
  return {
    meta: { ...generated(`Inquiry ${doc.referenceCode}`, 'confidential'), generatedBy: actor?.fullName || 'Staff user' },
    inquiry: {
      referenceCode: doc.referenceCode,
      type: doc.type,
      status: doc.status,
      priority: doc.priority,
      contact: doc.contact || {},
      trip: doc.trip || {},
      snapshot: doc.snapshot || {},
      subject: doc.subject || '',
      message: doc.message || '',
      specialRequest: doc.specialRequest || '',
      callback: doc.callback || {},
      followUpAt: isoDate(doc.followUpAt),
      createdAt: isoDate(doc.createdAt),
      updatedAt: isoDate(doc.updatedAt),
    },
  }
}

export async function adminDepartureManifestPrint(id, actor) {
  const doc = await FixedDeparture.findById(id)
    .select('packageId title startDate endDate durationDays totalSeats bookedSeats status guaranteed assignedGuideIds')
    .populate('packageId', 'title slug')
    .populate('assignedGuideIds', 'fullName slug guideType')
    .lean()
  if (!doc) throw ApiError.notFound('Departure not found.')
  return {
    meta: { ...generated(`${doc.title || 'Departure'} manifest`, 'confidential'), generatedBy: actor?.fullName || 'Staff user' },
    departure: {
      id: String(doc._id),
      title: doc.title,
      startDate: isoDate(doc.startDate),
      endDate: isoDate(doc.endDate),
      durationDays: doc.durationDays,
      totalSeats: doc.totalSeats,
      bookedSeats: doc.bookedSeats,
      seatsLeft: Math.max(0, (doc.totalSeats || 0) - (doc.bookedSeats || 0)),
      status: doc.status,
      guaranteed: Boolean(doc.guaranteed),
      package: doc.packageId ? { id: String(doc.packageId._id), title: doc.packageId.title, slug: doc.packageId.slug } : null,
      guides: (doc.assignedGuideIds || []).map((guide) => ({ id: String(guide._id), fullName: guide.fullName, guideType: guide.guideType })),
    },
  }
}

