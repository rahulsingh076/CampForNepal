import {
  DEFAULT_MEDIA_STATUS,
  MEDIA_SOURCE_TYPES,
  MEDIA_STATUSES,
  MEDIA_TYPES,
  PUBLIC_MEDIA_STATUS,
} from '../../constants/mediaStatuses.js'
import {
  buildPageMeta,
  parseBoolean,
  parseEnum,
  parseList,
  parsePagination,
  parseSearch,
  parseSort,
  searchFilter,
  sortToObject,
} from '../../database/publicQuery.js'
import ApiError from '../../utils/ApiError.js'
import { toPlainText } from '../../utils/plainText.js'
import MediaAsset from './mediaAsset.model.js'
import { serializeAdminMediaAsset, serializePublicMediaAsset } from './mediaAsset.serializer.js'

const SORTABLE = ['title', 'type', 'sourceType', 'status', 'createdAt', 'updatedAt']
const SEARCH_FIELDS = ['title', 'tags', 'sourceName', 'sourceReference', 'photographerOrCreator', 'licence']
const PUBLIC_FIELDS = 'title slug type sourceType sourceUrl embedUrl thumbnailUrl alt caption width height durationSeconds focalPosition tags sourceName sourceReference photographerOrCreator licence attributionRequired verifiedAt status createdAt updatedAt'

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function cleanString(value, limit = 1000) {
  return typeof value === 'string' ? toPlainText(value).slice(0, limit) : ''
}

function cleanTags(value) {
  return Array.isArray(value)
    ? value.map((item) => cleanString(item, 80)).filter(Boolean)
    : []
}

function cleanUsageLocations(value) {
  return Array.isArray(value)
    ? value.map((item) => ({
        entityType: cleanString(item?.entityType, 40),
        entityId: cleanString(item?.entityId, 120),
        entityTitle: cleanString(item?.entityTitle, 200),
        field: cleanString(item?.field, 120),
      })).filter((item) => item.entityType && item.entityId)
    : []
}

export function cleanMediaPayload(body = {}, { actorUserId = null, create = false } = {}) {
  const has = (field) => Object.prototype.hasOwnProperty.call(body, field)
  const title = cleanString(body.title, 200)
  if (create && !title) throw ApiError.badRequest('A media title is required.')

  const sourceUrl = cleanString(body.sourceUrl, 1000)
  if (create && !sourceUrl) throw ApiError.badRequest('A source URL or local asset path is required.')

  const payload = {
    ...(title ? { title } : {}),
    ...(has('slug') || title ? { slug: slugify(body.slug || title) } : {}),
    ...(has('type') || create ? { type: cleanString(body.type || 'image', 40) } : {}),
    ...(has('sourceType') || create ? { sourceType: cleanString(body.sourceType || 'local_asset', 40) } : {}),
    ...(has('sourceUrl') || create ? { sourceUrl } : {}),
    ...(has('embedUrl') || create ? { embedUrl: cleanString(body.embedUrl, 1000) } : {}),
    ...(has('thumbnailUrl') || create ? { thumbnailUrl: cleanString(body.thumbnailUrl, 1000) } : {}),
    ...(has('alt') || create ? { alt: cleanString(body.alt, 300) } : {}),
    ...(has('caption') || create ? { caption: cleanString(body.caption, 500) } : {}),
    ...(has('width') ? { width: body.width === '' || body.width === null ? undefined : Number(body.width) } : {}),
    ...(has('height') ? { height: body.height === '' || body.height === null ? undefined : Number(body.height) } : {}),
    ...(has('durationSeconds') ? { durationSeconds: body.durationSeconds === '' || body.durationSeconds === null ? undefined : Number(body.durationSeconds) } : {}),
    ...(has('focalPosition') || create ? { focalPosition: cleanString(body.focalPosition, 60) || '50% 50%' } : {}),
    ...(has('tags') || create ? { tags: cleanTags(body.tags) } : {}),
    ...(has('sourceName') || create ? { sourceName: cleanString(body.sourceName, 200) } : {}),
    ...(has('sourceReference') || create ? { sourceReference: cleanString(body.sourceReference, 500) } : {}),
    ...(has('photographerOrCreator') || create ? { photographerOrCreator: cleanString(body.photographerOrCreator, 200) } : {}),
    ...(has('licence') || create ? { licence: cleanString(body.licence, 200) } : {}),
    ...(has('attributionRequired') || create ? { attributionRequired: Boolean(body.attributionRequired) } : {}),
    ...(has('verifiedAt') || create ? { verifiedAt: body.verifiedAt ? new Date(body.verifiedAt) : null } : {}),
    ...(has('status') || create ? { status: cleanString(body.status || DEFAULT_MEDIA_STATUS, 40) } : {}),
    ...(has('usageLocations') || create ? { usageLocations: cleanUsageLocations(body.usageLocations) } : {}),
    ...(actorUserId ? { updatedByUserId: actorUserId } : {}),
  }

  if (create && actorUserId) payload.createdByUserId = actorUserId
  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined))
}

function buildAdminFilter(query) {
  const filter = {}
  const search = parseSearch(query.search)
  if (search) Object.assign(filter, searchFilter(search, SEARCH_FIELDS))

  const type = parseEnum(query.type, 'type', MEDIA_TYPES)
  if (type) filter.type = type

  const sourceType = parseEnum(query.sourceType, 'sourceType', MEDIA_SOURCE_TYPES)
  if (sourceType) filter.sourceType = sourceType

  const status = parseEnum(query.status, 'status', MEDIA_STATUSES)
  if (status) filter.status = status

  const tags = parseList(query.tag, 'tag')
  if (tags) filter.tags = { $in: tags }

  const missingAlt = parseBoolean(query.missingAlt, 'missingAlt')
  if (missingAlt !== undefined) filter.alt = missingAlt ? { $in: ['', null] } : { $nin: ['', null] }

  const missingSource = parseBoolean(query.missingSource, 'missingSource')
  if (missingSource !== undefined) {
    filter.$and = [
      ...(filter.$and || []),
      missingSource
        ? { sourceName: { $in: ['', null] }, sourceReference: { $in: ['', null] }, licence: { $in: ['', null] } }
        : { $or: [{ sourceName: { $nin: ['', null] } }, { sourceReference: { $nin: ['', null] } }, { licence: { $nin: ['', null] } }] },
    ]
  }

  const used = parseBoolean(query.used, 'used')
  const unused = parseBoolean(query.unused, 'unused')
  if (used === true) filter['usageLocations.0'] = { $exists: true }
  if (unused === true) filter.usageLocations = { $size: 0 }

  return filter
}

export async function listPublicMedia(query, config) {
  const { page, limit, skip } = parsePagination(query, config)
  const sort = parseSort(query.sort, SORTABLE, 'title')
  const filter = { status: PUBLIC_MEDIA_STATUS }
  const search = parseSearch(query.search || query.q)
  if (search) Object.assign(filter, searchFilter(search, SEARCH_FIELDS))
  const type = parseEnum(query.type, 'type', MEDIA_TYPES)
  if (type) filter.type = type

  const [items, total] = await Promise.all([
    MediaAsset.find(filter).select(PUBLIC_FIELDS).sort(sortToObject(sort)).skip(skip).limit(limit),
    MediaAsset.countDocuments(filter),
  ])

  return {
    items: items.map(serializePublicMediaAsset),
    meta: { ...buildPageMeta({ page, limit, total }), sort },
  }
}

export async function listAdminMedia(query, config) {
  const { page, limit, skip } = parsePagination(query, config)
  const sort = parseSort(query.sort, SORTABLE, '-updatedAt')
  const filter = buildAdminFilter(query)

  const [items, total] = await Promise.all([
    MediaAsset.find(filter).sort(sortToObject(sort)).skip(skip).limit(limit),
    MediaAsset.countDocuments(filter),
  ])

  return {
    items: items.map(serializeAdminMediaAsset),
    meta: { ...buildPageMeta({ page, limit, total }), sort },
  }
}

export async function getAdminMedia(id) {
  const item = await MediaAsset.findById(id)
  if (!item) throw ApiError.notFound('Media asset not found.')
  return serializeAdminMediaAsset(item)
}

export async function createMedia(body, actorUserId) {
  const item = await MediaAsset.create(cleanMediaPayload(body, { actorUserId, create: true }))
  return serializeAdminMediaAsset(item)
}

export async function updateMedia(id, body, actorUserId) {
  const item = await MediaAsset.findByIdAndUpdate(
    id,
    { $set: cleanMediaPayload(body, { actorUserId }) },
    { new: true, runValidators: true }
  )
  if (!item) throw ApiError.notFound('Media asset not found.')
  return serializeAdminMediaAsset(item)
}

export async function deleteMedia(id, { force = false } = {}) {
  const item = await MediaAsset.findById(id)
  if (!item) throw ApiError.notFound('Media asset not found.')
  if (!force && item.usageLocations?.length) {
    throw ApiError.conflict('This media asset is still used. Detach it before deleting.', {
      data: { usageLocations: item.usageLocations },
    })
  }
  await item.deleteOne()
  return serializeAdminMediaAsset(item)
}
