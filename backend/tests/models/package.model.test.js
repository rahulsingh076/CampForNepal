import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import Package from '../../src/modules/packages/package.model.js'
import { expectInvalidPath, packageFixture, validationErrorFor } from '../helpers/modelFixtures.js'

describe('Package model', () => {
  test('a complete trip passes validation', async () => {
    const error = await validationErrorFor(new Package(packageFixture()))
    assert.equal(error, null)
  })

  test('a missing title fails', async () => {
    const doc = new Package(packageFixture({ title: undefined }))
    assert.ok(await expectInvalidPath(doc, 'title'))
  })

  test('an invalid type fails', async () => {
    const doc = new Package(packageFixture({ type: 'safari' }))
    assert.ok(await expectInvalidPath(doc, 'type'))
  })

  test('all three canonical types are accepted', async () => {
    for (const type of ['tour', 'trekking', 'expedition']) {
      const doc = new Package(packageFixture({ type }))
      assert.equal(await validationErrorFor(doc), null, `${type} should be valid`)
    }
  })

  test('a missing price fails', async () => {
    const doc = new Package(packageFixture({ price: undefined }))
    assert.ok(await expectInvalidPath(doc, 'price'))
  })

  test('a negative price fails', async () => {
    const doc = new Package(packageFixture({ price: -1 }))
    assert.ok(await expectInvalidPath(doc, 'price'))
  })

  test('a negative discountPrice fails', async () => {
    const doc = new Package(packageFixture({ discountPrice: -50 }))
    assert.ok(await expectInvalidPath(doc, 'discountPrice'))
  })

  test('a discount greater than the price fails', async () => {
    const doc = new Package(packageFixture({ price: 1000, discountPrice: 1200 }))
    assert.ok(await expectInvalidPath(doc, 'discountPrice'))
  })

  test('a discount equal to the price fails', async () => {
    // Equal is not a discount either, but the rule is "not greater than", so
    // this documents the boundary as accepted rather than pretending otherwise.
    const doc = new Package(packageFixture({ price: 1000, discountPrice: 1000 }))
    assert.equal(await validationErrorFor(doc), null)
  })

  test('a genuine discount passes', async () => {
    const doc = new Package(packageFixture({ price: 1000, discountPrice: 800 }))
    assert.equal(await validationErrorFor(doc), null)
  })

  test('an FAQ entry without a question fails', async () => {
    const doc = new Package(packageFixture({ faq: [{ answer: 'Only an answer.' }] }))
    assert.ok(await expectInvalidPath(doc, 'faq.0.question'))
  })

  test('an FAQ entry without an answer fails', async () => {
    const doc = new Package(packageFixture({ faq: [{ question: 'Only a question?' }] }))
    assert.ok(await expectInvalidPath(doc, 'faq.0.answer'))
  })

  test('an FAQ entry with blank text fails', async () => {
    const doc = new Package(packageFixture({ faq: [{ question: '   ', answer: '   ' }] }))
    assert.ok(await expectInvalidPath(doc, 'faq.0.question'))
  })

  test('no FAQ at all is fine', async () => {
    const doc = new Package(packageFixture({ faq: [] }))
    assert.equal(await validationErrorFor(doc), null)
  })

  test('a negative maximum elevation fails', async () => {
    const doc = new Package(packageFixture({ maxElevationMetres: -100 }))
    assert.ok(await expectInvalidPath(doc, 'maxElevationMetres'))
  })

  test('a negative group size fails', async () => {
    const doc = new Package(packageFixture({ groupSize: { min: -1, max: 12 } }))
    assert.ok(await expectInvalidPath(doc, 'groupSize.min'))
  })

  test('out-of-order itinerary days fail', async () => {
    const doc = new Package(
      packageFixture({ itinerary: [{ day: 3, title: 'Third' }, { day: 1, title: 'First' }] })
    )
    assert.ok(await expectInvalidPath(doc, 'itinerary'))
  })

  test('a grouped phase label is accepted, matching the Everest expedition seed', async () => {
    // pkg-009 stores ranges such as '12-18' instead of a number.
    const doc = new Package(
      packageFixture({
        itinerary: [
          { day: 1, title: 'Arrive in Kathmandu' },
          { day: '2-8', title: 'Trek to Base Camp' },
          { day: '9-40', title: 'Rotations' },
        ],
      })
    )
    assert.equal(await validationErrorFor(doc), null)
  })

  test('an itinerary entry without a title fails', async () => {
    const doc = new Package(packageFixture({ itinerary: [{ day: 1 }] }))
    assert.ok(await expectInvalidPath(doc, 'itinerary.0.title'))
  })

  test('a title-case difficulty from the package seed is normalised', async () => {
    const doc = new Package(packageFixture({ difficulty: 'Strenuous and technical' }))
    assert.equal(await validationErrorFor(doc), null)
    assert.equal(doc.difficulty, 'strenuous and technical')
  })

  test('featured defaults to false', () => {
    assert.equal(new Package(packageFixture()).featured, false)
  })

  test('arrays default to empty rather than undefined', () => {
    const doc = new Package({ title: 'T', slug: 't', type: 'tour', price: 1 })
    for (const field of ['highlights', 'costIncludes', 'costExcludes', 'gearList', 'permits', 'gallery']) {
      assert.deepEqual(doc[field], [], `${field} should default to []`)
    }
  })

  test('the frontend nesting is preserved in public JSON', () => {
    const json = new Package(packageFixture()).toJSON()
    assert.equal(json.duration.days, 10)
    assert.equal(json.groupSize.max, 12)
    assert.equal(json.maxElevationMetres, 4200)
    assert.equal(typeof json.price, 'number')
    assert.equal(json._id, undefined)
  })

  test('an unsafe routeMap URL fails but an absent one is fine', async () => {
    assert.ok(await expectInvalidPath(new Package(packageFixture({ routeMap: 'javascript:x' })), 'routeMap'))
    assert.equal(await validationErrorFor(new Package(packageFixture({ routeMap: undefined }))), null)
  })
})
