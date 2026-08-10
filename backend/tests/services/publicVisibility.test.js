// The rules that decide what a visitor may see.
//
// These assert the filters and projections themselves, so they need no
// database. A leak here would be a leak on every endpoint that uses them.
import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import {
  ACTIVITY_PUBLIC_FIELDS,
  DEPARTURE_PUBLIC_FIELDS,
  DESTINATION_PUBLIC_FIELDS,
  GUIDE_PUBLIC_FIELDS,
  PACKAGE_PUBLIC_FIELDS,
  PUBLIC_DEPARTURE_STATUSES,
  REVIEW_PUBLIC_FIELDS,
  publicDeparturesOnly,
  publicGuidesOnly,
  publishedOnly,
  publishedReviewsOnly,
} from '../../src/database/publicVisibility.js'

const fields = (projection) => projection.split(/\s+/).filter(Boolean)

describe('publicVisibility — content filters', () => {
  test('destinations, activities and packages are published only', () => {
    assert.deepEqual(publishedOnly(), { status: 'published' })
  })

  test('draft, hidden and archived are all excluded by that filter', () => {
    const filter = publishedOnly()
    for (const status of ['draft', 'hidden', 'archived']) {
      assert.notEqual(filter.status, status)
    }
  })

  test('a guide needs BOTH publicProfile and published status', () => {
    const filter = publicGuidesOnly()
    assert.equal(filter.status, 'published')
    assert.equal(filter.publicProfile, true)
  })

  test('reviews are published only', () => {
    assert.deepEqual(publishedReviewsOnly(), { status: 'published' })
  })

  test('pending and rejected reviews cannot match the review filter', () => {
    const filter = publishedReviewsOnly()
    assert.notEqual(filter.status, 'pending')
    assert.notEqual(filter.status, 'rejected')
  })

  test('draft departures are excluded from the public set', () => {
    assert.ok(!PUBLIC_DEPARTURE_STATUSES.includes('draft'))
    assert.ok(!publicDeparturesOnly().status.$in.includes('draft'))
  })

  test('bookable departure statuses are public', () => {
    for (const status of ['booking_open', 'almost_full', 'guaranteed']) {
      assert.ok(PUBLIC_DEPARTURE_STATUSES.includes(status), `${status} should be public`)
    }
  })
})

describe('publicVisibility — projections exclude private fields', () => {
  // Nothing in this list may appear in any public projection.
  const NEVER_PUBLIC = [
    'sourceId', 'internalNotes', 'pricePerDay', 'certifications',
    'verificationStatus', 'availabilityStatus', 'publicProfile', '__v',
  ]

  const projections = {
    destination: DESTINATION_PUBLIC_FIELDS,
    activity: ACTIVITY_PUBLIC_FIELDS,
    package: PACKAGE_PUBLIC_FIELDS,
    departure: DEPARTURE_PUBLIC_FIELDS,
    guide: GUIDE_PUBLIC_FIELDS,
    review: REVIEW_PUBLIC_FIELDS,
  }

  for (const [name, projection] of Object.entries(projections)) {
    test(`the ${name} projection leaks nothing private`, () => {
      const selected = fields(projection)
      for (const forbidden of NEVER_PUBLIC) {
        assert.ok(!selected.includes(forbidden), `${name} must not select ${forbidden}`)
      }
    })
  }

  test('every projection is an allowlist, never an exclusion', () => {
    // A "-field" projection would silently widen as new fields are added.
    for (const [name, projection] of Object.entries(projections)) {
      assert.ok(!projection.includes('-'), `${name} must list fields, not exclude them`)
    }
  })

  test('the guide projection matches the frontend public allowlist', () => {
    // Mirrors PUBLIC_GUIDE_FIELDS in frontend/src/lib/publicGuide.js.
    const selected = fields(GUIDE_PUBLIC_FIELDS)
    for (const expected of ['fullName', 'slug', 'photo', 'bio', 'guideType', 'languages', 'regions', 'experienceYears', 'rating', 'totalReviews']) {
      assert.ok(selected.includes(expected), `guide projection should include ${expected}`)
    }
  })

  test('the departure projection excludes internalNotes', () => {
    assert.ok(!fields(DEPARTURE_PUBLIC_FIELDS).includes('internalNotes'))
  })

  test('the review projection carries no moderation or private customer data', () => {
    const selected = fields(REVIEW_PUBLIC_FIELDS)
    for (const forbidden of ['status', 'userId', 'bookingId']) {
      assert.ok(!selected.includes(forbidden), `review projection must not include ${forbidden}`)
    }
  })
})
