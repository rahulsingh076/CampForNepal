// Validation must catch every inconsistency before anything is written.
import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import validateCatalogSeed from '../../src/seeds/validateCatalogSeed.js'

// A minimal catalogue that passes, so a test can break exactly one thing.
function baseCatalog(overrides = {}) {
  return {
    destinations: [
      { sourceId: 'dest-1', document: { title: 'D', slug: 'd', region: 'R', status: 'published', gallery: [] }, relations: { relatedPackageIds: [], relatedGuideIds: [] } },
    ],
    activities: [
      { sourceId: 'act-1', document: { title: 'A', slug: 'a', status: 'published', difficulty: 'moderate', gallery: [] }, relations: { relatedDestinationIds: [], relatedPackageIds: [] } },
    ],
    packages: [
      { sourceId: 'pkg-1', document: { title: 'P', slug: 'p', type: 'trekking', price: 100, status: 'published', gallery: [], faq: [] }, relations: { destinationIds: [], activityIds: [] } },
    ],
    fixedDepartures: [
      { sourceId: 'dep-1', document: { startDate: new Date('2027-03-01'), endDate: new Date('2027-03-11'), totalSeats: 10, bookedSeats: 2, status: 'booking_open' }, relations: { packageId: 'pkg-1', assignedGuideIds: [] } },
    ],
    guides: [
      { sourceId: 'guide-1', document: { fullName: 'G', slug: 'g', status: 'published', guideType: 'trekking', rating: 4 }, relations: {} },
    ],
    reviews: [
      { sourceId: 'rev-1', document: { customerName: 'C', rating: 5, reviewText: 'Text', status: 'published' }, relations: { packageId: 'pkg-1' } },
    ],
    mediaAssets: [],
    events: [],
    ...overrides,
  }
}

const failsOn = (catalog, field) =>
  validateCatalogSeed(catalog).problems.some((problem) => problem.field === field)

describe('validateCatalogSeed', () => {
  test('a consistent catalogue passes', () => {
    const result = validateCatalogSeed(baseCatalog())
    assert.equal(result.ok, true, JSON.stringify(result.problems))
  })

  test('a duplicate sourceId fails', () => {
    const catalog = baseCatalog()
    catalog.destinations.push({ ...catalog.destinations[0], document: { ...catalog.destinations[0].document, slug: 'other' } })
    assert.ok(failsOn(catalog, 'id'))
  })

  test('a duplicate slug fails', () => {
    const catalog = baseCatalog()
    catalog.destinations.push({ sourceId: 'dest-2', document: { ...catalog.destinations[0].document }, relations: { relatedPackageIds: [], relatedGuideIds: [] } })
    assert.ok(failsOn(catalog, 'slug'))
  })

  test('a malformed slug fails', () => {
    const catalog = baseCatalog()
    catalog.destinations[0].document.slug = 'Not A Slug'
    assert.ok(failsOn(catalog, 'slug'))
  })

  test('an unresolved relation fails', () => {
    const catalog = baseCatalog()
    catalog.packages[0].relations.destinationIds = ['dest-missing']
    assert.ok(failsOn(catalog, 'destinationIds'))
  })

  test('a departure pointing at a missing package fails', () => {
    const catalog = baseCatalog()
    catalog.fixedDepartures[0].relations.packageId = 'pkg-missing'
    assert.ok(failsOn(catalog, 'packageId'))
  })

  test('an unknown guide on a departure fails', () => {
    const catalog = baseCatalog()
    catalog.fixedDepartures[0].relations.assignedGuideIds = ['guide-missing']
    assert.ok(failsOn(catalog, 'assignedGuideIds'))
  })

  test('an invalid status fails', () => {
    const catalog = baseCatalog()
    catalog.destinations[0].document.status = 'live'
    assert.ok(failsOn(catalog, 'status'))
  })

  test('an invalid package type fails', () => {
    const catalog = baseCatalog()
    catalog.packages[0].document.type = 'safari'
    assert.ok(failsOn(catalog, 'type'))
  })

  test('an invalid difficulty fails', () => {
    const catalog = baseCatalog()
    catalog.packages[0].document.difficulty = 'brutal'
    assert.ok(failsOn(catalog, 'difficulty'))
  })

  test('a negative price fails', () => {
    const catalog = baseCatalog()
    catalog.packages[0].document.price = -1
    assert.ok(failsOn(catalog, 'price'))
  })

  test('a discount above the price fails', () => {
    const catalog = baseCatalog()
    catalog.packages[0].document.discountPrice = 500
    assert.ok(failsOn(catalog, 'discountPrice'))
  })

  test('booked seats above total seats fails', () => {
    const catalog = baseCatalog()
    catalog.fixedDepartures[0].document.bookedSeats = 99
    assert.ok(failsOn(catalog, 'bookedSeats'))
  })

  test('a negative seat count fails', () => {
    const catalog = baseCatalog()
    catalog.fixedDepartures[0].document.totalSeats = -1
    assert.ok(failsOn(catalog, 'totalSeats'))
  })

  test('an end date before the start date fails', () => {
    const catalog = baseCatalog()
    catalog.fixedDepartures[0].document.endDate = new Date('2027-01-01')
    assert.ok(failsOn(catalog, 'endDate'))
  })

  test('an unparseable date fails', () => {
    const catalog = baseCatalog()
    catalog.fixedDepartures[0].document.startDate = 'next spring'
    assert.ok(failsOn(catalog, 'startDate'))
  })

  test('a review rating outside 1..5 fails', () => {
    const catalog = baseCatalog()
    catalog.reviews[0].document.rating = 0
    assert.ok(failsOn(catalog, 'rating'))
  })

  test('a guide rating above 5 fails', () => {
    const catalog = baseCatalog()
    catalog.guides[0].document.rating = 6
    assert.ok(failsOn(catalog, 'rating'))
  })

  test('an unsafe image URL fails', () => {
    const catalog = baseCatalog()
    catalog.destinations[0].document.gallery = ['javascript:alert(1)']
    assert.ok(failsOn(catalog, 'gallery'))
  })

  test('an unsafe guide photo fails', () => {
    const catalog = baseCatalog()
    catalog.guides[0].document.photo = 'data:text/html,<script>'
    assert.ok(failsOn(catalog, 'photo'))
  })

  test('an FAQ entry missing its answer fails', () => {
    const catalog = baseCatalog()
    catalog.packages[0].document.faq = [{ question: 'Why?' }]
    assert.ok(validateCatalogSeed(catalog).problems.some((p) => p.field.startsWith('faq')))
  })

  test('a review targeting nothing fails', () => {
    const catalog = baseCatalog()
    catalog.reviews[0].relations = {}
    assert.ok(failsOn(catalog, 'packageId/guideId'))
  })

  test('a missing required field fails', () => {
    const catalog = baseCatalog()
    delete catalog.packages[0].document.title
    assert.ok(failsOn(catalog, 'title'))
  })

  test('a latitude outside range fails', () => {
    const catalog = baseCatalog()
    catalog.destinations[0].document.mapInfo = { latitude: 120, longitude: 85 }
    assert.ok(failsOn(catalog, 'mapInfo.latitude'))
  })

  test('a deferred booking id is recorded, not treated as an error', () => {
    const catalog = baseCatalog()
    catalog.reviews[0].relations.deferredBookingId = 'bkg-001'
    const result = validateCatalogSeed(catalog)
    assert.equal(result.ok, true)
    assert.equal(result.deferred.length, 1)
    assert.equal(result.deferred[0].field, 'bookingId')
  })

  test('every problem is collected, not just the first', () => {
    const catalog = baseCatalog()
    catalog.packages[0].document.price = -1
    catalog.packages[0].document.type = 'safari'
    catalog.destinations[0].document.status = 'live'
    assert.ok(validateCatalogSeed(catalog).problems.length >= 3)
  })
})
