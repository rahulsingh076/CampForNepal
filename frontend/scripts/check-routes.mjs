// Route smoke test and internal broken-link check. Read-only.
//
//   node scripts/check-routes.mjs
//
// 1. Every route in the manifest resolves to a page module that exports a
//    component, and every dynamic route resolves against real seed data.
// 2. Every internal link in the CMS navigation data matches a real route.
// 3. Every hard-coded internal `to="/..."` in the source matches a real route.
//
// This does not render the routes — see scripts/smoke-render.mjs for that.
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { ADMIN_ROUTES, CUSTOMER_ROUTES, PUBLIC_ROUTES, STANDALONE_ROUTES } from '../src/config/routes.js'
import { COLLECTIONS, SINGLETONS } from '../src/lib/entities.js'

const ROOT = new URL('..', import.meta.url).pathname
const errors = []
const notes = []
const fail = (rule, where, detail) => errors.push({ rule, where, detail })

const ALL_ROUTES = [
  ...PUBLIC_ROUTES.map((route) => ({ ...route, group: 'public' })),
  ...CUSTOMER_ROUTES.map((route) => ({ ...route, group: 'customer' })),
  ...ADMIN_ROUTES.map((route) => ({ ...route, group: 'admin' })),
]

// ------------------------------------------------- 1. every route has a page
function checkPageModules() {
  ALL_ROUTES.forEach((route) => {
    const file = join(ROOT, 'src', 'pages', route.group, `${route.file}.jsx`)
    if (!existsSync(file)) {
      return fail('page-missing', route.path, `src/pages/${route.group}/${route.file}.jsx does not exist`)
    }
    const source = readFileSync(file, 'utf8')
    if (!/export default function|export default class|export default \w+/.test(source)) {
      fail('page-no-default-export', route.path, `${route.file}.jsx has no default export`)
    }
  })

  // Orphans: a page file no route points at is dead weight in the bundle.
  ;['public', 'customer', 'admin'].forEach((group) => {
    const dir = join(ROOT, 'src', 'pages', group)
    const used = new Set(ALL_ROUTES.filter((route) => route.group === group).map((route) => route.file))
    readdirSync(dir)
      .filter((name) => name.endsWith('.jsx'))
      .forEach((name) => {
        const base = name.replace(/\.jsx$/, '')
        if (used.has(base)) return
        // Standalone screens are declared directly in the router rather than
        // through the manifest, so check that it references them.
        const routerSource = readFileSync(join(ROOT, 'src', 'app', 'router.jsx'), 'utf8')
        if (routerSource.includes(`${base}.jsx`)) return
        // Shared page-level partials are imported by sibling pages, not routed.
        const importedElsewhere = readdirSync(dir).some((sibling) =>
          sibling !== name && readFileSync(join(dir, sibling), 'utf8').includes(`${base}.jsx`)
        )
        if (!importedElsewhere) notes.push(`unrouted page module: src/pages/${group}/${name}`)
      })
  })
}

// ---------------------------------------- 2. dynamic routes resolve to data
const DYNAMIC_SOURCES = {
  '/destinations/:slug': 'destinations',
  '/things-to-do/:slug': 'activities',
  '/packages/:slug': 'packages',
  '/trekking/:slug': 'packages',
  '/expeditions/:slug': 'packages',
  '/guides/:slug': 'guides',
  '/blog/:slug': 'blogPosts',
  '/travel-info/:slug': 'travelInfoPages',
  '/customer/bookings/:id': 'bookings',
  '/admin/bookings/:id': 'bookings',
}

function checkDynamicRoutes() {
  Object.entries(DYNAMIC_SOURCES).forEach(([path, collection]) => {
    const seed = COLLECTIONS[collection]?.seed || []
    const key = path.endsWith(':id') ? 'id' : 'slug'
    const resolvable = seed.filter((row) => row[key])
    if (resolvable.length === 0) {
      fail('dynamic-route-unresolvable', path, `no ${collection} record has a ${key}`)
    }
  })

  // Every routed page also needs its declared route to exist in the manifest.
  const paths = new Set(ALL_ROUTES.map((route) => route.path))
  Object.keys(DYNAMIC_SOURCES).forEach((path) => {
    if (!paths.has(path)) fail('dynamic-route-missing', path, 'checked here but not in the route manifest')
  })
}

// ------------------------------------------------ 3. link targets are real
const STATIC_PATHS = new Set([
  ...ALL_ROUTES.map((route) => route.path),
  ...Object.values(STANDALONE_ROUTES),
])

const DYNAMIC_PATTERNS = ALL_ROUTES
  .filter((route) => route.path.includes(':'))
  .map((route) => new RegExp(`^${route.path.replace(/:[^/]+/g, '[^/]+')}$`))

function routeExists(path) {
  const clean = path.split('?')[0].split('#')[0].replace(/\/$/, '') || '/'
  if (STATIC_PATHS.has(clean)) return true
  return DYNAMIC_PATTERNS.some((pattern) => pattern.test(clean))
}

function checkCmsLinks() {
  const menu = SINGLETONS.menu.seed
  const footer = SINGLETONS.footer.seed

  const visit = (path, where) => {
    if (!path || !path.startsWith('/')) return
    if (!routeExists(path)) fail('broken-internal-link', where, path)
  }

  ;(menu.mainMenu || []).forEach((item) => {
    visit(item.path, 'menu.mainMenu')
    ;(item.children || []).forEach((child) => visit(child.path, `menu.mainMenu > ${item.label}`))
  })
  visit(menu.globalAction?.path, 'menu.globalAction')
  ;(menu.customerMenu || []).forEach((item) => visit(item.path, 'menu.customerMenu'))

  // adminMenu maps the full information architecture, including sections that
  // do not exist yet. It is not rendered anywhere, so it is reported, not failed.
  const adminUnrouted = []
  const walkAdmin = (items) => (items || []).forEach((item) => {
    if (item.path?.startsWith('/') && !routeExists(item.path)) adminUnrouted.push(item.path)
    walkAdmin(item.children)
  })
  walkAdmin(menu.adminMenu)
  if (adminUnrouted.length) {
    notes.push(`menu.adminMenu has ${adminUnrouted.length} path(s) with no route (not rendered; sidebar comes from navigation.js): ${adminUnrouted.join(', ')}`)
  }

  ;(footer.columns || []).forEach((column) => {
    ;(column.links || []).forEach((link) => visit(link.path, `footer.${column.heading}`))
  })
  ;(footer.legalLinks || []).forEach((link) => visit(link.path, 'footer.legalLinks'))
}

function checkSourceLinks() {
  const files = []
  const walk = (dir) => readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) walk(full)
    else if (entry.name.endsWith('.jsx')) files.push(full)
  })
  walk(join(ROOT, 'src'))

  files.forEach((file) => {
    if (file.includes('design-preview') || file.endsWith('DesignPreview.jsx')) return
    const source = readFileSync(file, 'utf8')
    const relative = file.replace(ROOT, '')

    // Only literal paths can be checked; template literals are data-driven and
    // covered by the dynamic-route check above.
    for (const match of source.matchAll(/\bto="(\/[^"]*)"/g)) {
      if (!routeExists(match[1])) fail('broken-internal-link', relative, match[1])
    }
    for (const match of source.matchAll(/\bhref="(\/[^"]*)"/g)) {
      const path = match[1]
      if (path.startsWith('/images/') || path.startsWith('/brand/') || path.startsWith('/#')) continue
      if (!routeExists(path)) fail('broken-internal-link', relative, path)
    }
  })
}

// ------------------------------------------------------------------- report
checkPageModules()
checkDynamicRoutes()
checkCmsLinks()
checkSourceLinks()

console.log(`Checked ${ALL_ROUTES.length} routes (${PUBLIC_ROUTES.length} public, ${CUSTOMER_ROUTES.length} customer, ${ADMIN_ROUTES.length} admin) plus ${Object.keys(STANDALONE_ROUTES).length} standalone.\n`)

if (errors.length) {
  console.log(`${errors.length} ERROR(S):`)
  errors.forEach((item) => console.log(`  [${item.rule}] ${item.where}: ${item.detail}`))
  console.log('')
}
if (notes.length) {
  console.log('Notes:')
  notes.forEach((note) => console.log(`  - ${note}`))
  console.log('')
}

console.log(errors.length === 0 ? 'ROUTE AND LINK CHECK PASSED' : 'ROUTE AND LINK CHECK FAILED')
process.exit(errors.length === 0 ? 0 : 1)
