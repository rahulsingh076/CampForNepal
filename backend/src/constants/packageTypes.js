// The three kinds of trip. Taken verbatim from the frontend seed data, where
// every package carries exactly one of these values.
//
// These also drive public URLs: /packages, /trekking, /expeditions.
export const PACKAGE_TYPES = Object.freeze(['tour', 'trekking', 'expedition'])

// Guide specialisms overlap with trip types but are not the same list —
// `cultural` and `naturalist` guides have no matching package type.
export const GUIDE_TYPES = Object.freeze([
  'trekking',
  'expedition',
  'cultural',
  'naturalist',
])
