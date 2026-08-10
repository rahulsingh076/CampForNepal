import { Router } from 'express'
import requireAuth from '../../middleware/requireAuth.js'
import requireRole from '../../middleware/requireRole.js'
import {
  customerPrint,
  departureManifestPrint,
  destinationPrint,
  eventPrint,
  inquiryPrint,
  packageItineraryPrint,
  packagePrint,
} from './print.controller.js'

const CRM_ROLES = ['admin', 'super_admin']
const OPERATIONS_ROLES = ['admin', 'super_admin']

const router = Router()
export const adminPrintRouter = Router()

router.get('/packages/:slug', packagePrint)
router.get('/packages/:slug/itinerary', packageItineraryPrint)
router.get('/destinations/:slug', destinationPrint)
router.get('/events/:slug', eventPrint)

adminPrintRouter.get('/customers/:id', requireAuth, requireRole('admin', 'super_admin'), customerPrint)
adminPrintRouter.get('/inquiries/:id', requireAuth, requireRole(CRM_ROLES), inquiryPrint)
adminPrintRouter.get('/departures/:id/manifest', requireAuth, requireRole(OPERATIONS_ROLES), departureManifestPrint)

export default router
