function idOf(value) {
  if (!value) return null
  if (typeof value === 'string') return value
  if (value._id) return String(value._id)
  return String(value)
}

function isoDate(value) {
  if (!value) return null
  if (value instanceof Date) return value.toISOString()
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
}

function usageLocation(row) {
  return {
    entityType: row.entityType || '',
    entityId: row.entityId || '',
    entityTitle: row.entityTitle || '',
    field: row.field || '',
  }
}

export function serializePublicMediaAsset(asset) {
  return {
    id: idOf(asset._id || asset.id),
    title: asset.title,
    slug: asset.slug || '',
    type: asset.type,
    sourceType: asset.sourceType,
    sourceUrl: asset.sourceUrl,
    embedUrl: asset.embedUrl || '',
    thumbnailUrl: asset.thumbnailUrl || '',
    alt: asset.alt || '',
    caption: asset.caption || '',
    width: asset.width ?? null,
    height: asset.height ?? null,
    durationSeconds: asset.durationSeconds ?? null,
    focalPosition: asset.focalPosition || '50% 50%',
    tags: asset.tags || [],
    sourceName: asset.sourceName || '',
    sourceReference: asset.sourceReference || '',
    photographerOrCreator: asset.photographerOrCreator || '',
    licence: asset.licence || '',
    attributionRequired: Boolean(asset.attributionRequired),
    verifiedAt: isoDate(asset.verifiedAt),
    status: asset.status,
    createdAt: isoDate(asset.createdAt),
    updatedAt: isoDate(asset.updatedAt),
  }
}

export function serializeAdminMediaAsset(asset) {
  const publicFields = serializePublicMediaAsset(asset)
  const usageLocations = (asset.usageLocations || []).map(usageLocation)
  return {
    ...publicFields,
    usageCount: usageLocations.length,
    usageLocations,
    missingAlt: asset.type === 'image' && !asset.alt,
    missingSource: !asset.sourceName && !asset.sourceReference && !asset.licence,
  }
}

