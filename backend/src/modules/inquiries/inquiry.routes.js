// Inquiry routes: one public submission endpoint, six admin CRM endpoints.
//
// A factory, because the public rate limiter needs its window and budget from
// configuration at construction time.
//
// CSRF is not applied here: it is global for every unsafe method in app.js, so
// a route added later cannot forget it. That includes the public POST — an
// anonymous endpoint is still a browser endpoint, and a forged submission is
// exactly what an attacker would use to flood the CRM.
import { Router } from 'express'
import inquiryRateLimit from '../../middleware/inquiryRateLimit.js'
import requireAuth from '../../middleware/requireAuth.js'
import requireRole from '../../middleware/requireRole.js'
import inquiryController from './inquiry.controller.js'

const CRM_ROLES = ['admin', 'super_admin']

// The owner asked for one admin dashboard plus super admin, so all CRM handling
// and assignment work shares the same explicit allowlist.
const CRM_READERS = CRM_ROLES
const CRM_HANDLERS = CRM_ROLES
const CRM_MANAGERS = CRM_ROLES

export default function createInquiryRoutes(config) {
  const router = Router()

  // Public. Anonymous, CSRF protected, rate limited.
  router.post('/', inquiryRateLimit(config), inquiryController.createInquiry)

  // Everything below is staff only. requireAuth first, always — it loads the
  // user from the database, so requireRole checks a live role rather than one
  // cached in a session.
  router.get('/', requireAuth, requireRole(CRM_READERS), inquiryController.listInquiries)
  router.get('/:id', requireAuth, requireRole(CRM_READERS), inquiryController.getInquiry)

  router.patch('/:id/status', requireAuth, requireRole(CRM_HANDLERS), inquiryController.updateStatus)
  router.patch('/:id/follow-up', requireAuth, requireRole(CRM_HANDLERS), inquiryController.updateFollowUp)
  router.post('/:id/notes', requireAuth, requireRole(CRM_HANDLERS), inquiryController.addNote)

  router.patch('/:id/assignment', requireAuth, requireRole(CRM_MANAGERS), inquiryController.updateAssignment)
  router.patch('/:id/priority', requireAuth, requireRole(CRM_MANAGERS), inquiryController.updatePriority)

  // Deliberately absent: there is no DELETE. An inquiry is somebody's request
  // for help and part of the audit trail; it is closed, never erased.
  //
  // Also absent: POST /:id/convert. Conversion creates a booking, which belongs
  // in the future booking workflow.

  return router
}

export { CRM_READERS, CRM_HANDLERS, CRM_MANAGERS }
