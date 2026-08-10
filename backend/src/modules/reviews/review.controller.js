// HTTP only: read inputs, call the service, send the standard envelope.
import { sendSuccess } from '../../utils/response.js'
import { listReviews } from './review.service.js'

export async function index(req, res) {
  const { items, meta } = await listReviews(req.query, req.app.locals.config)
  return sendSuccess(res, {
    message: 'Reviews retrieved successfully.',
    data: items,
    meta,
  })
}

export default { index }
