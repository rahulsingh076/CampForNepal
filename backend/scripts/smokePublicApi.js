// Calls every public endpoint against a running server and checks the contract.
//
//   npm run dev          # in one terminal
//   npm run smoke:public # in another
//
// Uses Node's built-in fetch. The base URL comes from the environment, so no
// domain is hard-coded.
import loadEnv from '../src/config/env.js'

// A plain HTTP client: it does not start the auth stack.
const config = loadEnv(process.env, { requireAuthConfig: false })
const BASE = process.env.SMOKE_BASE_URL || `http://localhost:${config.port}`
const API = `${BASE}${config.apiPrefix}`

let pass = 0
let fail = 0
const check = (label, ok, detail = '') => {
  if (ok) { pass += 1; console.log(`  OK   ${label}`) }
  else { fail += 1; console.log(`  FAIL ${label} ${detail}`) }
}

const envelope = (body) =>
  body && typeof body.success === 'boolean' && 'message' in body && 'data' in body && 'meta' in body

// Fields that must never appear anywhere in a public response.
const FORBIDDEN = ['sourceId', 'internalNotes', 'pricePerDay', 'certifications',
  'verificationStatus', 'availabilityStatus', 'publicProfile', '_id', '__v']

function checkNoPrivateFields(label, body) {
  const text = JSON.stringify(body)
  const found = FORBIDDEN.filter((field) => text.includes(`"${field}"`))
  check(`${label}: no private fields`, found.length === 0, found.join(', '))
}

async function get(path) {
  const res = await fetch(`${API}${path}`)
  let body = null
  try { body = await res.json() } catch { /* not JSON */ }
  return { res, body }
}

const LIST_ROUTES = [
  '/destinations', '/activities', '/packages', '/trekking',
  '/expeditions', '/fixed-departures', '/guides', '/reviews',
]

async function main() {
  console.log(`Smoke testing ${API}\n`)

  console.log('=== HEALTH ===')
  {
    const { res, body } = await get('/health')
    check('health responds 200', res.status === 200)
    check('health uses the envelope', envelope(body))
    check('health reports a database state', Boolean(body?.data?.database))
  }

  console.log('\n=== LIST ROUTES ===')
  const firstSlugs = {}
  for (const path of LIST_ROUTES) {
    const { res, body } = await get(path)
    check(`${path} responds 200`, res.status === 200, `got ${res.status}`)
    if (!envelope(body)) { check(`${path} envelope`, false); continue }
    check(`${path} returns an array`, Array.isArray(body.data))
    const meta = body.meta || {}
    const hasPaging = ['page', 'limit', 'total', 'totalPages', 'hasNextPage', 'hasPreviousPage']
      .every((key) => key in meta)
    check(`${path} carries pagination meta`, hasPaging)
    checkNoPrivateFields(path, body)
    if (Array.isArray(body.data) && body.data[0]?.slug) firstSlugs[path] = body.data[0].slug
    if (Array.isArray(body.data) && body.data[0]) {
      check(`${path} exposes id as a string`, typeof body.data[0].id === 'string')
    }
  }

  console.log('\n=== PAGINATION AND FILTERS ===')
  {
    const { body } = await get('/packages?page=1&limit=2')
    check('limit is respected', (body?.data?.length || 0) <= 2)
    check('meta.limit echoes the request', body?.meta?.limit === 2)
  }
  {
    const { body } = await get('/packages?type=trekking')
    const allTrekking = (body?.data || []).every((row) => row.type === 'trekking')
    check('type=trekking returns only treks', allTrekking)
  }
  {
    const { res } = await get('/packages?limit=99999')
    check('limit above the maximum is rejected', res.status === 400)
  }
  {
    const { res } = await get('/packages?sort=secretField')
    check('an unknown sort field is rejected', res.status === 400)
  }
  {
    const { res } = await get('/packages?page=0')
    check('page 0 is rejected', res.status === 400)
  }
  {
    const { res } = await get('/fixed-departures?status=draft')
    check('a draft departure filter is rejected', res.status === 400)
  }

  console.log('\n=== TYPE ALIASES ===')
  {
    const { body } = await get('/trekking')
    check('/trekking returns only treks', (body?.data || []).every((r) => r.type === 'trekking'))
  }
  {
    const { body } = await get('/expeditions')
    check('/expeditions returns only expeditions', (body?.data || []).every((r) => r.type === 'expedition'))
  }
  // A tour slug asked for under /trekking must 404, not redirect.
  {
    const { body } = await get('/packages?type=tour&limit=1')
    const tourSlug = body?.data?.[0]?.slug
    if (tourSlug) {
      const { res } = await get(`/trekking/${tourSlug}`)
      check('a tour slug under /trekking is 404', res.status === 404, `got ${res.status}`)
    } else {
      console.log('  ..   no tour available to cross-check (seed may be empty)')
    }
  }

  console.log('\n=== DETAIL ROUTES ===')
  for (const [path, slug] of Object.entries(firstSlugs)) {
    const { res, body } = await get(`${path}/${slug}`)
    check(`${path}/${slug} responds 200`, res.status === 200, `got ${res.status}`)
    check(`${path}/:slug uses the envelope`, envelope(body))
    checkNoPrivateFields(`${path}/:slug`, body)
  }

  console.log('\n=== NOT FOUND CONTRACT ===')
  {
    const { res, body } = await get('/packages/not-a-real-slug')
    check('unknown slug responds 404', res.status === 404, `got ${res.status}`)
    check('404 uses the envelope', envelope(body))
    check('404 sets success false', body?.success === false)
    check('404 sets data null', body?.data === null)
    check('404 carries a requestId', Boolean(body?.meta?.requestId))
  }

  console.log('\n=== NO WRITE ENDPOINTS ===')
  for (const method of ['POST', 'PATCH', 'PUT', 'DELETE']) {
    const res = await fetch(`${API}/packages`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: method === 'DELETE' ? undefined : '{}',
    })
    // The global CSRF check can refuse unsafe methods before Express looks for
    // a matching handler. The assertion is unchanged in meaning: there is no
    // write endpoint, and refusing before routing avoids revealing paths.
    const refused = res.status === 403 || res.status === 404 || res.status === 405
    check(`${method} /packages is not available`, refused, `got ${res.status}`)
  }

  console.log(fail === 0 ? `\nALL ${pass} SMOKE CHECKS PASSED` : `\n${fail} FAILED / ${pass} passed`)
  process.exit(fail === 0 ? 0 : 1)
}

main().catch((error) => {
  console.error('\nSmoke test could not run.')
  console.error(error.message)
  console.error(`\nIs the server running at ${BASE}? Start it with: npm run dev`)
  process.exit(1)
})
