// The API router. Every feature module is mounted here, and this router is
// mounted once in app.js beneath API_PREFIX — so a prefix change is one edit.
//
// A factory rather than a module-level router: the auth routes build rate
// limiters from configuration, which is not available at import time.
import { Router } from 'express'
import activityRoutes from '../modules/activities/activity.routes.js'
import createAuthRoutes from '../modules/auth/auth.routes.js'
import destinationRoutes from '../modules/destinations/destination.routes.js'
import eventRoutes, { adminEventRouter } from '../modules/events/event.routes.js'
import fixedDepartureRoutes from '../modules/fixedDepartures/fixedDeparture.routes.js'
import guideRoutes from '../modules/guides/guide.routes.js'
import healthRoutes from '../modules/health/health.routes.js'
import createInquiryRoutes from '../modules/inquiries/inquiry.routes.js'
import mediaRoutes, { adminMediaRouter } from '../modules/media/mediaAsset.routes.js'
import { expeditionRouter, packageRouter, trekkingRouter } from '../modules/packages/package.routes.js'
import printRoutes, { adminPrintRouter } from '../modules/print/print.routes.js'
import reviewRoutes from '../modules/reviews/review.routes.js'
import searchRoutes, { adminSearchRouter } from '../modules/search/search.routes.js'

export default function createApiRouter(config) {
  const router = Router()

  router.use('/health', healthRoutes)

  router.use('/auth', createAuthRoutes(config))

  // Public catalogue reads. Every one is read-only: there is no POST, PATCH,
  // PUT, or DELETE endpoint for catalogue resources.
  router.use('/destinations', destinationRoutes)
  router.use('/activities', activityRoutes)
  router.use('/packages', packageRouter)
  router.use('/events', eventRoutes)
  router.use('/media', mediaRoutes)
  router.use('/search', searchRoutes)
  router.use('/print', printRoutes)

  router.use('/admin/events', adminEventRouter)
  router.use('/admin/media', adminMediaRouter)
  router.use('/admin/global-search', adminSearchRouter)
  router.use('/admin/print', adminPrintRouter)

  // Aliases over the same Package service, with the type enforced inside.
  router.use('/trekking', trekkingRouter)
  router.use('/expeditions', expeditionRouter)

  // Public submission plus the staff CRM, guarded per route inside.
  router.use('/inquiries', createInquiryRoutes(config))

  router.use('/fixed-departures', fixedDepartureRoutes)
  router.use('/guides', guideRoutes)
  router.use('/reviews', reviewRoutes)

  return router
}
