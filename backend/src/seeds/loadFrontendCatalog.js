// Reads the frontend's catalogue seed files.
//
// Runs ONLY from the seed scripts. The Express server never imports this file,
// so a deployed API needs no frontend repository on disk.
//
// The file list is a fixed allowlist. users.js, bookings.js, inquiries.js,
// contactDetails.js, and auditLogs.js hold demo passwords, customer contact
// details, and staff notes, and are deliberately not readable from here.
import { existsSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import path from 'node:path'

// entity name -> the only file it may ever be read from.
const APPROVED_SOURCES = Object.freeze({
  destinations: 'destinations.js',
  activities: 'activities.js',
  packages: 'packages.js',
  mediaAssets: 'mediaAssets.js',
  events: 'events.js',
  fixedDepartures: 'fixedDepartures.js',
  guides: 'guides.js',
  reviews: 'reviews.js',
})

export const APPROVED_SOURCE_FILES = Object.freeze(Object.values(APPROVED_SOURCES))

export function resolveFrontendDataDirectory(frontendRoot) {
  if (!frontendRoot) {
    throw new Error(
      'FRONTEND_ROOT is not set. The seed scripts need it to find the frontend catalogue; ' +
        'the API server does not. Add it to .env, e.g. FRONTEND_ROOT=../frontend'
    )
  }

  const root = path.resolve(process.cwd(), frontendRoot)
  if (!existsSync(root)) {
    throw new Error(`FRONTEND_ROOT does not exist: ${root}`)
  }

  const dataDirectory = path.join(root, 'src', 'data')
  if (!existsSync(dataDirectory)) {
    throw new Error(
      `No catalogue data found at ${dataDirectory}. Check that FRONTEND_ROOT points at the frontend package.`
    )
  }
  return dataDirectory
}

// Every seed file uses a default export. A named export is accepted as a
// fallback so a later refactor on the frontend does not silently break the
// importer, but the shape must still be an array.
function readArray(module, entity, file) {
  const candidate = module.default ?? module[entity]
  if (!Array.isArray(candidate)) {
    throw new Error(
      `${file} did not export an array for "${entity}". ` +
        `Found ${candidate === undefined ? 'no usable export' : typeof candidate}.`
    )
  }
  return candidate
}

export default async function loadFrontendCatalog(frontendRoot) {
  const dataDirectory = resolveFrontendDataDirectory(frontendRoot)
  const catalog = {}
  const missing = []

  for (const [entity, file] of Object.entries(APPROVED_SOURCES)) {
    const filePath = path.join(dataDirectory, file)
    if (!existsSync(filePath)) {
      missing.push(file)
      continue
    }
    // pathToFileURL keeps this working on Windows, where a bare path is not a
    // valid import specifier.
    const module = await import(pathToFileURL(filePath).href)
    catalog[entity] = readArray(module, entity, file)
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing frontend catalogue files in ${dataDirectory}: ${missing.join(', ')}. ` +
        'Nothing was imported.'
    )
  }

  return catalog
}
