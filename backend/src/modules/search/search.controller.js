import asyncHandler from '../../middleware/asyncHandler.js'
import { sendSuccess } from '../../utils/response.js'
import { adminGlobalSearch, publicSearch } from './search.service.js'

export const publicIndex = asyncHandler(async (req, res) => {
  const { items, meta } = await publicSearch(req.query, req.app.locals.config)
  return sendSuccess(res, { message: 'Search results retrieved successfully.', data: items, meta })
})

export const adminIndex = asyncHandler(async (req, res) => {
  const { items, meta } = await adminGlobalSearch(req.query, req.app.locals.config, req.user.role)
  return sendSuccess(res, { message: 'Admin search results retrieved successfully.', data: items, meta })
})

