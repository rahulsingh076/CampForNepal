import asyncHandler from '../../middleware/asyncHandler.js'
import { sendSuccess } from '../../utils/response.js'
import {
  createMedia,
  deleteMedia,
  getAdminMedia,
  listAdminMedia,
  listPublicMedia,
  updateMedia,
} from './mediaAsset.service.js'

export const publicIndex = asyncHandler(async (req, res) => {
  const { items, meta } = await listPublicMedia(req.query, req.app.locals.config)
  return sendSuccess(res, { message: 'Media retrieved successfully.', data: items, meta })
})

export const adminIndex = asyncHandler(async (req, res) => {
  const { items, meta } = await listAdminMedia(req.query, req.app.locals.config)
  return sendSuccess(res, { message: 'Media assets retrieved successfully.', data: items, meta })
})

export const adminShow = asyncHandler(async (req, res) => {
  const item = await getAdminMedia(req.params.id)
  return sendSuccess(res, { message: 'Media asset retrieved successfully.', data: item })
})

export const adminCreate = asyncHandler(async (req, res) => {
  const item = await createMedia(req.body, req.auth.userId)
  return sendSuccess(res, { status: 201, message: 'Media asset created.', data: item })
})

export const adminUpdate = asyncHandler(async (req, res) => {
  const item = await updateMedia(req.params.id, req.body, req.auth.userId)
  return sendSuccess(res, { message: 'Media asset updated.', data: item })
})

export const adminDelete = asyncHandler(async (req, res) => {
  const item = await deleteMedia(req.params.id, { force: req.query.force === 'true' })
  return sendSuccess(res, { message: 'Media asset deleted.', data: item })
})

