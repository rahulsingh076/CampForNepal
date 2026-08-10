// /packages, plus the /trekking and /expeditions aliases built from the same
// controller factories.
import { Router } from 'express'
import asyncHandler from '../../middleware/asyncHandler.js'
import { departures, makeIndex, makeShow, reviews } from './package.controller.js'

// All three routers share one implementation; only the enforced type differs.
function buildRouter(type = null) {
  const router = Router()
  router.get('/', asyncHandler(makeIndex(type)))
  router.get('/:slug', asyncHandler(makeShow(type)))

  // Nested reads only on /packages, so a trip's departures have one address.
  if (type === null) {
    router.get('/:slug/fixed-departures', asyncHandler(departures))
    router.get('/:slug/reviews', asyncHandler(reviews))
  }
  return router
}

export const packageRouter = buildRouter(null)
export const trekkingRouter = buildRouter('trekking')
export const expeditionRouter = buildRouter('expedition')

export default packageRouter
