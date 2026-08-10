// Guide reads.
//
// Two protections, both required. The FILTER restricts which guides appear
// (publicProfile true and status published), and the PROJECTION restricts which
// fields come back. Neither alone is sufficient: without the projection a
// public guide would carry a day rate and licence names.
import { GUIDE_TYPES } from '../../constants/packageTypes.js'
import { GUIDE_PUBLIC_FIELDS, publicGuidesOnly } from '../../database/publicVisibility.js'
import {
  buildPageMeta,
  parseEnum,
  parseList,
  parsePagination,
  parseSearch,
  parseSort,
  searchFilter,
  sortToObject,
} from '../../database/publicQuery.js'
import ApiError from '../../utils/ApiError.js'
import Guide from './guide.model.js'

const SORTABLE = ['fullName', 'experienceYears', 'rating', 'createdAt']
const DEFAULT_SORT = 'fullName'
const SEARCH_FIELDS = ['fullName', 'bio']

function buildFilters(query) {
  const filter = { ...publicGuidesOnly() }
  const applied = {}

  const search = parseSearch(query.search)
  if (search) {
    Object.assign(filter, searchFilter(search, SEARCH_FIELDS))
    applied.search = search
  }

  const languages = parseList(query.language, 'language')
  if (languages) {
    filter.languages = { $in: languages }
    applied.language = languages
  }

  const regions = parseList(query.region, 'region')
  if (regions) {
    filter.regions = { $in: regions }
    applied.region = regions
  }

  const guideType = parseEnum(query.guideType, 'guideType', GUIDE_TYPES)
  if (guideType) {
    filter.guideType = guideType
    applied.guideType = guideType
  }

  // verificationStatus and availabilityStatus are private fields. Filtering on
  // them would let a caller infer a value the API deliberately does not
  // return — ask for verified guides, compare counts, learn who is not. Both
  // are rejected rather than silently ignored.
  for (const name of ['verificationStatus', 'availabilityStatus']) {
    if (query[name] !== undefined) {
      throw ApiError.badRequest(`"${name}" is not a public filter.`)
    }
  }

  return { filter, applied }
}

export async function listGuides(query, config) {
  const { page, limit, skip } = parsePagination(query, config)
  const sort = parseSort(query.sort, SORTABLE, DEFAULT_SORT)
  const { filter, applied } = buildFilters(query)

  // Deliberately NOT .lean(): lean() returns plain driver objects and bypasses
  // the schema toJSON transform, so the response would carry a raw _id, no
  // string `id`, no virtuals, and no select:false stripping.
  const [items, total] = await Promise.all([
    Guide.find(filter).select(GUIDE_PUBLIC_FIELDS).sort(sortToObject(sort)).skip(skip).limit(limit),
    Guide.countDocuments(filter),
  ])

  return { items, meta: { ...buildPageMeta({ page, limit, total }), filters: applied, sort } }
}

export async function getGuideBySlug(slug) {
  const guide = await Guide.findOne({ ...publicGuidesOnly(), slug: String(slug).toLowerCase() })
    .select(GUIDE_PUBLIC_FIELDS)

  if (!guide) throw ApiError.notFound('Guide not found.')
  return guide
}

export default { listGuides, getGuideBySlug }
