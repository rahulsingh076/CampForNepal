// Paths only. No logic.
import { Router } from 'express'
import asyncHandler from '../../middleware/asyncHandler.js'
import { index } from './review.controller.js'

const router = Router()

router.get('/', asyncHandler(index))

export default router
