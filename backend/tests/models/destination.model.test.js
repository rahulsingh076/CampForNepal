// Schema validation only — no database connection is opened.
import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import Destination from '../../src/modules/destinations/destination.model.js'
import { destinationFixture, expectInvalidPath, validationErrorFor } from '../helpers/modelFixtures.js'

describe('Destination model', () => {
  test('a complete destination passes validation', async () => {
    const error = await validationErrorFor(new Destination(destinationFixture()))
    assert.equal(error, null)
  })

  test('a missing title fails', async () => {
    const doc = new Destination(destinationFixture({ title: undefined }))
    assert.ok(await expectInvalidPath(doc, 'title'))
  })

  test('an empty title fails', async () => {
    const doc = new Destination(destinationFixture({ title: '   ' }))
    assert.ok(await expectInvalidPath(doc, 'title'))
  })

  test('a missing slug fails', async () => {
    const doc = new Destination(destinationFixture({ slug: undefined }))
    assert.ok(await expectInvalidPath(doc, 'slug'))
  })

  for (const badSlug of ['Everest Region', 'everest--region', '-everest', 'everest-', 'Everest_Region']) {
    test(`an invalid slug fails: ${JSON.stringify(badSlug)}`, async () => {
      const doc = new Destination(destinationFixture({ slug: badSlug }))
      assert.ok(await expectInvalidPath(doc, 'slug'), `expected ${badSlug} to be rejected`)
    })
  }

  test('a missing region fails, because the listing groups by it', async () => {
    const doc = new Destination(destinationFixture({ region: undefined }))
    assert.ok(await expectInvalidPath(doc, 'region'))
  })

  test('an unknown status fails', async () => {
    const doc = new Destination(destinationFixture({ status: 'live' }))
    assert.ok(await expectInvalidPath(doc, 'status'))
  })

  test('latitude outside -90..90 fails', async () => {
    const doc = new Destination(destinationFixture({ mapInfo: { latitude: 120, longitude: 85 } }))
    assert.ok(await expectInvalidPath(doc, 'mapInfo.latitude'))
  })

  test('longitude outside -180..180 fails', async () => {
    const doc = new Destination(destinationFixture({ mapInfo: { latitude: 27, longitude: 200 } }))
    assert.ok(await expectInvalidPath(doc, 'mapInfo.longitude'))
  })

  test('an unsafe gallery URL fails', async () => {
    const doc = new Destination(destinationFixture({ gallery: ['javascript:alert(1)'] }))
    assert.ok(await expectInvalidPath(doc, 'gallery'))
  })

  test('a protocol-relative gallery URL fails', async () => {
    const doc = new Destination(destinationFixture({ gallery: ['//evil.example.com/x.jpg'] }))
    assert.ok(await expectInvalidPath(doc, 'gallery'))
  })

  test('https and site-relative gallery URLs both pass', async () => {
    const doc = new Destination(
      destinationFixture({ gallery: ['https://cdn.example.com/a.jpg', '/images/b.jpg'] })
    )
    assert.equal(await validationErrorFor(doc), null)
  })

  test('public JSON exposes id as a string and hides _id', () => {
    const json = new Destination(destinationFixture()).toJSON()
    assert.equal(typeof json.id, 'string')
    assert.equal(json._id, undefined)
    assert.equal(json.__v, undefined)
    assert.equal(json.title, 'Sample Region')
  })

  test('status defaults to draft so nothing is published by accident', () => {
    const doc = new Destination(destinationFixture({ status: undefined }))
    assert.equal(doc.status, 'draft')
  })
})
