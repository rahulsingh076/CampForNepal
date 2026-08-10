import { Router } from 'express'
import requireAuth from '../../middleware/requireAuth.js'
import requireRole from '../../middleware/requireRole.js'
import {
  adminCreate,
  adminDelete,
  adminIndex,
  adminShow,
  adminUpdate,
  index,
  show,
} from './event.controller.js'

const CONTENT_ROLES = ['admin', 'super_admin']

const router = Router()
export const adminEventRouter = Router()

router.get('/', index)
router.get('/:slug', show)

adminEventRouter.get('/', requireAuth, requireRole(CONTENT_ROLES), adminIndex)
adminEventRouter.get('/:id', requireAuth, requireRole(CONTENT_ROLES), adminShow)
adminEventRouter.post('/', requireAuth, requireRole(CONTENT_ROLES), adminCreate)
adminEventRouter.patch('/:id', requireAuth, requireRole(CONTENT_ROLES), adminUpdate)
adminEventRouter.delete('/:id', requireAuth, requireRole(CONTENT_ROLES), adminDelete)

export default router
