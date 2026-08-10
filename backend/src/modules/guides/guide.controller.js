// HTTP only: read inputs, call the service, send the standard envelope.
import { sendSuccess } from '../../utils/response.js'
import { listGuides, getGuideBySlug } from './guide.service.js'

export async function index(req, res) {
  const { items, meta } = await listGuides(req.query, req.app.locals.config)
  return sendSuccess(res, {
    message: 'Guides retrieved successfully.',
    data: items,
    meta,
  })
}

export async function show(req, res) {
  const record = await getGuideBySlug(req.params.slug)
  return sendSuccess(res, {
    message: 'Guide retrieved successfully.',
    data: record,
  })
}

export default { index, show }
