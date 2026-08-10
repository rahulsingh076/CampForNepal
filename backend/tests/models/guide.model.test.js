import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import Guide from '../../src/modules/guides/guide.model.js'
import { expectInvalidPath, guideFixture, validationErrorFor } from '../helpers/modelFixtures.js'

// Fields the frontend's publicGuide.js projection keeps private. If one of
// these stops being select:false, a public profile could leak it.
const PRIVATE_FIELDS = [
  'pricePerDay',
  'certifications',
  'verificationStatus',
  'availabilityStatus',
  'publicProfile',
  'status',
  'internalNotes',
]

describe('Guide model', () => {
  test('a complete guide passes validation', async () => {
    const error = await validationErrorFor(new Guide(guideFixture()))
    assert.equal(error, null)
  })

  test('a missing full name fails', async () => {
    const doc = new Guide(guideFixture({ fullName: undefined }))
    assert.ok(await expectInvalidPath(doc, 'fullName'))
  })

  test('an invalid slug fails', async () => {
    const doc = new Guide(guideFixture({ slug: 'Sample Guide' }))
    assert.ok(await expectInvalidPath(doc, 'slug'))
  })

  test('a rating above 5 fails', async () => {
    const doc = new Guide(guideFixture({ rating: 5.1 }))
    assert.ok(await expectInvalidPath(doc, 'rating'))
  })

  test('a negative rating fails', async () => {
    const doc = new Guide(guideFixture({ rating: -1 }))
    assert.ok(await expectInvalidPath(doc, 'rating'))
  })

  test('a rating of 0 is allowed for a guide with no reviews yet', async () => {
    const doc = new Guide(guideFixture({ rating: 0, totalReviews: 0 }))
    assert.equal(await validationErrorFor(doc), null)
  })

  test('negative experience fails', async () => {
    const doc = new Guide(guideFixture({ experienceYears: -2 }))
    assert.ok(await expectInvalidPath(doc, 'experienceYears'))
  })

  test('fractional experience fails', async () => {
    const doc = new Guide(guideFixture({ experienceYears: 4.5 }))
    assert.ok(await expectInvalidPath(doc, 'experienceYears'))
  })

  test('a negative day rate fails', async () => {
    const doc = new Guide(guideFixture({ pricePerDay: -10 }))
    assert.ok(await expectInvalidPath(doc, 'pricePerDay'))
  })

  test('an unknown verification status fails', async () => {
    const doc = new Guide(guideFixture({ verificationStatus: 'Verified' }))
    assert.ok(await expectInvalidPath(doc, 'verificationStatus'))
  })

  test('an unknown guide type fails', async () => {
    const doc = new Guide(guideFixture({ guideType: 'ski' }))
    assert.ok(await expectInvalidPath(doc, 'guideType'))
  })

  test('an unsafe photo URL fails', async () => {
    const doc = new Guide(guideFixture({ photo: 'javascript:alert(1)' }))
    assert.ok(await expectInvalidPath(doc, 'photo'))
  })

  test('every private field is select:false', () => {
    for (const field of PRIVATE_FIELDS) {
      assert.equal(
        Guide.schema.path(field).options.select,
        false,
        `${field} must be select:false so a normal query cannot load it`
      )
    }
  })

  test('private fields are absent from public JSON when not loaded', () => {
    // A default query does not load select:false paths, which is what this
    // document stands in for.
    const doc = new Guide({
      fullName: 'Sample Guide',
      slug: 'sample-guide',
      bio: 'Public bio.',
      guideType: 'trekking',
      experienceYears: 8,
      rating: 4.5,
    })
    const json = doc.toJSON()
    assert.equal(json.pricePerDay, undefined)
    assert.equal(json.certifications, undefined)
    assert.equal(json.internalNotes, undefined)
    assert.equal(json.fullName, 'Sample Guide')
    assert.equal(typeof json.id, 'string')
  })

  test('private fields are stripped even when explicitly populated', () => {
    // The important case: select:false stops a query loading a field, but a
    // document built in memory still materialises defaults. The JSON transform
    // removes them regardless, so privacy does not depend on how the document
    // was obtained.
    const doc = new Guide(guideFixture())
    const json = doc.toJSON()

    for (const field of PRIVATE_FIELDS) {
      assert.equal(json[field], undefined, `${field} must never reach public JSON`)
    }
    // Still readable on the document itself, for services that need it.
    assert.equal(doc.pricePerDay, 60)
    assert.equal(doc.verificationStatus, 'verified')
  })

  test('public fields remain public', () => {
    const publicFields = ['fullName', 'slug', 'photo', 'bio', 'guideType', 'languages', 'regions', 'experienceYears', 'rating', 'totalReviews', 'summitsOrTrips']
    for (const field of publicFields) {
      assert.notEqual(
        Guide.schema.path(field).options.select,
        false,
        `${field} is part of the public profile and must not be select:false`
      )
    }
  })
})
