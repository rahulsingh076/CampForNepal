import assert from 'node:assert/strict'
import {
  DEFAULT_EVENT_STATUS,
  EVENT_STATUSES,
  PUBLIC_EVENT_STATUSES,
} from '../src/constants/eventStatuses.js'
import {
  DEFAULT_MEDIA_STATUS,
  MEDIA_SOURCE_TYPES,
  MEDIA_STATUSES,
  MEDIA_TYPES,
  PUBLIC_MEDIA_STATUS,
} from '../src/constants/mediaStatuses.js'
import eventRoutes, { adminEventRouter } from '../src/modules/events/event.routes.js'
import mediaRoutes, { adminMediaRouter } from '../src/modules/media/mediaAsset.routes.js'
import printRoutes, { adminPrintRouter } from '../src/modules/print/print.routes.js'
import searchRoutes, { adminSearchRouter } from '../src/modules/search/search.routes.js'

function routeSignatures(router) {
  return router.stack
    .filter((layer) => layer.route)
    .flatMap((layer) => Object.keys(layer.route.methods).map((method) => `${method.toUpperCase()} ${layer.route.path}`))
    .sort()
}

function requireRoutes(label, router, expected) {
  const actual = routeSignatures(router)
  for (const signature of expected) {
    assert.ok(actual.includes(signature), `${label} missing ${signature}. Saw ${actual.join(', ')}`)
  }
}

assert.deepEqual(MEDIA_TYPES, Object.freeze(['image', 'video', 'reel']))
assert.ok(MEDIA_SOURCE_TYPES.includes('local_asset'))
assert.ok(MEDIA_SOURCE_TYPES.includes('youtube'))
assert.ok(MEDIA_STATUSES.includes(PUBLIC_MEDIA_STATUS))
assert.equal(DEFAULT_MEDIA_STATUS, 'draft')

assert.ok(EVENT_STATUSES.includes('published'))
assert.ok(PUBLIC_EVENT_STATUSES.includes('cancelled'))
assert.equal(DEFAULT_EVENT_STATUS, 'draft')

requireRoutes('public media', mediaRoutes, ['GET /'])
requireRoutes('admin media', adminMediaRouter, ['GET /', 'GET /:id', 'POST /', 'PATCH /:id', 'DELETE /:id'])
requireRoutes('public events', eventRoutes, ['GET /', 'GET /:slug'])
requireRoutes('admin events', adminEventRouter, ['GET /', 'GET /:id', 'POST /', 'PATCH /:id', 'DELETE /:id'])
requireRoutes('public search', searchRoutes, ['GET /'])
requireRoutes('admin search', adminSearchRouter, ['GET /'])
requireRoutes('public print', printRoutes, ['GET /packages/:slug', 'GET /packages/:slug/itinerary', 'GET /destinations/:slug', 'GET /events/:slug'])
requireRoutes('admin print', adminPrintRouter, ['GET /customers/:id', 'GET /inquiries/:id', 'GET /departures/:id/manifest'])

console.log('B08 media/events/search/print verification passed')
