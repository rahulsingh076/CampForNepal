// HTTP only: read inputs, call the service, send the standard envelope.
import { sendSuccess } from '../../utils/response.js'
import { getDestinationBySlug, listDestinations } from './destination.service.js'

export async function index(req, res) {
  const { items, meta } = await listDestinations(req.query, req.app.locals.config)
  return sendSuccess(res, {
    message: 'Destinations retrieved successfully.',
    data: items,
    meta,
  })
}

export async function show(req, res) {
  const destination = await getDestinationBySlug(req.params.slug)
  return sendSuccess(res, {
    message: 'Destination retrieved successfully.',
    data: destination,
  })
}

export default { index, show }
