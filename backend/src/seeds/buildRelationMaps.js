// Pass two of the migration: turn source ids into ObjectIds.
//
// Pass one wrote every base record and recorded `sourceId -> _id`. This file
// uses those maps to fill the relation fields that were left empty, and refuses
// to finish if any id cannot be resolved.
import ApiError from '../utils/ApiError.js'

// Looks up one id, recording a failure rather than throwing, so a run reports
// every unresolved relation at once.
function resolveOne(map, sourceId, context, unresolved) {
  const objectId = map.get(sourceId)
  if (!objectId) {
    unresolved.push({ ...context, sourceId })
    return null
  }
  return objectId
}

function resolveMany(map, sourceIds, context, unresolved) {
  return (sourceIds || [])
    .map((sourceId) => resolveOne(map, sourceId, context, unresolved))
    .filter(Boolean)
}

// Builds the update operations for pass two. Returns the writes plus anything
// that could not be resolved; the caller decides whether to apply them.
export default function buildRelationUpdates(catalog, maps) {
  const unresolved = []
  const updates = {
    destinations: [],
    activities: [],
    packages: [],
    mediaAssets: [],
    events: [],
    fixedDepartures: [],
    reviews: [],
  }

  for (const record of catalog.destinations) {
    const context = { entity: 'destinations', ownerId: record.sourceId }
    updates.destinations.push({
      sourceId: record.sourceId,
      set: {
        relatedPackageIds: resolveMany(maps.packages, record.relations.relatedPackageIds, { ...context, field: 'relatedPackageIds' }, unresolved),
        relatedGuideIds: resolveMany(maps.guides, record.relations.relatedGuideIds, { ...context, field: 'relatedGuideIds' }, unresolved),
      },
    })
  }

  for (const record of catalog.activities) {
    const context = { entity: 'activities', ownerId: record.sourceId }
    updates.activities.push({
      sourceId: record.sourceId,
      set: {
        relatedDestinationIds: resolveMany(maps.destinations, record.relations.relatedDestinationIds, { ...context, field: 'relatedDestinationIds' }, unresolved),
        relatedPackageIds: resolveMany(maps.packages, record.relations.relatedPackageIds, { ...context, field: 'relatedPackageIds' }, unresolved),
      },
    })
  }

  for (const record of catalog.packages) {
    const context = { entity: 'packages', ownerId: record.sourceId }
    updates.packages.push({
      sourceId: record.sourceId,
      set: {
        destinationIds: resolveMany(maps.destinations, record.relations.destinationIds, { ...context, field: 'destinationIds' }, unresolved),
        activityIds: resolveMany(maps.activities, record.relations.activityIds, { ...context, field: 'activityIds' }, unresolved),
      },
    })
  }

  for (const record of catalog.events) {
    const context = { entity: 'events', ownerId: record.sourceId }
    updates.events.push({
      sourceId: record.sourceId,
      set: {
        relatedPackageIds: resolveMany(maps.packages, record.relations.relatedPackageIds, { ...context, field: 'relatedPackageIds' }, unresolved),
        relatedDestinationIds: resolveMany(maps.destinations, record.relations.relatedDestinationIds, { ...context, field: 'relatedDestinationIds' }, unresolved),
      },
    })
  }

  for (const record of catalog.fixedDepartures) {
    const context = { entity: 'fixedDepartures', ownerId: record.sourceId }
    const packageObjectId = resolveOne(maps.packages, record.relations.packageId, { ...context, field: 'packageId' }, unresolved)
    updates.fixedDepartures.push({
      sourceId: record.sourceId,
      set: {
        // packageId is required by the schema, so it is only included when it
        // resolved — an unresolved one already failed the run.
        ...(packageObjectId ? { packageId: packageObjectId } : {}),
        assignedGuideIds: resolveMany(maps.guides, record.relations.assignedGuideIds, { ...context, field: 'assignedGuideIds' }, unresolved),
      },
    })
  }

  for (const record of catalog.reviews) {
    const context = { entity: 'reviews', ownerId: record.sourceId }
    const set = {}
    if (record.relations.packageId) {
      const id = resolveOne(maps.packages, record.relations.packageId, { ...context, field: 'packageId' }, unresolved)
      if (id) set.packageId = id
    }
    if (record.relations.guideId) {
      const id = resolveOne(maps.guides, record.relations.guideId, { ...context, field: 'guideId' }, unresolved)
      if (id) set.guideId = id
    }
    updates.reviews.push({ sourceId: record.sourceId, set })
  }

  return { updates, unresolved }
}

// A dangling relation means the catalogue is inconsistent. Stopping here is the
// point: a silently dropped reference is a bug nobody notices until a detail
// page renders a missing trip.
export function assertAllResolved(unresolved) {
  if (unresolved.length === 0) return

  const lines = unresolved.map(
    (item) => `  ${item.entity}[${item.ownerId}].${item.field} -> "${item.sourceId}" was not found`
  )
  throw ApiError.internal(
    `${unresolved.length} relation(s) could not be resolved. The seed was not completed:\n${lines.join('\n')}`
  )
}
