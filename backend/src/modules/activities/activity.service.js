// Activity reads.
import { DIFFICULTY_LEVELS } from '../../constants/difficultyLevels.js'
import {
  ACTIVITY_PUBLIC_FIELDS,
  DESTINATION_SUMMARY_FIELDS,
  PACKAGE_SUMMARY_FIELDS,
  publishedOnly,
} from '../../database/publicVisibility.js'
import {
  buildPageMeta,
  parseList,
  parsePagination,
  parseSearch,
  parseSort,
  searchFilter,
  sortToObject,
} from '../../database/publicQuery.js'
import ApiError from '../../utils/ApiError.js'
import Activity from './activity.model.js'

const SORTABLE = ['title', 'category', 'createdAt']
const DEFAULT_SORT = 'title'
const SEARCH_FIELDS = ['title', 'category', 'shortDescription']

function buildFilters(query) {
  const filter = { ...publishedOnly() }
  const applied = {}

  const search = parseSearch(query.search)
  if (search) {
    Object.assign(filter, searchFilter(search, SEARCH_FIELDS))
    applied.search = search
  }

  const categories = parseList(query.category, 'category')
  if (categories) {
    filter.category = { $in: categories }
    applied.category = categories
  }

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

  if (query.destinationId !== undefined) {
    const value = String(query.destinationId).trim()
    if (!/^[a-f0-9]{24}$/i.test(value)) {
      throw ApiError.badRequest('"destinationId" must be a valid id.')
    }
    filter.relatedDestinationIds = value
    applied.destinationId = value
  }

  return { filter, applied }
}

export async function listActivities(query, config) {
  const { page, limit, skip } = parsePagination(query, config)
  const sort = parseSort(query.sort, SORTABLE, DEFAULT_SORT)
  const { filter, applied } = buildFilters(query)

  // Deliberately NOT .lean(): lean() returns plain driver objects and bypasses
  // the schema toJSON transform, so the response would carry a raw _id, no
  // string `id`, no virtuals, and no select:false stripping.
  const [items, total] = await Promise.all([
    Activity.find(filter).select(ACTIVITY_PUBLIC_FIELDS).sort(sortToObject(sort)).skip(skip).limit(limit),
    Activity.countDocuments(filter),
  ])

  return { items, meta: { ...buildPageMeta({ page, limit, total }), filters: applied, sort } }
}

export async function getActivityBySlug(slug) {
  const activity = await Activity.findOne({ ...publishedOnly(), slug: String(slug).toLowerCase() })
    .select(ACTIVITY_PUBLIC_FIELDS)
    .populate({ path: 'relatedDestinationIds', match: publishedOnly(), select: DESTINATION_SUMMARY_FIELDS })
    .populate({ path: 'relatedPackageIds', match: publishedOnly(), select: PACKAGE_SUMMARY_FIELDS })

  if (!activity) throw ApiError.notFound('Activity not found.')
  return activity
}

export default { listActivities, getActivityBySlug }
