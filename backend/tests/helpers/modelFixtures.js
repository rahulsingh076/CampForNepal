// Minimal valid documents, one per model.
//
// Each builder returns a document that passes validation, so a test can
// override a single field and be certain any failure came from that field.
// Values are shaped like the frontend seed but are not copied from it — no
// real guide, customer, or review text appears here.
import { Types } from 'mongoose'

export const objectId = () => new Types.ObjectId()

export function destinationFixture(overrides = {}) {
  return {
    title: 'Sample Region',
    slug: 'sample-region',
    region: 'Sample Province',
    shortDescription: 'A short summary used only by the test suite.',
    gallery: ['/images/sample/one.jpg'],
    bestSeason: ['March', 'April'],
    mapInfo: { latitude: 27.7, longitude: 85.3, elevationMetres: 1400 },
    status: 'published',
    ...overrides,
  }
}

export function activityFixture(overrides = {}) {
  return {
    title: 'Sample Activity',
    slug: 'sample-activity',
    category: 'trekking',
    difficulty: 'moderate',
    shortDescription: 'A short summary used only by the test suite.',
    gallery: ['/images/sample/one.jpg'],
    status: 'published',
    ...overrides,
  }
}

export function packageFixture(overrides = {}) {
  return {
    title: 'Sample Trip',
    slug: 'sample-trip',
    type: 'trekking',
    category: 'sample-category',
    region: 'Sample Province',
    shortDescription: 'A short summary used only by the test suite.',
    price: 1500,
    duration: { days: 10, nights: 9 },
    difficulty: 'moderate',
    maxElevationMetres: 4200,
    groupSize: { min: 2, max: 12 },
    itinerary: [
      { day: 1, title: 'Arrive' },
      { day: 2, title: 'Walk in' },
    ],
    faq: [{ question: 'Is this a test?', answer: 'Yes.' }],
    gallery: ['/images/sample/one.jpg'],
    status: 'published',
    ...overrides,
  }
}

export function fixedDepartureFixture(overrides = {}) {
  return {
    packageId: objectId(),
    title: 'Sample Departure',
    startDate: new Date('2027-03-01T00:00:00.000Z'),
    endDate: new Date('2027-03-11T00:00:00.000Z'),
    durationDays: 10,
    totalSeats: 12,
    bookedSeats: 4,
    price: 1500,
    status: 'booking_open',
    ...overrides,
  }
}

export function guideFixture(overrides = {}) {
  return {
    fullName: 'Sample Guide',
    slug: 'sample-guide',
    photo: '/images/sample/guide.jpg',
    bio: 'A short profile used only by the test suite.',
    guideType: 'trekking',
    languages: ['en'],
    regions: ['Sample Province'],
    experienceYears: 8,
    rating: 4.5,
    totalReviews: 10,
    pricePerDay: 60,
    certifications: ['Sample certification'],
    verificationStatus: 'verified',
    availabilityStatus: 'available',
    internalNotes: 'Internal only.',
    publicProfile: true,
    status: 'published',
    ...overrides,
  }
}

export function reviewFixture(overrides = {}) {
  return {
    customerName: 'Sample Reviewer',
    country: 'NP',
    rating: 5,
    title: 'A sample review',
    reviewText: 'Review text supplied by the test suite, long enough to be realistic.',
    packageId: objectId(),
    verifiedBooking: true,
    status: 'published',
    ...overrides,
  }
}

// Mongoose reports every failure at once, so a test asserts on the specific
// path rather than merely that something failed.
export async function validationErrorFor(doc) {
  try {
    await doc.validate()
    return null
  } catch (error) {
    return error
  }
}

export async function expectInvalidPath(doc, path) {
  const error = await validationErrorFor(doc)
  return Boolean(error?.errors?.[path])
}
