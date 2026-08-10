// Destination reads. Public visibility and filter building live here; the
// controller only moves data.
import {
  DESTINATION_PUBLIC_FIELDS,
  GUIDE_SUMMARY_FIELDS,
  PACKAGE_SUMMARY_FIELDS,
  publishedOnly,
} from '../../database/publicVisibility.js'
import {
  buildPageMeta,
  parseBoolean,
  parseList,
  parsePagination,
  parseSearch,
  parseSort,
  searchFilter,
  sortToObject,
} from '../../database/publicQuery.js'
import ApiError from '../../utils/ApiError.js'
import Destination from './destination.model.js'

const SORTABLE = ['title', 'createdAt', 'region']
const DEFAULT_SORT = 'title'
const SEARCH_FIELDS = ['title', 'region', 'shortDescription']

function buildFilters(query) {
  // Always starts from the visibility rule, so every branch below narrows a
  // published-only set rather than building an open one.
  const filter = { ...publishedOnly() }
  const applied = {}

  const search = parseSearch(query.search)
  if (search) {
    Object.assign(filter, searchFilter(search, SEARCH_FIELDS))
    applied.search = search
  }

  const regions = parseList(query.region, 'region')
  if (regions) {
    filter.region = { $in: regions }
    applied.region = regions
  }

  const seasons = parseList(query.bestSeason, 'bestSeason')
  if (seasons) {
    filter.bestSeason = { $in: seasons }
    applied.bestSeason = seasons
  }

  // Destination has no `featured` field in the frontend contract, so the
  // parameter is validated and reported but cannot filter anything. Accepting
  // it silently would imply a capability that does not exist.
  const featured = parseBoolean(query.featured, 'featured')
  if (featured !== undefined) {
    throw ApiError.badRequest('Destinations do not support a "featured" filter.')
  }

  return { filter, applied }
}

export async function listDestinations(query, config) {
  const { page, limit, skip } = parsePagination(query, config)
  const sort = parseSort(query.sort, SORTABLE, DEFAULT_SORT)
  const { filter, applied } = buildFilters(query)

  // Deliberately NOT .lean(): lean() returns plain driver objects and bypasses
  // the schema toJSON transform, so the response would carry a raw _id, no
  // string `id`, no virtuals, and no select:false stripping.
  const [items, total] = await Promise.all([
    Destination.find(filter).select(DESTINATION_PUBLIC_FIELDS).sort(sortToObject(sort)).skip(skip).limit(limit),
    Destination.countDocuments(filter),
  ])

  return {
    items,
    meta: { ...buildPageMeta({ page, limit, total }), filters: applied, sort },
  }
}

export async function getDestinationBySlug(slug) {
  const destination = await Destination.findOne({ ...publishedOnly(), slug: String(slug).toLowerCase() })
    .select(DESTINATION_PUBLIC_FIELDS)
    // Related records are populated as small public summaries, and each
    // populate carries its own published-only filter so an unpublished trip
    // cannot surface through a published destination.
    .populate({ path: 'relatedPackageIds', match: publishedOnly(), select: PACKAGE_SUMMARY_FIELDS })
    .populate({ path: 'relatedGuideIds', match: { status: 'published', publicProfile: true }, select: GUIDE_SUMMARY_FIELDS })

  if (!destination) throw ApiError.notFound('Destination not found.')
  return destination
}

export default { listDestinations, getDestinationBySlug }
