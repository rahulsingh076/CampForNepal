// Projects a guide record down to the fields a visitor is allowed to see.
// Pages must use this rather than the raw record, so a private field cannot
// reach the screen even by accident.

// Everything on a public guide profile. Adding a field here makes it public.
export const PUBLIC_GUIDE_FIELDS = [
  'id',
  'slug',
  'fullName',
  'photo',
  'photoAlt',
  'photoFocalPosition',
  'bio',
  'guideType',
  'languages',
  'regions',
  'experienceYears',
  'rating',
  'totalReviews',
  'summitsOrTrips',
]

// Never rendered. These are commercial or operational, and some become real
// documents in V2. They are documented in DATA_MODEL.md and stay server-side.
export const PRIVATE_GUIDE_FIELDS = [
  'pricePerDay',
  'certifications',
  'availabilityStatus',
  'verificationStatus',
  'publicProfile',
  'status',
]

export function toPublicGuide(guide) {
  if (!guide) return null

  const projected = {}
  PUBLIC_GUIDE_FIELDS.forEach((field) => {
    if (guide[field] !== undefined) projected[field] = guide[field]
  })

  // A filename alone is not evidence that the owner approved a public portrait.
  // Keep the neutral placeholder until source metadata arrives with the real asset.
  const hasApprovedPortrait = Boolean(guide.photo && guide.photoSourceName)
  projected.hasApprovedPortrait = hasApprovedPortrait
  projected.photo = hasApprovedPortrait ? guide.photo : ''
  projected.photoAlt = hasApprovedPortrait ? guide.photoAlt : ''

  // The badge is a yes or no. The underlying status never travels with it.
  projected.isVerified = guide.verificationStatus === 'verified'

  return projected
}

// A guide only appears publicly when they have opted in and are published.
export function isPubliclyListed(guide) {
  return guide.publicProfile === true && guide.status === 'published'
}

export function toPublicGuides(guides) {
  return guides.filter(isPubliclyListed).map(toPublicGuide)
}
