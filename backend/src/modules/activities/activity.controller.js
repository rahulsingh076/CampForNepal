// HTTP only: read inputs, call the service, send the standard envelope.
import { sendSuccess } from '../../utils/response.js'
import { listActivities, getActivityBySlug } from './activity.service.js'

export async function index(req, res) {
  const { items, meta } = await listActivities(req.query, req.app.locals.config)
  return sendSuccess(res, {
    message: 'Activities retrieved successfully.',
    data: items,
    meta,
  })
}

export async function show(req, res) {
  const record = await getActivityBySlug(req.params.slug)
  return sendSuccess(res, {
    message: 'Activity retrieved successfully.',
    data: record,
  })
}

export default { index, show }
