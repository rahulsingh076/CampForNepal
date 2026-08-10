import asyncHandler from '../../middleware/asyncHandler.js'
import { sendSuccess } from '../../utils/response.js'
import {
  createEvent,
  deleteEvent,
  getAdminEvent,
  getPublicEvent,
  listAdminEvents,
  listPublicEvents,
  updateEvent,
} from './event.service.js'

export const index = asyncHandler(async (req, res) => {
  const { items, meta } = await listPublicEvents(req.query, req.app.locals.config)
  return sendSuccess(res, { message: 'Events retrieved successfully.', data: items, meta })
})

export const show = asyncHandler(async (req, res) => {
  const item = await getPublicEvent(req.params.slug)
  return sendSuccess(res, { message: 'Event retrieved successfully.', data: item })
})

export const adminIndex = asyncHandler(async (req, res) => {
  const { items, meta } = await listAdminEvents(req.query, req.app.locals.config)
  return sendSuccess(res, { message: 'Events retrieved successfully.', data: items, meta })
})

export const adminShow = asyncHandler(async (req, res) => {
  const item = await getAdminEvent(req.params.id)
  return sendSuccess(res, { message: 'Event retrieved successfully.', data: item })
})

export const adminCreate = asyncHandler(async (req, res) => {
  const item = await createEvent(req.body)
  return sendSuccess(res, { status: 201, message: 'Event created.', data: item })
})

export const adminUpdate = asyncHandler(async (req, res) => {
  const item = await updateEvent(req.params.id, req.body)
  return sendSuccess(res, { message: 'Event updated.', data: item })
})

export const adminDelete = asyncHandler(async (req, res) => {
  const item = await deleteEvent(req.params.id)
  return sendSuccess(res, { message: 'Event deleted.', data: item })
})

