// The mock API. Every component reads and writes business data through this file only.
// It returns the same { success, message, data, meta } shape the real backend will.
import { COLLECTIONS, SINGLETONS } from './entities.js'
import {
  appendAuditLog,
  clearOverlay,
  idFieldFor,
  nextId,
  readCollection,
  readSingletonValue,
  saveCollection,
  saveSingletonValue,
} from './overlay.js'
import { publishChange, subscribeDataChanges } from './dataEvents.js'
import applyQuery from './queryList.js'
import { validateRecord, validateSingleton } from './writeValidation.js'

// Re-exported so `import { subscribeDataChanges } from '.../dataClient.js'`
// keeps working: this file stays the single public facade for the data layer.
export { subscribeDataChanges }

const DEFAULT_ACTOR = { id: 'user-007', fullName: 'Demo Admin' }
const STORAGE_FAILED = 'Could not save. Your browser storage may be full.'

// A small delay so loading states are actually visible during the demo.
function pause() {
  const ms = 150 + Math.random() * 150
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function respond(success, message, data = null, meta = {}) {
  return { success, message, data, meta }
}

// ------------------------------------------------------------------- reading
export async function listItems(entity, options = {}) {
  await pause()
  if (!COLLECTIONS[entity]) return respond(false, `Unknown collection: ${entity}`, [])

  const { rows, meta } = applyQuery(readCollection(entity), options)
  return respond(true, '', rows, meta)
}

export async function getItem(entity, idOrSlug) {
  await pause()
  if (!COLLECTIONS[entity]) return respond(false, `Unknown collection: ${entity}`)

  // Without this, a missing identifier matches the first row that also has no
  // slug — so getItem('users', undefined) would hand back a real user.
  if (idOrSlug === undefined || idOrSlug === null || idOrSlug === '') {
    return respond(false, `No ${COLLECTIONS[entity].label} identifier given`)
  }

  const key = idFieldFor(entity)
  const match = readCollection(entity).find(
    (row) => row[key] === idOrSlug || row.slug === idOrSlug
  )

  if (!match) return respond(false, `${COLLECTIONS[entity].label} not found`)
  return respond(true, '', match)
}

export async function getSingleton(name) {
  await pause()
  if (!SINGLETONS[name]) return respond(false, `Unknown content: ${name}`)

  return respond(true, '', readSingletonValue(name))
}

// ------------------------------------------------------------------- writing
export async function createItem(entity, values, actor = DEFAULT_ACTOR) {
  await pause()
  if (!COLLECTIONS[entity]) return respond(false, `Unknown collection: ${entity}`)

  const rows = readCollection(entity)
  const key = idFieldFor(entity)

  // A code-keyed collection needs its code supplied; everything else gets a new id.
  if (key !== 'id' && !values[key]) {
    return respond(false, `A ${key} is required to create a ${COLLECTIONS[entity].label}`)
  }

  const record = { ...values, createdAt: new Date().toISOString() }
  if (key === 'id') record.id = nextId(entity, rows)

  const validation = validateRecord(entity, record, (name) => readCollection(name), { idField: key })
  if (!validation.valid) return respond(false, validation.message)

  if (!saveCollection(entity, [record, ...rows])) return respond(false, STORAGE_FAILED)

  appendAuditLog('create', entity, record, actor)
  publishChange(entity)
  publishChange('auditLogs')
  return respond(true, `${COLLECTIONS[entity].label} created`, record)
}

export async function updateItem(entity, id, changes, actor = DEFAULT_ACTOR) {
  await pause()
  if (!COLLECTIONS[entity]) return respond(false, `Unknown collection: ${entity}`)

  const rows = readCollection(entity)
  const key = idFieldFor(entity)
  const index = rows.findIndex((row) => row[key] === id)
  if (index === -1) return respond(false, `${COLLECTIONS[entity].label} not found`)

  // The identifier is pinned so an edit can never change which record this is.
  const record = { ...rows[index], ...changes, [key]: id, updatedAt: new Date().toISOString() }
  const validation = validateRecord(entity, record, (name) => readCollection(name), { idField: key })
  if (!validation.valid) return respond(false, validation.message)
  const nextRows = [...rows]
  nextRows[index] = record

  if (!saveCollection(entity, nextRows)) return respond(false, STORAGE_FAILED)

  appendAuditLog('update', entity, record, actor)
  publishChange(entity)
  publishChange('auditLogs')
  return respond(true, `${COLLECTIONS[entity].label} updated`, record)
}

export async function deleteItem(entity, id, actor = DEFAULT_ACTOR) {
  await pause()
  if (!COLLECTIONS[entity]) return respond(false, `Unknown collection: ${entity}`)

  const rows = readCollection(entity)
  const key = idFieldFor(entity)
  const record = rows.find((row) => row[key] === id)
  if (!record) return respond(false, `${COLLECTIONS[entity].label} not found`)
  if (entity === 'mediaAssets' && record.usageLocations?.length) {
    return respond(false, 'This media asset is still used. Detach it before deleting.', null, {
      references: record.usageLocations,
    })
  }

  if (!saveCollection(entity, rows.filter((row) => row[key] !== id))) {
    return respond(false, STORAGE_FAILED)
  }

  appendAuditLog('delete', entity, record, actor)
  publishChange(entity)
  publishChange('auditLogs')
  return respond(true, `${COLLECTIONS[entity].label} deleted`, record)
}

export async function updateSingleton(name, changes, actor = DEFAULT_ACTOR) {
  await pause()
  if (!SINGLETONS[name]) return respond(false, `Unknown content: ${name}`)

  const next = { ...readSingletonValue(name), ...changes }
  const validation = validateSingleton(name, next)
  if (!validation.valid) return respond(false, validation.message)
  if (!saveSingletonValue(name, next)) return respond(false, STORAGE_FAILED)

  appendAuditLog('update', name, { id: name, title: SINGLETONS[name].label }, actor)
  publishChange(name)
  publishChange('auditLogs')
  return respond(true, `${SINGLETONS[name].label} updated`, next)
}

// ------------------------------------------------------------------ the reset
export async function resetDemoData() {
  await pause()
  clearOverlay()
  publishChange('*')
  return respond(true, 'Demo content data reset. Browser preferences remain.')
}
