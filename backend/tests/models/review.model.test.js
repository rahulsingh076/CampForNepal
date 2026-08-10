import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import Review from '../../src/modules/reviews/review.model.js'
import {
  expectInvalidPath,
  objectId,
  reviewFixture,
  validationErrorFor,
} from '../helpers/modelFixtures.js'

describe('Review model', () => {
  test('a complete review passes validation', async () => {
    const error = await validationErrorFor(new Review(reviewFixture()))
    assert.equal(error, null)
  })

  test('a missing rating fails', async () => {
    const doc = new Review(reviewFixture({ rating: undefined }))
    assert.ok(await expectInvalidPath(doc, 'rating'))
  })

  test('a rating below 1 fails', async () => {
    const doc = new Review(reviewFixture({ rating: 0 }))
    assert.ok(await expectInvalidPath(doc, 'rating'))
  })

  test('a rating above 5 fails', async () => {
    const doc = new Review(reviewFixture({ rating: 6 }))
    assert.ok(await expectInvalidPath(doc, 'rating'))
  })

  test('every rating from 1 to 5 is accepted', async () => {
    for (const rating of [1, 2, 3, 4, 5]) {
      const doc = new Review(reviewFixture({ rating }))
      assert.equal(await validationErrorFor(doc), null, `${rating} should be valid`)
    }
  })

  test('missing review text fails', async () => {
    const doc = new Review(reviewFixture({ reviewText: undefined }))
    assert.ok(await expectInvalidPath(doc, 'reviewText'))
  })

  test('blank review text fails', async () => {
    const doc = new Review(reviewFixture({ reviewText: '    ' }))
    assert.ok(await expectInvalidPath(doc, 'reviewText'))
  })

  test('a missing reviewer name fails', async () => {
    const doc = new Review(reviewFixture({ customerName: undefined }))
    assert.ok(await expectInvalidPath(doc, 'customerName'))
  })

  test('a review of neither a trip nor a guide fails', async () => {
    const doc = new Review(reviewFixture({ packageId: null, guideId: null }))
    assert.ok(await expectInvalidPath(doc, 'packageId'))
  })

  test('a guide review with no packageId is valid', async () => {
    const doc = new Review(reviewFixture({ packageId: null, guideId: objectId() }))
    assert.equal(await validationErrorFor(doc), null)
  })

  test('an unknown moderation status fails', async () => {
    const doc = new Review(reviewFixture({ status: 'live' }))
    assert.ok(await expectInvalidPath(doc, 'status'))
  })

  test('status defaults to pending, so nothing publishes itself', () => {
    const doc = new Review(reviewFixture({ status: undefined }))
    assert.equal(doc.status, 'pending')
  })

  test('verifiedBooking defaults to false', () => {
    const doc = new Review(reviewFixture({ verifiedBooking: undefined }))
    assert.equal(doc.verifiedBooking, false)
  })

  test('featured defaults to false', () => {
    assert.equal(new Review(reviewFixture()).featured, false)
  })

  test('bookingId accepts an ObjectId without a registered Booking model', async () => {
    // Declared without a `ref` on purpose: referencing an unregistered model
    // would make a future populate() throw MissingSchemaError.
    const doc = new Review(reviewFixture({ bookingId: objectId() }))
    assert.equal(await validationErrorFor(doc), null)
    assert.equal(Review.schema.path('bookingId').options.ref, undefined)
  })

  test('public JSON exposes id and hides _id', () => {
    const json = new Review(reviewFixture()).toJSON()
    assert.equal(typeof json.id, 'string')
    assert.equal(json._id, undefined)
  })
})
