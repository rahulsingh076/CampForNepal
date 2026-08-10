// Normalisation must reshape without editing content.
import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import {
  normalizeActivity,
  normalizeDestination,
  normalizeFixedDeparture,
  normalizeGuide,
  normalizePackage,
  normalizeReview,
} from '../../src/seeds/normalizeCatalogData.js'

describe('normalizeCatalogData — preserves content', () => {
  test('a price is never adjusted', () => {
    const { document } = normalizePackage({ id: 'pkg-1', title: 'T', slug: 't', type: 'tour', price: 1599 })
    assert.equal(document.price, 1599)
  })

  test('zero is preserved, not dropped', () => {
    const { document } = normalizeFixedDeparture({ id: 'dep-1', totalSeats: 12, bookedSeats: 0 })
    assert.equal(document.bookedSeats, 0)
  })

  test('a zero price is preserved', () => {
    const { document } = normalizePackage({ id: 'pkg-1', price: 0 })
    assert.equal(document.price, 0)
  })

  test('false is preserved, not dropped', () => {
    const { document } = normalizePackage({ id: 'pkg-1', featured: false })
    assert.equal(document.featured, false)
  })

  test('guaranteed:false survives', () => {
    const { document } = normalizeFixedDeparture({ id: 'dep-1', guaranteed: false })
    assert.equal(document.guaranteed, false)
  })

  test('a status is never rewritten', () => {
    for (const status of ['draft', 'published', 'hidden', 'archived']) {
      const { document } = normalizeDestination({ id: 'd', status })
      assert.equal(document.status, status)
    }
  })

  test('descriptions keep their text', () => {
    const text = 'Fourteen days from Lukla, with two acclimatisation days.'
    const { document } = normalizePackage({ id: 'p', overview: text })
    assert.equal(document.overview, text)
  })

  test('images are never replaced', () => {
    const gallery = ['/images/a.jpg', 'https://cdn.example.com/b.jpg']
    const { document } = normalizeDestination({ id: 'd', gallery })
    assert.deepEqual(document.gallery, gallery)
  })

  test('a null discountPrice stays null rather than vanishing', () => {
    const { document } = normalizePackage({ id: 'p', discountPrice: null })
    assert.equal(document.discountPrice, null)
  })

  test('no field is invented', () => {
    const { document } = normalizeDestination({ id: 'd', title: 'T', slug: 't', region: 'R' })
    assert.equal(document.shortDescription, undefined)
    assert.equal(document.fullDescription, undefined)
  })
})

describe('normalizeCatalogData — structural changes only', () => {
  test('strings are trimmed', () => {
    const { document } = normalizeDestination({ id: 'd', title: '  Everest  ', region: ' Koshi ' })
    assert.equal(document.title, 'Everest')
    assert.equal(document.region, 'Koshi')
  })

  test('a blank optional string becomes undefined', () => {
    const { document } = normalizeDestination({ id: 'd', shortDescription: '   ' })
    assert.equal(document.shortDescription, undefined)
  })

  test('a missing array becomes []', () => {
    const { document } = normalizeDestination({ id: 'd' })
    assert.deepEqual(document.gallery, [])
    assert.deepEqual(document.bestSeason, [])
  })

  test('valid date strings become Dates', () => {
    const { document } = normalizeFixedDeparture({ id: 'dep', startDate: '2027-03-01', endDate: '2027-03-11' })
    assert.ok(document.startDate instanceof Date)
    assert.ok(document.endDate instanceof Date)
    assert.equal(document.startDate.toISOString().slice(0, 10), '2027-03-01')
  })

  test('an unparseable date is passed through for validation to report', () => {
    const { document } = normalizeFixedDeparture({ id: 'dep', startDate: 'next spring' })
    assert.equal(document.startDate, 'next spring')
  })

  test('difficulty casing is normalised the way the frontend does', () => {
    assert.equal(normalizePackage({ id: 'p', difficulty: 'Strenuous and technical' }).document.difficulty, 'strenuous and technical')
    assert.equal(normalizeActivity({ id: 'a', difficulty: 'challenging' }).document.difficulty, 'challenging')
    assert.equal(normalizePackage({ id: 'p', difficulty: 'Easy to Moderate' }).document.difficulty, 'easy to moderate')
  })

  test('an itinerary range label is left exactly as found', () => {
    const { document } = normalizePackage({ id: 'p', itinerary: [{ day: '12-18', title: 'Rotations' }] })
    assert.equal(document.itinerary[0].day, '12-18')
  })

  test('a numeric itinerary day stays numeric', () => {
    const { document } = normalizePackage({ id: 'p', itinerary: [{ day: 1, title: 'Arrive' }] })
    assert.equal(document.itinerary[0].day, 1)
  })
})

describe('normalizeCatalogData — relations are separated', () => {
  test('source relation ids do not land in the document', () => {
    const record = normalizePackage({ id: 'p', destinationIds: ['dest-001'], activityIds: ['act-001'] })
    assert.equal(record.document.destinationIds, undefined)
    assert.deepEqual(record.relations.destinationIds, ['dest-001'])
    assert.deepEqual(record.relations.activityIds, ['act-001'])
  })

  test('a departure keeps its package and guide source ids in relations', () => {
    const record = normalizeFixedDeparture({ id: 'dep', packageId: 'pkg-001', assignedGuideIds: ['guide-001'] })
    assert.equal(record.document.packageId, undefined)
    assert.equal(record.relations.packageId, 'pkg-001')
    assert.deepEqual(record.relations.assignedGuideIds, ['guide-001'])
  })

  test('review booking and user ids are recorded as deferred, not written', () => {
    const record = normalizeReview({ id: 'rev', bookingId: 'bkg-001', userId: 'user-001', packageId: 'pkg-001' })
    assert.equal(record.document.bookingId, undefined)
    assert.equal(record.document.userId, undefined)
    assert.equal(record.relations.deferredBookingId, 'bkg-001')
    assert.equal(record.relations.deferredUserId, 'user-001')
  })

  test('the source id is carried separately from the document', () => {
    const record = normalizeGuide({ id: 'guide-001', fullName: 'A', slug: 'a' })
    assert.equal(record.sourceId, 'guide-001')
    assert.equal(record.document.id, undefined)
  })
})
