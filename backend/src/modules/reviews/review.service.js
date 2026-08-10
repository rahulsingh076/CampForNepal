// Review reads. Published reviews only — pending and rejected never appear.
import {
  GUIDE_SUMMARY_FIELDS,
  PACKAGE_SUMMARY_FIELDS,
  publishedOnly,
  publishedReviewsOnly,
  REVIEW_PUBLIC_FIELDS,
} from '../../database/publicVisibility.js'
import {
  buildPageMeta,
  parseBoolean,
  parseList,
  parseNumber,
  parsePagination,
  parseSort,
  sortToObject,
} from '../../database/publicQuery.js'
import ApiError from '../../utils/ApiError.js'
import Package from '../packages/package.model.js'
import Review from './review.model.js'

const SORTABLE = ['createdAt', 'rating', 'publishedAt']
const DEFAULT_SORT = '-createdAt'

function objectIdOrThrow(raw, name) {
  const value = String(raw).trim()
  if (!/^[a-f0-9]{24}$/i.test(value)) {
    throw ApiError.badRequest(`"${name}" must be a valid id.`)
  }
  return value
}

function buildFilters(query) {
  const filter = { ...publishedReviewsOnly() }
  const applied = {}

  if (query.packageId !== undefined) {
    const id = objectIdOrThrow(query.packageId, 'packageId')
    filter.packageId = id
    applied.packageId = id
  }
  if (query.guideId !== undefined) {
    const id = objectIdOrThrow(query.guideId, 'guideId')
    filter.guideId = id
    applied.guideId = id
  }

  const countries = parseList(query.country, 'country')
  if (countries) {
    filter.country = { $in: countries.map((code) => code.toUpperCase()) }
    applied.country = countries
  }

  const rating = parseNumber(query.rating, 'rating', { min: 1 })
  if (rating !== undefined) {
    if (rating > 5) throw ApiError.badRequest('"rating" cannot be greater than 5.')
    filter.rating = rating
    applied.rating = rating
  }

  const featured = parseBoolean(query.featured, 'featured')
  if (featured !== undefined) {
    filter.featured = featured
    applied.featured = featured
  }

  return { filter, applied }
}

export async function listReviews(query, config) {
  const { page, limit, skip } = parsePagination(query, config)
  const sort = parseSort(query.sort, SORTABLE, DEFAULT_SORT)
  const { filter, applied } = buildFilters(query)

  // Deliberately NOT .lean(): lean() returns plain driver objects and bypasses
  // the schema toJSON transform, so the response would carry a raw _id, no
  // string `id`, no virtuals, and no select:false stripping.
  const [items, total] = await Promise.all([
    Review.find(filter)
      .select(REVIEW_PUBLIC_FIELDS)
      .populate({ path: 'packageId', match: publishedOnly(), select: PACKAGE_SUMMARY_FIELDS })
      .populate({ path: 'guideId', match: { status: 'published', publicProfile: true }, select: GUIDE_SUMMARY_FIELDS })
      .sort(sortToObject(sort))
      .skip(skip)
      .limit(limit),
    Review.countDocuments(filter),
  ])

  return { items, meta: { ...buildPageMeta({ page, limit, total }), filters: applied, sort } }
}

// Backs GET /packages/:slug/reviews.
export async function listReviewsForPackage(slug, query, config) {
  const parent = await Package.findOne({ ...publishedOnly(), slug: String(slug).toLowerCase() })
    .select('_id')
    .lean()
  if (!parent) throw ApiError.notFound('Package not found.')

  return listReviews({ ...query, packageId: String(parent._id) }, config)
}

export default { listReviews, listReviewsForPackage }
