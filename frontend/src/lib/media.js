import { isSafeExternalUrl, isSafeImageUrl, isSafeInternalPath } from './urlSafety.js'

export const MEDIA_TYPES = ['image', 'video', 'reel']

const IMAGE_TYPES = new Set(['image'])
const VIDEO_TYPES = new Set(['video', 'reel'])
const SHORT_TEXT_LIMIT = 300

function isPlainObject(value) {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function cleanText(value, limit = SHORT_TEXT_LIMIT) {
  if (typeof value !== 'string') return ''
  return value.trim().slice(0, limit)
}

function firstText(...values) {
  return values.map((value) => cleanText(value)).find(Boolean) || ''
}

function hasAllowedExplicitType(value) {
  if (!isPlainObject(value) || !value.type) return true
  return MEDIA_TYPES.includes(cleanText(value.type).toLowerCase())
}

export function mediaType(value, fallback = 'image') {
  if (!isPlainObject(value)) return fallback
  const type = cleanText(value.type || value.kind || fallback).toLowerCase()
  return MEDIA_TYPES.includes(type) ? type : fallback
}

export function mediaSrc(value) {
  if (typeof value === 'string') return cleanText(value, 1000)
  if (!isPlainObject(value)) return ''
  return firstText(value.src, value.url, value.href, value.sourceUrl)
}

export function mediaPosterSrc(value) {
  if (!isPlainObject(value)) return ''
  return firstText(value.thumbnailSrc, value.poster, value.posterSrc, value.thumbnailUrl)
}

export function mediaImageSrc(value) {
  const type = mediaType(value)
  if (VIDEO_TYPES.has(type)) return mediaPosterSrc(value)
  return mediaSrc(value)
}

export function mediaAlt(value, fallback = '') {
  if (!isPlainObject(value)) return fallback
  return firstText(value.alt, value.altText, fallback)
}

export function mediaFocalPosition(value, fallback = '50% 50%') {
  if (!isPlainObject(value)) return fallback
  return firstText(value.focalPosition, value.objectPosition, fallback)
}

export function mediaCaption(value) {
  if (!isPlainObject(value)) return ''
  return firstText(value.caption, value.title)
}

export function mediaCredit(value) {
  if (!isPlainObject(value)) return ''
  return [
    value.photographer || value.photographerOrCreator,
    value.sourceName || value.sourceReference,
    value.licenceName || value.licenseName || value.licence,
  ]
    .map((part) => cleanText(part))
    .filter(Boolean)
    .join(' / ')
}

export function normaliseMediaItem(value, { fallbackTitle = '', index = 0, fallbackType = 'image' } = {}) {
  const type = mediaType(value, fallbackType)
  const src = mediaSrc(value)
  const imageSrc = mediaImageSrc(value)
  const fallbackAlt = fallbackTitle ? `${fallbackTitle}, photograph ${index + 1}` : ''

  return {
    raw: value,
    type,
    src,
    imageSrc,
    alt: mediaAlt(value, fallbackAlt),
    caption: mediaCaption(value),
    credit: mediaCredit(value),
    focalPosition: mediaFocalPosition(value),
    sourceUrl: isPlainObject(value) ? firstText(value.sourceUrl) : '',
    licenceUrl: isPlainObject(value) ? firstText(value.licenceUrl, value.licenseUrl) : '',
    sourceType: isPlainObject(value) ? firstText(value.sourceType) : '',
    mediaId: isPlainObject(value) ? firstText(value.mediaId, value.id) : '',
    day: isPlainObject(value) ? value.day : undefined,
    season: isPlainObject(value) ? firstText(value.season) : '',
  }
}

export function imageGallery(record, { fallbackTitle = record?.title || record?.fullName || '' } = {}) {
  return mediaGallery(record, { fallbackTitle })
    .filter((item) => item.imageSrc && IMAGE_TYPES.has(item.type))
}

export function mediaGallery(record, { fallbackTitle = record?.title || record?.fullName || '' } = {}) {
  const orderedGallery = Array.isArray(record?.mediaGallery) && record.mediaGallery.length
    ? record.mediaGallery
    : Array.isArray(record?.gallery)
      ? record.gallery
      : []
  const videos = Array.isArray(record?.videos) ? record.videos : []
  const seasonalMedia = Array.isArray(record?.seasonalMedia) ? record.seasonalMedia : []
  const beforeAfterMedia = Array.isArray(record?.beforeAfterMedia) ? record.beforeAfterMedia : []

  return [...orderedGallery, ...videos, ...seasonalMedia, ...beforeAfterMedia]
    .map((item, index) => normaliseMediaItem(item, { fallbackTitle, index }))
    .filter((item) => item.imageSrc || (VIDEO_TYPES.has(item.type) && item.src))
}

export function primaryImageMedia(record) {
  const candidates = [
    record?.coverImage,
    record?.coverMedia,
    record?.heroMedia,
    ...(Array.isArray(record?.mediaGallery) ? record.mediaGallery : []),
    ...(Array.isArray(record?.gallery) ? record.gallery : []),
    record?.featuredImage,
    record?.photo,
    record?.image,
  ]

  for (const candidate of candidates) {
    const media = normaliseMediaItem(candidate, { fallbackTitle: record?.title || record?.fullName || '' })
    if (media.imageSrc) return media
  }
  return normaliseMediaItem('')
}

export function primaryImageSrc(record) {
  return primaryImageMedia(record).imageSrc
}

export function isSafeMediaValue(value) {
  if (value === undefined || value === null || value === '') return true

  if (typeof value === 'string') return isSafeImageUrl(value)
  if (!isPlainObject(value)) return false
  if (!hasAllowedExplicitType(value)) return false

  const type = mediaType(value)
  const src = mediaSrc(value)
  if (!src) return false

  if (VIDEO_TYPES.has(type)) {
    if (value.sourceType === 'local_asset') {
      if (!isSafeInternalPath(src)) return false
    } else if (!isSafeExternalUrl(src)) {
      return false
    }
  } else if (!isSafeImageUrl(src)) {
    return false
  }

  const poster = mediaPosterSrc(value)
  if (poster && !isSafeImageUrl(poster)) return false

  for (const field of ['sourceUrl', 'licenceUrl', 'licenseUrl']) {
    if (value[field] && !isSafeExternalUrl(value[field])) return false
  }

  return true
}

export function cleanMediaItem(value) {
  if (typeof value === 'string') return cleanText(value, 1000)
  if (!isPlainObject(value)) return ''

  const next = {
    type: mediaType(value),
    sourceType: cleanText(value.sourceType, 80),
    src: cleanText(value.src || value.url || value.href || value.sourceUrl, 1000),
    alt: cleanText(value.alt || value.altText),
    caption: cleanText(value.caption),
    focalPosition: cleanText(value.focalPosition || value.objectPosition, 60),
    photographer: cleanText(value.photographer || value.photographerOrCreator),
    sourceName: cleanText(value.sourceName),
    sourceReference: cleanText(value.sourceReference),
    sourceUrl: cleanText(value.sourceUrl, 1000),
    licenceName: cleanText(value.licenceName || value.licenseName || value.licence),
    licenceUrl: cleanText(value.licenceUrl || value.licenseUrl, 1000),
    thumbnailSrc: cleanText(value.thumbnailSrc || value.poster || value.posterSrc || value.thumbnailUrl, 1000),
    mediaId: cleanText(value.mediaId || value.id, 120),
    day: value.day,
    season: cleanText(value.season, 80),
  }

  Object.keys(next).forEach((key) => {
    if (next[key] === '' || next[key] === undefined || next[key] === null) delete next[key]
  })

  if (!next.src) return ''
  const metadataKeys = Object.keys(next).filter((key) => key !== 'type' && key !== 'src')
  return next.type === 'image' && metadataKeys.length === 0 ? next.src : next
}

export function cleanMediaItems(items = []) {
  return items.map(cleanMediaItem).filter(Boolean)
}

export function mediaAssetToGalleryItem(asset) {
  if (!asset) return ''
  return cleanMediaItem({
    mediaId: asset.id,
    type: asset.type,
    sourceType: asset.sourceType,
    src: asset.sourceUrl,
    thumbnailSrc: asset.thumbnailUrl,
    alt: asset.alt,
    caption: asset.caption,
    focalPosition: asset.focalPosition,
    photographer: asset.photographerOrCreator,
    sourceName: asset.sourceName,
    sourceReference: asset.sourceReference,
    licenceName: asset.licence,
  })
}
