import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import Event from '../../src/modules/events/event.model.js'
import MediaAsset from '../../src/modules/media/mediaAsset.model.js'
import { expectInvalidPath, validationErrorFor } from '../helpers/modelFixtures.js'

function mediaFixture(overrides = {}) {
  return {
    title: 'Sample media',
    slug: 'sample-media',
    type: 'image',
    sourceType: 'local_asset',
    sourceUrl: '/images/sample/media.jpg',
    alt: 'Sample media used by the test suite.',
    focalPosition: '50% 50%',
    status: 'published',
    ...overrides,
  }
}

function eventFixture(overrides = {}) {
  return {
    title: 'Sample Event',
    slug: 'sample-event',
    eventType: 'information_session',
    shortDescription: 'A short event summary used by tests.',
    fullDescription: 'A longer event description used by tests.',
    startDateTime: new Date('2027-04-01T09:00:00.000Z'),
    endDateTime: new Date('2027-04-01T11:00:00.000Z'),
    timezone: 'Asia/Kathmandu',
    mapLink: 'https://maps.example.test/sample',
    ctaLink: '/contact',
    status: 'published',
    ...overrides,
  }
}

describe('MediaAsset model', () => {
  test('accepts a local image asset reference', async () => {
    assert.equal(await validationErrorFor(new MediaAsset(mediaFixture())), null)
  })

  test('accepts a local video asset reference without storing binary content', async () => {
    const doc = new MediaAsset(mediaFixture({
      type: 'video',
      sourceUrl: '/media/library/sample-video.mp4',
      thumbnailUrl: '/images/sample/video-poster.jpg',
    }))
    assert.equal(await validationErrorFor(doc), null)
    assert.equal(doc.toJSON().sourceUrl, '/media/library/sample-video.mp4')
    assert.equal(doc.toJSON().binary, undefined)
  })

  test('accepts provider-matched YouTube video URLs', async () => {
    const doc = new MediaAsset(mediaFixture({
      type: 'video',
      sourceType: 'youtube',
      sourceUrl: 'https://www.youtube.com/watch?v=sample',
      thumbnailUrl: '/images/sample/video-poster.jpg',
    }))
    assert.equal(await validationErrorFor(doc), null)
  })

  test('rejects a provider mismatch', async () => {
    const doc = new MediaAsset(mediaFixture({
      type: 'video',
      sourceType: 'youtube',
      sourceUrl: 'https://vimeo.com/123',
    }))
    assert.ok(await expectInvalidPath(doc, 'sourceUrl'))
  })

  test('rejects unsafe source and thumbnail URLs', async () => {
    assert.ok(await expectInvalidPath(new MediaAsset(mediaFixture({ sourceUrl: 'javascript:alert(1)' })), 'sourceUrl'))
    assert.ok(await expectInvalidPath(new MediaAsset(mediaFixture({ thumbnailUrl: 'file:///tmp/poster.jpg' })), 'thumbnailUrl'))
  })
})

describe('Event model', () => {
  test('accepts a public event without ticket or payment fields', async () => {
    const doc = new Event(eventFixture())
    assert.equal(await validationErrorFor(doc), null)
    assert.equal(doc.toJSON().ticketPrice, undefined)
    assert.equal(doc.toJSON().payment, undefined)
  })

  test('allows safe external CTAs but rejects unsafe links', async () => {
    assert.equal(await validationErrorFor(new Event(eventFixture({ ctaLink: 'https://example.test/register-interest' }))), null)
    assert.ok(await expectInvalidPath(new Event(eventFixture({ ctaLink: 'javascript:alert(1)' })), 'ctaLink'))
  })

  test('rejects an event end before its start', async () => {
    const doc = new Event(eventFixture({ endDateTime: new Date('2027-03-31T09:00:00.000Z') }))
    assert.ok(await expectInvalidPath(doc, 'endDateTime'))
  })

  test('rejects unsafe map links', async () => {
    const doc = new Event(eventFixture({ mapLink: 'data:text/html,<script>' }))
    assert.ok(await expectInvalidPath(doc, 'mapLink'))
  })
})
