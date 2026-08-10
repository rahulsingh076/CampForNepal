// Renders every implemented route through Vite's SSR pipeline and fails on any
// module that throws at import or render time. Read-only.
//
//   node scripts/smoke-render.mjs
//
// Data loads through effects, so a route's first paint is its loading state.
// That is the point: this catches import cycles, bad default exports, and
// crashes in the synchronous render path across all 60+ routes at once.
import { createServer } from 'vite'

const ROOT = new URL('..', import.meta.url).pathname

const server = await createServer({
  root: ROOT,
  logLevel: 'error',
  server: { middlewareMode: true },
  appType: 'custom',
})

let pass = 0
const failures = []

try {
  const { PUBLIC_ROUTES, CUSTOMER_ROUTES, ADMIN_ROUTES } = await server.ssrLoadModule('/src/config/routes.js')
  const { renderToStaticMarkup } = await server.ssrLoadModule('/scripts/render-harness.jsx')

  const groups = [
    ['public', PUBLIC_ROUTES],
    ['customer', CUSTOMER_ROUTES],
    ['admin', ADMIN_ROUTES],
  ]

  for (const [group, routes] of groups) {
    for (const route of routes) {
      const label = `${group} ${route.path}`
      try {
        const module = await server.ssrLoadModule(`/src/pages/${group}/${route.file}.jsx`)
        if (typeof module.default !== 'function') {
          failures.push([label, 'default export is not a component'])
          continue
        }
        const html = renderToStaticMarkup(module.default, route.path, group)
        if (typeof html !== 'string') {
          failures.push([label, 'render produced no markup'])
          continue
        }
        pass += 1
      } catch (error) {
        failures.push([label, error.message.split('\n')[0]])
      }
    }
  }

  // The standalone screens are declared straight in the router.
  for (const file of ['NotFound', 'Welcome']) {
    try {
      const module = await server.ssrLoadModule(`/src/pages/${file}.jsx`)
      renderToStaticMarkup(module.default, '/')
      pass += 1
    } catch (error) {
      failures.push([`standalone ${file}`, error.message.split('\n')[0]])
    }
  }
} finally {
  await server.close()
}

console.log(`Rendered ${pass} route modules without throwing.\n`)
if (failures.length) {
  console.log(`${failures.length} FAILURE(S):`)
  failures.forEach(([label, detail]) => console.log(`  ${label}: ${detail}`))
  console.log('')
}
console.log(failures.length === 0 ? 'ROUTE RENDER SMOKE PASSED' : 'ROUTE RENDER SMOKE FAILED')
process.exit(failures.length === 0 ? 0 : 1)
