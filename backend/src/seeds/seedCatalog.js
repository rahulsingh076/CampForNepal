// The migration itself: load, normalise, validate, upsert, resolve, verify.
//
// Idempotent. Every write is an upsert keyed on `sourceId`, so running it twice
// updates the same documents rather than creating a second copy. Records with
// no sourceId — anything an admin created later — are never touched.
import Activity from '../modules/activities/activity.model.js'
import Destination from '../modules/destinations/destination.model.js'
import FixedDeparture from '../modules/fixedDepartures/fixedDeparture.model.js'
import Guide from '../modules/guides/guide.model.js'
import Event from '../modules/events/event.model.js'
import MediaAsset from '../modules/media/mediaAsset.model.js'
import Package from '../modules/packages/package.model.js'
import Review from '../modules/reviews/review.model.js'
import buildRelationUpdates, { assertAllResolved } from './buildRelationMaps.js'
import loadFrontendCatalog from './loadFrontendCatalog.js'
import normalizeCatalogData from './normalizeCatalogData.js'
import validateCatalogSeed, { formatValidationReport } from './validateCatalogSeed.js'

// Insert order matters only for readability here, since relations are resolved
// in a second pass — but it keeps the log in dependency order.
const MODELS = {
  destinations: Destination,
  activities: Activity,
  guides: Guide,
  packages: Package,
  mediaAssets: MediaAsset,
  events: Event,
  fixedDepartures: FixedDeparture,
  reviews: Review,
}

// Strips undefined so an upsert never writes an explicit undefined over a value
// that already exists.
function definedFieldsOnly(document) {
  return Object.fromEntries(Object.entries(document).filter(([, value]) => value !== undefined))
}

// Pass one. Writes base fields and records sourceId -> _id.
async function upsertBaseRecords(entity, records, stats) {
  const Model = MODELS[entity]
  const map = new Map()

  for (const record of records) {
    const existing = await Model.findOne({ sourceId: record.sourceId }).select('_id').lean()
    const update = definedFieldsOnly(record.document)

    if (existing) {
      // A departure needs packageId to satisfy schema validation, and pass two
      // supplies it, so validators run on update rather than here.
      await Model.updateOne({ _id: existing._id }, { $set: update })
      map.set(record.sourceId, existing._id)
      stats.updated += 1
    } else {
      // packageId is required on FixedDeparture but is not known until pass
      // two, so creation bypasses full validation and pass two validates.
      const created = await Model.collection.insertOne({
        ...update,
        sourceId: record.sourceId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      map.set(record.sourceId, created.insertedId)
      stats.created += 1
    }
  }

  return map
}

// Pass two. Fills relation fields, running schema validators this time.
async function applyRelationUpdates(entity, updates, stats) {
  const Model = MODELS[entity]

  for (const update of updates) {
    const result = await Model.updateOne(
      { sourceId: update.sourceId },
      { $set: update.set },
      { runValidators: true }
    )
    if (result.matchedCount === 0) {
      stats.skipped += 1
    } else if (result.modifiedCount === 0) {
      stats.unchanged += 1
    }
  }
}

export default async function seedCatalog(config, { log = console.log } = {}) {
  // Production is protected by an explicit opt-in, not by an assumption.
  if (config.isProduction && !config.allowSeedInProduction) {
    throw new Error(
      'Refusing to seed a production database.\n' +
        'NODE_ENV is "production" and ALLOW_SEED_IN_PRODUCTION is not "true".\n' +
        'Nothing was written.'
    )
  }

  log('Loading the frontend catalogue…')
  const raw = await loadFrontendCatalog(config.frontendRoot)
  const sourceCounts = Object.fromEntries(
    Object.entries(raw).map(([entity, rows]) => [entity, rows.length])
  )
  log(`  ${Object.entries(sourceCounts).map(([k, v]) => `${k}: ${v}`).join(', ')}`)

  log('Normalising…')
  const catalog = normalizeCatalogData(raw)

  log('Validating before any write…')
  const validation = validateCatalogSeed(catalog)
  if (!validation.ok) {
    throw new Error(formatValidationReport(validation.problems))
  }
  log(`  no problems. ${validation.deferred.length} deferred relation(s) recorded.`)

  // ------------------------------------------------------------- pass one
  log('Pass 1 — base records…')
  const stats = { created: 0, updated: 0, unchanged: 0, skipped: 0 }
  const maps = {}
  for (const entity of Object.keys(MODELS)) {
    maps[entity] = await upsertBaseRecords(entity, catalog[entity], stats)
    log(`  ${entity}: ${catalog[entity].length} record(s)`)
  }

  // ------------------------------------------------------------- pass two
  log('Pass 2 — relations…')
  const { updates, unresolved } = buildRelationUpdates(catalog, maps)
  // Throws before any relation is written if something cannot be resolved.
  assertAllResolved(unresolved)

  let relationCount = 0
  for (const [entity, entityUpdates] of Object.entries(updates)) {
    await applyRelationUpdates(entity, entityUpdates, stats)
    relationCount += entityUpdates.length
  }
  log(`  ${relationCount} record(s) had relations resolved`)

  // -------------------------------------------------------------- verify
  log('Verifying counts…')
  const databaseCounts = {}
  const mismatches = []
  for (const [entity, Model] of Object.entries(MODELS)) {
    const count = await Model.countDocuments({ sourceId: { $exists: true } })
    databaseCounts[entity] = count
    if (count !== sourceCounts[entity]) {
      mismatches.push(`${entity}: source ${sourceCounts[entity]} vs database ${count}`)
    }
  }
  if (mismatches.length > 0) {
    throw new Error(`Migrated counts do not match the source:\n  ${mismatches.join('\n  ')}`)
  }

  return { sourceCounts, databaseCounts, stats, deferred: validation.deferred, unresolved }
}
