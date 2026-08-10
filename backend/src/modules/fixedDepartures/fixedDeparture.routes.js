// Paths only. No logic.
import { Router } from 'express'
import asyncHandler from '../../middleware/asyncHandler.js'
import { index } from './fixedDeparture.controller.js'

const router = Router()

router.get('/', asyncHandler(index))

export default router
