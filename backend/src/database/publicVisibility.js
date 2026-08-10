// The single definition of "public" for every read service.
//
// Written once, here, so a new endpoint cannot accidentally invent a looser
// rule. Every value is the canonical one taken from the frontend seed data.
import { PUBLIC_CONTENT_STATUS } from '../constants/contentStatuses.js'
import { PUBLIC_REVIEW_STATUS } from '../constants/verificationStatuses.js'

// Destinations, activities, packages: published only. draft, hidden, and
// archived are all excluded.
export const publishedOnly = () => ({ status: PUBLIC_CONTENT_STATUS })

// A guide needs BOTH flags, exactly as frontend/src/lib/publicGuide.js requires:
// publicProfile true AND status published. Either alone is not enough.
export const publicGuidesOnly = () => ({
  status: PUBLIC_CONTENT_STATUS,
  publicProfile: true,
})

// Reviews are public only once moderated to `published`. pending and rejected
// never appear.
export const publishedReviewsOnly = () => ({ status: PUBLIC_REVIEW_STATUS })

// Departures a visitor may see.
//
// `draft` is internal and always excluded. The other six are public because the
// frontend's own departure list renders them: booking_open, almost_full, and
// guaranteed are bookable; closed, cancelled, and completed appear with a
// status badge so a returning visitor can still find a trip they know about.
// StatusBadge in the frontend has a colour and icon for every one of them.
export const PUBLIC_DEPARTURE_STATUSES = Object.freeze([
  'booking_open',
  'almost_full',
  'guaranteed',
  'closed',
  'cancelled',
  'completed',
])

export const publicDeparturesOnly = () => ({ status: { $in: PUBLIC_DEPARTURE_STATUSES } })

// ---------------------------------------------------------------- projections
//
// Explicit field lists, so adding a private field to a model can never widen a
// public response by accident. `-field` exclusions would fail that way.

export const DESTINATION_PUBLIC_FIELDS =
  'title slug region shortDescription fullDescription coverImage heroMedia gallery videos seasonalMedia beforeAfterMedia bestSeason mapInfo seo status createdAt updatedAt'

export const DESTINATION_SUMMARY_FIELDS = 'title slug region coverImage heroMedia gallery'

export const ACTIVITY_PUBLIC_FIELDS =
  'title slug category difficulty shortDescription fullDescription bestSeason safetyNotes requiredPermits coverImage heroMedia gallery videos seasonalMedia beforeAfterMedia seo status createdAt updatedAt'

export const ACTIVITY_SUMMARY_FIELDS = 'title slug category difficulty coverImage heroMedia gallery'

export const PACKAGE_PUBLIC_FIELDS =
  'title slug type category region shortDescription overview price discountPrice currency priceBasis duration difficulty maxElevationMetres walkingPerDay accommodation meals bestSeason groupSize highlights itinerary costIncludes costExcludes gearList permits routeMap coverImage heroMedia gallery videos seasonalMedia beforeAfterMedia faq reviewsSummary seo status featured createdAt updatedAt'

export const PACKAGE_SUMMARY_FIELDS =
  'title slug type region price currency duration difficulty coverImage heroMedia gallery'

export const DEPARTURE_PUBLIC_FIELDS =
  'packageId title startDate endDate durationDays totalSeats bookedSeats price currency status guaranteed assignedGuideIds createdAt updatedAt'

// The public guide projection. Mirrors PUBLIC_GUIDE_FIELDS in
// frontend/src/lib/publicGuide.js — day rate, certifications, verification
// status, availability, internal notes, and visibility flags are all absent.
export const GUIDE_PUBLIC_FIELDS =
  'fullName slug photo bio guideType languages regions experienceYears rating totalReviews summitsOrTrips createdAt updatedAt'

export const GUIDE_SUMMARY_FIELDS = 'fullName slug photo guideType'

export const REVIEW_PUBLIC_FIELDS =
  'customerName country rating title reviewText packageId guideId verifiedBooking featured publishedAt adminReply createdAt'

export const MEDIA_PUBLIC_FIELDS =
  'title slug type sourceType sourceUrl embedUrl thumbnailUrl alt caption width height durationSeconds focalPosition tags sourceName sourceReference photographerOrCreator licence attributionRequired verifiedAt status createdAt updatedAt'

export const EVENT_PUBLIC_FIELDS =
  'title slug eventType shortDescription fullDescription startDateTime endDateTime timezone venueName address mapLink organizer coverMedia gallery videos relatedPackageIds relatedDestinationIds ctaLabel ctaLink status featured seo createdAt updatedAt'
