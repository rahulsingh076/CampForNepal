import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import { cleanEventPayload } from '../../src/modules/events/event.service.js'
import { cleanMediaPayload } from '../../src/modules/media/mediaAsset.service.js'

const throwsStatus = (status, fn) => {
  try {
    fn()
    return false
  } catch (error) {
    return error.status === status
  }
}

describe('media payload cleaning', () => {
  test('create requires a title and source reference', () => {
    assert.ok(throwsStatus(400, () => cleanMediaPayload({}, { create: true })))
    assert.ok(throwsStatus(400, () => cleanMediaPayload({ title: 'Only title' }, { create: true })))
  })

  test('create keeps local asset references and metadata', () => {
    const payload = cleanMediaPayload({
      title: '  Camp Photo  ',
      type: 'image',
      sourceType: 'local_asset',
      sourceUrl: '/media/library/camp-photo.jpg',
      tags: [' trek ', '', 'Nepal'],
      attributionRequired: true,
    }, { create: true })

    assert.equal(payload.title, 'Camp Photo')
    assert.equal(payload.slug, 'camp-photo')
    assert.equal(payload.sourceUrl, '/media/library/camp-photo.jpg')
    assert.deepEqual(payload.tags, ['trek', 'Nepal'])
    assert.equal(payload.attributionRequired, true)
  })

  test('partial media update does not clear omitted metadata', () => {
    const payload = cleanMediaPayload({ title: 'New title' })
    assert.deepEqual(Object.keys(payload).sort(), ['slug', 'title'].sort())
  })
})

describe('event payload cleaning', () => {
  test('create requires a title and start date', () => {
    assert.ok(throwsStatus(400, () => cleanEventPayload({}, { create: true })))
    assert.ok(throwsStatus(400, () => cleanEventPayload({ title: 'Only title' }, { create: true })))
  })

  test('create normalises text, dates, media arrays, and SEO keywords', () => {
    const payload = cleanEventPayload({
      title: '  Planning Session  ',
      startDateTime: '2027-04-01T09:00:00Z',
      gallery: ['/images/sample/event.jpg'],
      videos: [{ type: 'video', sourceType: 'youtube', src: 'https://www.youtube.com/watch?v=sample' }],
      seo: { keywords: [' event ', '', 'trek'] },
      featured: true,
    }, { create: true })

    assert.equal(payload.title, 'Planning Session')
    assert.equal(payload.slug, 'planning-session')
    assert.ok(payload.startDateTime instanceof Date)
    assert.deepEqual(payload.gallery, ['/images/sample/event.jpg'])
    assert.equal(payload.videos[0].type, 'video')
    assert.deepEqual(payload.seo.keywords, ['event', 'trek'])
    assert.equal(payload.featured, true)
  })

  test('partial event update does not clear omitted relationships or media', () => {
    const payload = cleanEventPayload({ title: 'Renamed Event' })
    assert.deepEqual(Object.keys(payload).sort(), ['slug', 'title'].sort())
  })

  test('explicit cover null is preserved so a cover can be detached', () => {
    const payload = cleanEventPayload({ coverMedia: null })
    assert.equal(payload.coverMedia, null)
  })
})
