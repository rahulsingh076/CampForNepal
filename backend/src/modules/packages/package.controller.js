// HTTP only. The trekking and expedition handlers pass a forced type into the
// same service rather than reimplementing the query.
import { sendSuccess } from '../../utils/response.js'
import { listDeparturesForPackage } from '../fixedDepartures/fixedDeparture.service.js'
import { listReviewsForPackage } from '../reviews/review.service.js'
import { getPackageBySlug, listPackages } from './package.service.js'

const LABELS = { trekking: 'Treks', expedition: 'Expeditions' }

export function makeIndex(forcedType = null) {
  return async function index(req, res) {
    const { items, meta } = await listPackages(req.query, req.app.locals.config, { forcedType })
    return sendSuccess(res, {
      message: `${forcedType ? LABELS[forcedType] : 'Packages'} retrieved successfully.`,
      data: items,
      meta,
    })
  }
}

export function makeShow(requiredType = null) {
  return async function show(req, res) {
    const found = await getPackageBySlug(req.params.slug, { requiredType })
    return sendSuccess(res, {
      message: 'Package retrieved successfully.',
      data: found,
    })
  }
}

// Nested convenience routes. Both exist because the frontend's package detail
// page already renders departures and reviews for one trip.
export async function departures(req, res) {
  const { items, meta } = await listDeparturesForPackage(
    req.params.slug,
    req.query,
    req.app.locals.config
  )
  return sendSuccess(res, {
    message: 'Fixed departures retrieved successfully.',
    data: items,
    meta,
  })
}

export async function reviews(req, res) {
  const { items, meta } = await listReviewsForPackage(
    req.params.slug,
    req.query,
    req.app.locals.config
  )
  return sendSuccess(res, {
    message: 'Reviews retrieved successfully.',
    data: items,
    meta,
  })
}

export default { makeIndex, makeShow, departures, reviews }
