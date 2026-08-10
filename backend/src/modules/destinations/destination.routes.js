// Paths only. No logic.
import { Router } from 'express'
import asyncHandler from '../../middleware/asyncHandler.js'
import { index, show } from './destination.controller.js'

const router = Router()

router.get('/', asyncHandler(index))
router.get('/:slug', asyncHandler(show))

export default router
