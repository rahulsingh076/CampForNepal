// The localStorage overlay that sits on top of the seed data, plus the audit trail.
// Seed files are never mutated: an edited collection is stored whole under one key.
import { COLLECTIONS, SINGLETONS } from './entities.js'
import { migrateLegacyDemoCopy } from './overlayMigrations.js'
import { readJson, removeKey, writeJson } from './storage.js'

// `storage.js` adds the `cfn:` prefix, so this resolves to `cfn:overlay`.
const OVERLAY_KEY = 'overlay'

// Bump when the stored shape changes. Overlays written before versioning are
// read as version 0 and stamped on the next write; nothing is ever deleted
// because of a version number, including one from a build newer than this.
export const OVERLAY_VERSION = 1

function isRecord(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

// LocalStorage can contain valid JSON with the wrong shape after a manual
// edit, an older build, or a browser extension. Keep only usable app records.
function normalizeOverlay(value) {
  const collections = isRecord(value?.collections) ? value.collections : {}
  const singletons = isRecord(value?.singletons) ? value.singletons : {}
  const storedVersion = Number.isInteger(value?.version) ? value.version : 0

  return {
    // A newer build's overlay keeps its own number rather than being downgraded,
    // so switching back to this build reads what it can and writes nothing away.
    version: Math.max(storedVersion, OVERLAY_VERSION),
    collections: Object.fromEntries(
      Object.entries(collections).filter(([entity, rows]) => COLLECTIONS[entity] && Array.isArray(rows))
    ),
    singletons: Object.fromEntries(
      Object.entries(singletons).filter(([name, record]) => SINGLETONS[name] && isRecord(record))
    ),
  }
}

function readOverlay() {
  const stored = readJson(OVERLAY_KEY, null)
  const overlay = normalizeOverlay(stored)
  const migrated = migrateLegacyDemoCopy(overlay)
  if (JSON.stringify(migrated) !== JSON.stringify(stored)) writeOverlay(migrated)
  return migrated
}

function writeOverlay(overlay) {
  return writeJson(OVERLAY_KEY, overlay)
}

export function readCollection(entity) {
  const overlay = readOverlay()
  return overlay.collections[entity] || COLLECTIONS[entity].seed
}

export function saveCollection(entity, rows) {
  const overlay = readOverlay()
  overlay.collections[entity] = rows
  return writeOverlay(overlay)
}

export function readSingletonValue(name) {
  const overlay = readOverlay()
  return overlay.singletons[name] || SINGLETONS[name].seed
}

export function saveSingletonValue(name, value) {
  const overlay = readOverlay()
  overlay.singletons[name] = value
  return writeOverlay(overlay)
}

export function clearOverlay() {
  return removeKey(OVERLAY_KEY)
}

// Most collections use 'id'; the reference lists are keyed by their own code.
export function idFieldFor(entity) {
  return COLLECTIONS[entity].idField || 'id'
}

export function nextId(entity, rows) {
  const { idPrefix } = COLLECTIONS[entity]
  const numbers = rows
    .map((row) => Number(String(row.id).split('-').pop()))
    .filter((value) => Number.isFinite(value))
  const next = (numbers.length ? Math.max(...numbers) : 0) + 1
  return `${idPrefix}-${String(next).padStart(3, '0')}`
}

// Every write is recorded, exactly as an admin panel needs.
export function appendAuditLog(action, entity, record, actor) {
  const logs = readCollection('auditLogs')
  const label = COLLECTIONS[entity]?.label || SINGLETONS[entity]?.label || entity

  const entry = {
    id: nextId('auditLogs', logs),
    action,
    entity,
    entityId: record?.id ?? null,
    entityLabel: record?.title || record?.fullName || record?.reference || record?.id || '',
    userId: actor.id,
    userName: actor.fullName,
    timestamp: new Date().toISOString(),
    summary: `${actor.fullName} ${action}d ${label}`,
  }

  saveCollection('auditLogs', [entry, ...logs])
}
