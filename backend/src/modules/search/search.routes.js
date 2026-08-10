import { Router } from 'express'
import requireAuth from '../../middleware/requireAuth.js'
import { requireStaff } from '../../middleware/requireRole.js'
import { adminIndex, publicIndex } from './search.controller.js'

const router = Router()
export const adminSearchRouter = Router()

router.get('/', publicIndex)
adminSearchRouter.get('/', requireAuth, requireStaff(), adminIndex)

export default router

