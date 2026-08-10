// Fixed departure reads.
//
// `internalNotes` is select:false on the model AND absent from the projection
// below, so it cannot be returned. Seat numbers here are display-only;
// reservation and its concurrency handling belong to booking writes.
import {
  DEPARTURE_PUBLIC_FIELDS,
  GUIDE_SUMMARY_FIELDS,
  PACKAGE_SUMMARY_FIELDS,
  PUBLIC_DEPARTURE_STATUSES,
  publicDeparturesOnly,
  publishedOnly,
} from '../../database/publicVisibility.js'
import {
  buildPageMeta,
  parseBoolean,
  parseDateRange,
  parseList,
  parsePagination,
  parseSort,
  sortToObject,
} from '../../database/publicQuery.js'
import ApiError from '../../utils/ApiError.js'
import Package from '../packages/package.model.js'
import FixedDeparture from './fixedDeparture.model.js'

const SORTABLE = ['startDate', 'price', 'createdAt']
const DEFAULT_SORT = 'startDate'

function objectIdOrThrow(raw, name) {
  const value = String(raw).trim()
  if (!/^[a-f0-9]{24}$/i.test(value)) {
    throw ApiError.badRequest(`"${name}" must be a valid id.`)
  }
  return value
}

// "2027-03" -> the whole of March 2027, in UTC so the boundary does not drift
// with the server's timezone.
function monthRange(raw) {
  const value = String(raw).trim()
  if (!/^\d{4}-\d{2}$/.test(value)) {
    throw ApiError.badRequest('"month" must look like 2027-03.')
  }
  const [year, month] = value.split('-').map(Number)
  if (month < 1 || month > 12) {
    throw ApiError.badRequest('"month" must have a month between 01 and 12.')
  }
  return {
    $gte: new Date(Date.UTC(year, month - 1, 1)),
    $lt: new Date(Date.UTC(month === 12 ? year + 1 : year, month === 12 ? 0 : month, 1)),
  }
}

async function buildFilters(query) {
  const filter = { ...publicDeparturesOnly() }
  const applied = {}

  if (query.packageId !== undefined) {
    const id = objectIdOrThrow(query.packageId, 'packageId')
    filter.packageId = id
    applied.packageId = id
  }

  // A status filter may only narrow the public set, never widen it — asking
  // for `draft` is a 400 rather than a quiet empty list.
  const statuses = parseList(query.status, 'status', { allowed: PUBLIC_DEPARTURE_STATUSES })
  if (statuses) {
    filter.status = { $in: statuses }
    applied.status = statuses
  }

  if (query.month !== undefined) {
    filter.startDate = monthRange(query.month)
    applied.month = String(query.month).trim()
  } else {
    const range = parseDateRange(query.dateFrom, query.dateTo)
    if (range) {
      filter.startDate = range
      applied.dateFrom = query.dateFrom
      applied.dateTo = query.dateTo
    }
  }

  const guaranteed = parseBoolean(query.guaranteed, 'guaranteed')
  if (guaranteed !== undefined) {
    filter.guaranteed = guaranteed
    applied.guaranteed = guaranteed
  }

  // Filters that live on the parent trip are resolved to a list of package ids
  // first. Two small queries rather than an aggregation keeps untrusted values
  // out of the pipeline entirely.
  const region = parseList(query.region, 'region')
  const type = parseList(query.type, 'type', { allowed: ['tour', 'trekking', 'expedition'] })
  const difficulty = parseList(query.difficulty, 'difficulty')

  if (region || type || difficulty) {
    const packageFilter = { ...publishedOnly() }
    if (region) packageFilter.region = { $in: region }
    if (type) packageFilter.type = { $in: type }
    if (difficulty) packageFilter.difficulty = { $in: difficulty }

    const ids = await Package.find(packageFilter).select('_id').lean()
    const packageIds = ids.map((row) => row._id)

    // Intersect with an explicit packageId when both were supplied.
    filter.packageId = filter.packageId
      ? { $in: packageIds.filter((id) => String(id) === filter.packageId) }
      : { $in: packageIds }

    if (region) applied.region = region
    if (type) applied.type = type
    if (difficulty) applied.difficulty = difficulty
  }

  return { filter, applied }
}

export async function listFixedDepartures(query, config) {
  const { page, limit, skip } = parsePagination(query, config)
  const sort = parseSort(query.sort, SORTABLE, DEFAULT_SORT)
  const { filter, applied } = await buildFilters(query)

  // Deliberately NOT .lean(): lean() returns plain driver objects and bypasses
  // the schema toJSON transform, so the response would carry a raw _id, no
  // string `id`, no `seatsLeft` virtual, and no select:false stripping.
  const [items, total] = await Promise.all([
    FixedDeparture.find(filter)
      .select(DEPARTURE_PUBLIC_FIELDS)
      .populate({ path: 'packageId', match: publishedOnly(), select: PACKAGE_SUMMARY_FIELDS })
      .populate({ path: 'assignedGuideIds', match: { status: 'published', publicProfile: true }, select: GUIDE_SUMMARY_FIELDS })
      .sort(sortToObject(sort))
      .skip(skip)
      .limit(limit),
    FixedDeparture.countDocuments(filter),
  ])

  return { items, meta: { ...buildPageMeta({ page, limit, total }), filters: applied, sort } }
}

// Backs GET /packages/:slug/fixed-departures.
export async function listDeparturesForPackage(slug, query, config) {
  const parent = await Package.findOne({ ...publishedOnly(), slug: String(slug).toLowerCase() })
    .select('_id')
    .lean()
  if (!parent) throw ApiError.notFound('Package not found.')

  return listFixedDepartures({ ...query, packageId: String(parent._id) }, config)
}

export default { listFixedDepartures, listDeparturesForPackage }
