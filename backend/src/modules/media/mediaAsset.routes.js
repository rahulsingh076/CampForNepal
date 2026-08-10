import { Router } from 'express'
import requireAuth from '../../middleware/requireAuth.js'
import requireRole from '../../middleware/requireRole.js'
import {
  adminCreate,
  adminDelete,
  adminIndex,
  adminShow,
  adminUpdate,
  publicIndex,
} from './mediaAsset.controller.js'

const CONTENT_ROLES = ['admin', 'super_admin']

const router = Router()
export const adminMediaRouter = Router()

router.get('/', publicIndex)

adminMediaRouter.get('/', requireAuth, requireRole(CONTENT_ROLES), adminIndex)
adminMediaRouter.get('/:id', requireAuth, requireRole(CONTENT_ROLES), adminShow)
adminMediaRouter.post('/', requireAuth, requireRole(CONTENT_ROLES), adminCreate)
adminMediaRouter.patch('/:id', requireAuth, requireRole(CONTENT_ROLES), adminUpdate)
adminMediaRouter.delete('/:id', requireAuth, requireRole(CONTENT_ROLES), adminDelete)

export default router
