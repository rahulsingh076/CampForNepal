// HTTP only: read inputs, call the service, send the standard envelope.
import { sendSuccess } from '../../utils/response.js'
import { listFixedDepartures } from './fixedDeparture.service.js'

export async function index(req, res) {
  const { items, meta } = await listFixedDepartures(req.query, req.app.locals.config)
  return sendSuccess(res, {
    message: 'Fixed departures retrieved successfully.',
    data: items,
    meta,
  })
}

export default { index }
