// Non-destructive integrity check over the seed data. Reads only — it never
// writes a file, touches localStorage, or mutates a seed.
//
//   node scripts/validate-data.mjs [--json]
//
// Exits 1 on any error. Warnings are reported but do not fail the run, so a
// deliberate demo gap stays visible without blocking the build.
import { COLLECTIONS, SINGLETONS } from '../src/lib/entities.js'
import { ADMIN_ROUTES, CUSTOMER_ROUTES, PUBLIC_ROUTES, STANDALONE_ROUTES } from '../src/config/routes.js'
import { ENTITY_STATUSES, validateRecord, validateSingleton } from '../src/lib/writeValidation.js'
import { isSafeExternalUrl, isSafeInternalPath } from '../src/lib/urlSafety.js'
import { readFileSync } from 'node:fs'

const asJson = process.argv.includes('--json')
const errors = []
const warnings = []

const fail = (rule, where, detail) => errors.push({ rule, where, detail })
const warn = (rule, where, detail) => warnings.push({ rule, where, detail })

const rows = (name) => COLLECTIONS[name]?.seed || []
const idsOf = (name) => new Set(rows(name).map((row) => row[COLLECTIONS[name].idField || 'id']))

// ---------------------------------------------------------------- vocabulary
const STATUSES = ENTITY_STATUSES

const PUBLIC_COLLECTIONS = [
  'destinations', 'activities', 'packages', 'guides',
  'blogPosts', 'travelUpdates', 'travelInfoPages',
]

const ISO_DATE = /^\d{4}-\d{2}-\d{2}(T[\d:.]+(Z|[+-]\d{2}:\d{2}))?$/
const SLUG_SHAPE = /^[a-z0-9]+(-[a-z0-9]+)*$/

// ------------------------------------------------------- 1. ids and slugs
function checkIdentity() {
  Object.entries(COLLECTIONS).forEach(([name, config]) => {
    const key = config.idField || 'id'
    const seenIds = new Map()
    const seenSlugs = new Map()

    config.seed.forEach((row, index) => {
      const id = row[key]
      if (!id) return fail('id-missing', `${name}[${index}]`, `no ${key}`)
      if (seenIds.has(id)) fail('id-duplicate', `${name}.${id}`, `also at index ${seenIds.get(id)}`)
      seenIds.set(id, index)

      if (row.slug === undefined) return
      if (!SLUG_SHAPE.test(row.slug)) {
        fail('slug-shape', `${name}.${id}`, `"${row.slug}" is not lowercase-hyphenated`)
      }
      // getItem resolves by id OR slug, so a duplicate slug makes a public URL
      // ambiguous — it silently returns whichever row comes first.
      if (seenSlugs.has(row.slug)) {
        fail('slug-duplicate', `${name}.${id}`, `slug "${row.slug}" also on ${seenSlugs.get(row.slug)}`)
      }
      seenSlugs.set(row.slug, id)
    })
  })
}

// The facade validates before every create/update. Run that exact rule set
// over seeds too, so a new constraint can never ship with invalid defaults.
function checkWriteBoundaryRules() {
  const getRows = (name) => rows(name)
  Object.entries(COLLECTIONS).forEach(([name, config]) => {
    config.seed.forEach((row) => {
      const result = validateRecord(name, row, getRows, { idField: config.idField || 'id' })
      if (!result.valid) fail('write-validation', `${name}.${row[config.idField || 'id']}`, result.message)
    })
  })

  Object.entries(SINGLETONS).forEach(([name, config]) => {
    const result = validateSingleton(name, config.seed)
    if (!result.valid) fail('write-validation', name, result.message)
  })
}

// -------------------------------------------------- 2. relation resolution
const RELATIONS = [
  ['packages', 'destinationIds', 'destinations'],
  ['packages', 'activityIds', 'activities'],
  ['destinations', 'relatedPackageIds', 'packages'],
  ['destinations', 'relatedGuideIds', 'guides'],
  ['activities', 'relatedDestinationIds', 'destinations'],
  ['activities', 'relatedPackageIds', 'packages'],
  ['blogPosts', 'relatedPackageIds', 'packages'],
  ['travelUpdates', 'relatedDestinationIds', 'destinations'],
  ['travelUpdates', 'relatedPackageIds', 'packages'],
  ['travelInfoPages', 'relatedPackageIds', 'packages'],
  ['fixedDepartures', 'assignedGuideIds', 'guides'],
]

const SINGLE_RELATIONS = [
  ['fixedDepartures', 'packageId', 'packages'],
  ['bookings', 'packageId', 'packages'],
  ['bookings', 'departureId', 'fixedDepartures'],
  ['bookings', 'userId', 'users'],
  ['reviews', 'packageId', 'packages'],
  ['reviews', 'guideId', 'guides'],
  ['reviews', 'userId', 'users'],
  ['reviews', 'bookingId', 'bookings'],
  ['messageThreads', 'userId', 'users'],
  ['messageThreads', 'relatedBookingId', 'bookings'],
  ['notifications', 'userId', 'users'],
  ['inquiries', 'packageId', 'packages'],
  ['inquiries', 'guideId', 'guides'],
  ['inquiries', 'assignedTo', 'users'],
  ['users', 'guideId', 'guides'],
]

function checkRelations() {
  const known = {}
  Object.keys(COLLECTIONS).forEach((name) => { known[name] = idsOf(name) })

  RELATIONS.forEach(([from, field, to]) => {
    rows(from).forEach((row) => {
      ;(row[field] || []).forEach((id) => {
        if (!known[to].has(id)) fail('relation-unresolved', `${from}.${row.id}.${field}`, `${id} is not a ${to} id`)
      })
    })
  })

  SINGLE_RELATIONS.forEach(([from, field, to]) => {
    rows(from).forEach((row) => {
      const id = row[field]
      if (id === null || id === undefined) return
      if (!known[to].has(id)) fail('relation-unresolved', `${from}.${row.id}.${field}`, `${id} is not a ${to} id`)
    })
  })

  // A departure has to belong to the package its booking is for, or the
  // customer sees dates from a different trip on their booking page.
  rows('bookings').forEach((booking) => {
    if (!booking.departureId) return
    const departure = rows('fixedDepartures').find((row) => row.id === booking.departureId)
    if (departure && departure.packageId !== booking.packageId) {
      fail('booking-departure-mismatch', `bookings.${booking.id}`, `departure ${departure.id} belongs to ${departure.packageId}, booking is for ${booking.packageId}`)
    }
  })
}

// ------------------------------------------------------------- 3. statuses
function checkStatuses() {
  Object.entries(STATUSES).forEach(([name, allowed]) => {
    rows(name).forEach((row) => {
      if (row.status === undefined) return
      if (!allowed.includes(row.status)) {
        fail('status-unknown', `${name}.${row.id}`, `"${row.status}" not in ${allowed.join(' | ')}`)
      }
    })
  })

  // exactly one target per review
  rows('reviews').forEach((review) => {
    const targets = [review.packageId, review.guideId].filter(Boolean)
    if (targets.length !== 1) {
      fail('review-target', `reviews.${review.id}`, `expected exactly one of packageId/guideId, found ${targets.length}`)
    }
  })
}

// ---------------------------------------------------------------- 4. dates
function checkDates(name, row, startField, endField) {
  const start = row[startField]
  const end = row[endField]
  if (start && !ISO_DATE.test(start)) fail('date-shape', `${name}.${row.id}.${startField}`, start)
  if (end && !ISO_DATE.test(end)) fail('date-shape', `${name}.${row.id}.${endField}`, end)
  if (start && end && end < start) {
    fail('date-order', `${name}.${row.id}`, `${endField} ${end} is before ${startField} ${start}`)
  }
}

function checkAllDates() {
  rows('fixedDepartures').forEach((row) => {
    checkDates('fixedDepartures', row, 'startDate', 'endDate')
    const pkg = rows('packages').find((item) => item.id === row.packageId)
    if (pkg && row.durationDays && pkg.duration?.days && row.durationDays !== pkg.duration.days) {
      warn('duration-mismatch', `fixedDepartures.${row.id}`, `departure ${row.durationDays} days vs package ${pkg.duration.days}`)
    }
  })

  rows('certificates').forEach((row) => checkDates('certificates', row, 'issuedDate', 'expiryDate'))
  rows('travelUpdates').forEach((row) => checkDates('travelUpdates', row, 'publishedAt', 'expiresAt'))

  rows('bookings').forEach((booking) => {
    booking.statusHistory?.forEach((entry, index, all) => {
      if (!STATUSES.bookings.includes(entry.status)) {
        fail('status-unknown', `bookings.${booking.id}.statusHistory[${index}]`, `"${entry.status}" is not a booking status`)
      }
      if (!ISO_DATE.test(entry.changedAt)) fail('date-shape', `bookings.${booking.id}.statusHistory[${index}]`, entry.changedAt)
      if (index > 0 && entry.changedAt < all[index - 1].changedAt) {
        fail('date-order', `bookings.${booking.id}.statusHistory[${index}]`, 'entry predates the one before it')
      }
    })
    const last = booking.statusHistory?.at(-1)
    if (last && last.status !== booking.status) {
      fail('booking-history-current-status', `bookings.${booking.id}`, `${last.status} is not the current ${booking.status} status`)
    }
  })

  rows('messageThreads').forEach((thread) => {
    thread.messages?.forEach((message, index, all) => {
      if (index > 0 && message.sentAt < all[index - 1].sentAt) {
        fail('date-order', `messageThreads.${thread.id}.messages[${index}]`, 'message predates the one before it')
      }
    })
  })
}

// --------------------------------------------------------------- 5. prices
function checkPrices() {
  const priced = [['packages', 'price'], ['fixedDepartures', 'price']]

  priced.forEach(([name, field]) => {
    rows(name).forEach((row) => {
      const value = row[field]
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        return fail('price-shape', `${name}.${row.id}.${field}`, `${value} is not a finite number`)
      }
      if (value < 0) fail('price-negative', `${name}.${row.id}.${field}`, String(value))
    })
  })

  rows('packages').forEach((row) => {
    if (row.discountPrice === null || row.discountPrice === undefined) return
    if (typeof row.discountPrice !== 'number' || !Number.isFinite(row.discountPrice)) {
      return fail('price-shape', `packages.${row.id}.discountPrice`, String(row.discountPrice))
    }
    if (row.discountPrice < 0) fail('price-negative', `packages.${row.id}.discountPrice`, String(row.discountPrice))
    if (row.discountPrice >= row.price) {
      fail('discount-not-a-discount', `packages.${row.id}`, `discountPrice ${row.discountPrice} >= price ${row.price}`)
    }
  })

  // Every price shown to a visitor needs a basis, or the number is just a
  // number. priceBasisLabel() falls back to "per person", so this can only
  // fail if a record declares a basis and leaves it blank.
  priced.forEach(([name, field]) => {
    rows(name).forEach((row) => {
      const declared = row.priceBasis ?? row.priceUnit
      if (declared !== undefined && !String(declared).trim()) {
        fail('price-basis-blank', `${name}.${row.id}`, `${field} declares an empty price basis`)
      }
    })
  })

  // Currency rates back every converted price on the site.
  rows('currencies').forEach((row) => {
    if (typeof row.rate !== 'number' || !(row.rate > 0)) {
      fail('currency-rate', `currencies.${row.code}`, `rate ${row.rate} must be a positive number`)
    }
  })
}

// ----------------------------------------------------------------- 6. seats
function checkSeats() {
  rows('fixedDepartures').forEach((row) => {
    const { totalSeats, bookedSeats } = row
    if (!Number.isInteger(totalSeats) || totalSeats < 0) {
      fail('seats-shape', `fixedDepartures.${row.id}.totalSeats`, String(totalSeats))
    }
    if (!Number.isInteger(bookedSeats) || bookedSeats < 0) {
      fail('seats-shape', `fixedDepartures.${row.id}.bookedSeats`, String(bookedSeats))
    }
    if (bookedSeats > totalSeats) {
      fail('seats-oversold', `fixedDepartures.${row.id}`, `${bookedSeats} booked of ${totalSeats}`)
    }

    const pkg = rows('packages').find((item) => item.id === row.packageId)
    if (pkg?.groupSize?.max && totalSeats > pkg.groupSize.max) {
      fail('seats-over-group-max', `fixedDepartures.${row.id}`, `${totalSeats} seats vs package max ${pkg.groupSize.max}`)
    }
    if (row.status === 'almost_full' && totalSeats > 0 && bookedSeats / totalSeats < 0.8) {
      warn('status-almost-full', `fixedDepartures.${row.id}`, `only ${bookedSeats}/${totalSeats} booked`)
    }
  })
}

// --------------------------------------------------------------- 7. images
function checkImages() {
  const isUsable = (url) => {
    if (typeof url !== 'string' || !url.trim()) return false
    if (url.startsWith('/')) return true
    try {
      const parsed = new URL(url)
      return parsed.protocol === 'https:'
    } catch {
      return false
    }
  }

  const fields = [
    ['destinations', 'gallery'], ['activities', 'gallery'], ['packages', 'gallery'],
    ['blogPosts', 'gallery'],
  ]
  fields.forEach(([name, field]) => {
    rows(name).forEach((row) => {
      const gallery = row[field]
      if (!Array.isArray(gallery)) return fail('gallery-shape', `${name}.${row.id}.${field}`, 'not an array')
      if (gallery.length === 0) warn('gallery-empty', `${name}.${row.id}`, 'no images')
      gallery.forEach((url, index) => {
        if (!isUsable(url)) fail('image-url', `${name}.${row.id}.${field}[${index}]`, `"${url}" is not an absolute path or https URL`)
      })
    })
  })

  const singles = [
    ['guides', 'photo'], ['blogPosts', 'featuredImage'],
    ['travelUpdates', 'featuredImage'], ['certificates', 'image'],
  ]
  singles.forEach(([name, field]) => {
    rows(name).forEach((row) => {
      const url = row[field]
      if (url === null || url === undefined) return
      if (!isUsable(url)) fail('image-url', `${name}.${row.id}.${field}`, `"${url}" is not an absolute path or https URL`)
    })
  })
}

// ------------------------------------------------------------------ 8. SEO
function checkSeo() {
  // Guides have no `seo` field in the schema: their detail pages derive title
  // and description from fullName and guideType. That is a real CMS gap (an
  // editor cannot tune a guide page's metadata) but not a data error, so it is
  // reported as a warning and tracked as a V2 item in BACKEND_HANDOFF.md.
  rows('guides').forEach((row) => {
    if (row.status !== 'published' || row.publicProfile !== true) return
    if (!row.fullName?.trim() || !row.guideType?.trim()) {
      fail('seo-derived-missing', `guides.${row.id}`, 'nothing to derive a page title from')
    }
    if (!row.slug) fail('seo-slug', `guides.${row.id}`, 'published guide has no slug')
    if (row.seo === undefined) warn('seo-not-editable', `guides.${row.id}`, 'metadata is derived, not editable in the CMS')
  })

  PUBLIC_COLLECTIONS.filter((name) => name !== 'guides').forEach((name) => {
    rows(name).forEach((row) => {
      // Only published records reach a public URL, so only those need metadata.
      if (row.status !== 'published') return
      const seo = row.seo
      if (!seo) return fail('seo-missing', `${name}.${row.id}`, 'no seo object on a published record')

      if (!seo.metaTitle?.trim()) fail('seo-title', `${name}.${row.id}`, 'metaTitle is empty')
      else if (seo.metaTitle.length > 70) warn('seo-title-length', `${name}.${row.id}`, `${seo.metaTitle.length} chars, over 70`)

      if (!seo.metaDescription?.trim()) fail('seo-description', `${name}.${row.id}`, 'metaDescription is empty')
      else if (seo.metaDescription.length > 165) warn('seo-description-length', `${name}.${row.id}`, `${seo.metaDescription.length} chars, over 165`)

      if (!Array.isArray(seo.keywords) || seo.keywords.length === 0) {
        warn('seo-keywords', `${name}.${row.id}`, 'no keywords')
      }
      if (!row.slug) fail('seo-slug', `${name}.${row.id}`, 'published record has no slug to address it by')
    })
  })
}

// ------------------------------------------------------------- 9. no secrets
function checkNoSecrets() {
  // Demo passwords are expected and documented; anything that looks like a real
  // credential in seed data is not.
  const suspicious = /(sk_live|pk_live|AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY|Bearer [A-Za-z0-9._-]{20,})/
  const records = [...Object.keys(COLLECTIONS), ...Object.keys(SINGLETONS)]
  records.forEach((name) => {
    const text = JSON.stringify(COLLECTIONS[name] ? rows(name) : SINGLETONS[name].seed)
    const hit = text.match(suspicious)
    if (hit) fail('possible-secret', name, hit[0].slice(0, 24))
  })
}

// ------------------------------------------------------------------ 10. links
const ALL_ROUTES = [...PUBLIC_ROUTES, ...CUSTOMER_ROUTES, ...ADMIN_ROUTES, ...Object.values(STANDALONE_ROUTES).map((path) => ({ path }))]
const STATIC_PATHS = new Set(ALL_ROUTES.map((route) => route.path))
const DYNAMIC_PATTERNS = ALL_ROUTES
  .filter((route) => route.path.includes(':'))
  .map((route) => new RegExp(`^${route.path.replace(/:[^/]+/g, '[^/]+')}$`))

function routeExists(path) {
  const clean = String(path).split('?')[0].split('#')[0].replace(/\/$/, '') || '/'
  return STATIC_PATHS.has(clean) || DYNAMIC_PATTERNS.some((pattern) => pattern.test(clean))
}

function checkInternalLink(value, where) {
  if (!isSafeInternalPath(value)) return fail('link-shape', where, 'must be a site-relative path')
  if (!routeExists(value)) fail('broken-internal-link', where, value)
}

function checkLinks() {
  const inspect = (value, where) => {
    if (Array.isArray(value)) return value.forEach((item, index) => inspect(item, `${where}[${index}]`))
    if (!value || typeof value !== 'object') return

    Object.entries(value).forEach(([key, child]) => {
      const childWhere = `${where}.${key}`
      if (['path', 'link', 'ctaLink', 'primaryCtaLink', 'secondaryCtaLink', 'browseLink', 'inquiryLink'].includes(key) && child) {
        checkInternalLink(child, childWhere)
      } else if ((key === 'url' || key === 'mapLink') && child && !isSafeExternalUrl(child)) {
        fail('external-link-shape', childWhere, 'must use https')
      }
      inspect(child, childWhere)
    })
  }

  Object.entries(COLLECTIONS).forEach(([name, config]) => inspect(config.seed, name))
  Object.entries(SINGLETONS).forEach(([name, config]) => inspect(config.seed, name))
}

// Public lists ask dataClient only for published records, and detail pages
// reject anything other than published. These source checks make hidden and
// draft content leakage a build failure instead of a manual-QA surprise.
function checkPublicVisibilityGuards() {
  const root = new URL('..', import.meta.url).pathname
  const lists = [
    ['Destinations.jsx', 'src/pages/public', /useCollection\('destinations',\s*\{\s*filters: \{ status: 'published' \}/],
    ['ThingsToDo.jsx', 'src/pages/public', /useCollection\('activities',\s*\{\s*filters: \{ status: 'published' \}/],
    ['PackageList.jsx', 'src/components/sections', /packages\.items\.filter\(\(item\) => item\.status === 'published'\)/],
    ['Guides.jsx', 'src/pages/public', /toPublicGuides\(guides\.items\)/],
    ['Blog.jsx', 'src/pages/public', /useCollection\('blogPosts',\s*\{\s*filters: \{ status: 'published' \}/],
    ['Blog.jsx', 'src/pages/public', /useCollection\('travelUpdates',\s*\{\s*filters: \{ status: 'published' \}/],
    ['TravelInfo.jsx', 'src/pages/public', /useCollection\('travelInfoPages',\s*\{\s*filters: \{ status: 'published' \}/],
    ['Certificates.jsx', 'src/pages/public', /useCollection\('certificates',\s*\{\s*filters: \{ status: 'published' \}/],
  ]
  lists.forEach(([file, directory, expression]) => {
    const source = readFileSync(`${root}/${directory}/${file}`, 'utf8')
    if (!expression.test(source)) {
      fail('public-visibility-list', file, 'does not explicitly keep public content published only')
    }
  })

  const details = ['ActivityDetail.jsx', 'DestinationDetail.jsx', 'PackageDetail.jsx', 'TravelInfoDetail.jsx', 'BlogDetail.jsx']
  details.forEach((file) => {
    const source = readFileSync(`${root}/src/pages/public/${file}`, 'utf8')
    if (!source.includes("status !== 'published'")) {
      fail('public-visibility-detail', file, 'does not reject a non-published record')
    }
  })
}

// ------------------------------------------------------------------- report
checkIdentity()
checkWriteBoundaryRules()
checkRelations()
checkStatuses()
checkAllDates()
checkPrices()
checkSeats()
checkImages()
checkSeo()
checkNoSecrets()
checkLinks()
checkPublicVisibilityGuards()

const counts = Object.fromEntries(Object.entries(COLLECTIONS).map(([name, config]) => [name, config.seed.length]))

if (asJson) {
  console.log(JSON.stringify({ ok: errors.length === 0, counts, errors, warnings }, null, 2))
} else {
  const total = Object.values(counts).reduce((sum, value) => sum + value, 0)
  console.log(`Validated ${total} records across ${Object.keys(counts).length} collections.\n`)

  if (errors.length) {
    console.log(`${errors.length} ERROR(S):`)
    errors.forEach((item) => console.log(`  [${item.rule}] ${item.where}: ${item.detail}`))
    console.log('')
  }
  if (warnings.length) {
    console.log(`${warnings.length} warning(s):`)
    warnings.forEach((item) => console.log(`  [${item.rule}] ${item.where}: ${item.detail}`))
    console.log('')
  }
  console.log(errors.length === 0 ? 'DATA VALIDATION PASSED' : 'DATA VALIDATION FAILED')
}

process.exit(errors.length === 0 ? 0 : 1)
