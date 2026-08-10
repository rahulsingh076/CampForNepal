// Guide verification, guide availability, and review moderation.
//
// Every value below is taken from the frontend seed data.

// Seed guides carry only `verified` and `pending`. `rejected` and `expired`
// are the obvious counterparts an admin panel needs, and adding them to the
// enum costs nothing — but no seed record uses them, so that is noted rather
// than presented as an observed value.
export const VERIFICATION_STATUSES = Object.freeze([
  'pending',
  'verified',
  'rejected',
  'expired',
])

export const DEFAULT_VERIFICATION_STATUS = 'pending'

// verificationStatus is private. The public projection exposes only a derived
// boolean, matching frontend/src/lib/publicGuide.js.
export const PUBLICLY_VERIFIED_STATUS = 'verified'

export const AVAILABILITY_STATUSES = Object.freeze([
  'available',
  'on_trip',
  'unavailable',
])

export const DEFAULT_AVAILABILITY_STATUS = 'available'

// Review moderation. A review is only ever public at `published`.
export const REVIEW_STATUSES = Object.freeze(['pending', 'published', 'rejected'])

export const DEFAULT_REVIEW_STATUS = 'pending'

export const PUBLIC_REVIEW_STATUS = 'published'
