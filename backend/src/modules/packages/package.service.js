// Package reads. Also serves /trekking and /expeditions, which are the same
// query with `type` forced — the logic is not duplicated.
import { DIFFICULTY_LEVELS } from '../../constants/difficultyLevels.js'
import { PACKAGE_TYPES } from '../../constants/packageTypes.js'
import {
  ACTIVITY_SUMMARY_FIELDS,
  DESTINATION_SUMMARY_FIELDS,
  PACKAGE_PUBLIC_FIELDS,
  publishedOnly,
} from '../../database/publicVisibility.js'
import {
  buildPageMeta,
  parseBoolean,
  parseEnum,
  parseList,
  parseNumericRange,
  parsePagination,
  parseSearch,
  parseSort,
  searchFilter,
  sortToObject,
} from '../../database/publicQuery.js'
import ApiError from '../../utils/ApiError.js'
import Package from './package.model.js'

// `duration` sorts on the nested day count, which is where the value lives.
const SORT_FIELD_MAP = { duration: 'duration.days' }
const SORTABLE = ['title', 'price', 'duration', 'createdAt']
const DEFAULT_SORT = 'title'
const SEARCH_FIELDS = ['title', 'region', 'shortDescription', 'overview']

// An ObjectId filter must reject a malformed id rather than let Mongoose throw
// a CastError deep in the query.
function objectIdFilter(raw, name) {
  if (raw === undefined) return undefined
  const value = typeof raw === 'string' ? raw.trim() : ''
  if (!/^[a-f0-9]{24}$/i.test(value)) {
    throw ApiError.badRequest(`"${name}" must be a valid id.`)
  }
  return value
}

export function buildPackageFilters(query, { forcedType = null } = {}) {
  const filter = { ...publishedOnly() }
  const applied = {}

  if (forcedType) {
    filter.type = forcedType
    applied.type = forcedType
  } else {
    const type = parseEnum(query.type, 'type', PACKAGE_TYPES)
    if (type) {
      filter.type = type
      applied.type = type
    }
  }

  const search = parseSearch(query.search)
  if (search) {
    Object.assign(filter, searchFilter(search, SEARCH_FIELDS))
    applied.search = search
  }

  const destinationId = objectIdFilter(query.destinationId, 'destinationId')
  if (destinationId) {
    filter.destinationIds = destinationId
    applied.destinationId = destinationId
  }

  const activityId = objectIdFilter(query.activityId, 'activityId')
  if (activityId) {
    filter.activityIds = activityId
    applied.activityId = activityId
  }

  const regions = parseList(query.region, 'region')
  if (regions) {
    filter.region = { $in: regions }
    applied.region = regions
  }

  // Allowlisted against the canonical vocabulary, so an unknown value is a 400
  // rather than an empty result the caller has to guess about.
  const difficulty = parseList(query.difficulty, 'difficulty', { allowed: DIFFICULTY_LEVELS })
  if (difficulty) {
    filter.difficulty = { $in: difficulty }
    applied.difficulty = difficulty
  }

  const seasons = parseList(query.bestSeason, 'bestSeason')
  if (seasons) {
    filter.bestSeason = { $in: seasons }
    applied.bestSeason = seasons
  }

  const duration = parseNumericRange(query.durationMin, query.durationMax, 'duration', { min: 0 })
  if (duration) {
    filter['duration.days'] = duration
    applied.duration = duration
  }

  const price = parseNumericRange(query.priceMin, query.priceMax, 'price', { min: 0 })
  if (price) {
    filter.price = price
    applied.price = price
  }

  const featured = parseBoolean(query.featured, 'featured')
  if (featured !== undefined) {
    filter.featured = featured
    applied.featured = featured
  }

  return { filter, applied }
}

export async function listPackages(query, config, { forcedType = null } = {}) {
  const { page, limit, skip } = parsePagination(query, config)
  const sort = parseSort(query.sort, SORTABLE, DEFAULT_SORT)
  const { filter, applied } = buildPackageFilters(query, { forcedType })

  // Map the public sort name onto the stored path.
  const descending = sort.startsWith('-')
  const field = descending ? sort.slice(1) : sort
  const sortObject = { [SORT_FIELD_MAP[field] || field]: descending ? -1 : 1 }

  // Deliberately NOT .lean(): lean() returns plain driver objects and bypasses
  // the schema toJSON transform, so the response would carry a raw _id, no
  // string `id`, no virtuals, and no select:false stripping.
  const [items, total] = await Promise.all([
    Package.find(filter).select(PACKAGE_PUBLIC_FIELDS).sort(sortObject).skip(skip).limit(limit),
    Package.countDocuments(filter),
  ])

  return { items, meta: { ...buildPageMeta({ page, limit, total }), filters: applied, sort } }
}

export async function getPackageBySlug(slug, { requiredType = null } = {}) {
  const found = await Package.findOne({ ...publishedOnly(), slug: String(slug).toLowerCase() })
    .select(PACKAGE_PUBLIC_FIELDS)
    .populate({ path: 'destinationIds', match: publishedOnly(), select: DESTINATION_SUMMARY_FIELDS })
    .populate({ path: 'activityIds', match: publishedOnly(), select: ACTIVITY_SUMMARY_FIELDS })

  if (!found) throw ApiError.notFound('Package not found.')

  // A trekking URL must not serve a tour. The slug existing is not enough —
  // asking the wrong collection for it is a 404, not a redirect.
  if (requiredType && found.type !== requiredType) {
    throw ApiError.notFound(`No ${requiredType} found with that address.`)
  }
  return found
}

export default { listPackages, getPackageBySlug, buildPackageFilters }
