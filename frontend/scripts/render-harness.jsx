// Mounts one page component inside the real providers, router, and route guard
// so the smoke test exercises the same stack the app uses. Used by
// smoke-render.mjs.
import { renderToStaticMarkup as reactRender } from 'react-dom/server'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import Providers from '../src/app/providers.jsx'
import ProtectedRoute from '../src/components/auth/ProtectedRoute.jsx'
import RoleRoute from '../src/components/auth/RoleRoute.jsx'
import { STAFF_ROLES } from '../src/config/navigation.js'

// Dynamic segments need a concrete value to render against.
const SAMPLE = { ':slug': 'everest-base-camp-trek', ':id': 'bkg-001' }

function concretePath(path) {
  return path.replace(/:[^/]+/g, (segment) => SAMPLE[segment] || 'sample')
}

// Customer and admin pages assume a signed-in user because their guard
// guarantees one. Rendering them bare would fail on `user.id` and report a bug
// the app cannot reach, so each group is wrapped the way router.jsx wraps it.
// Server rendering never runs effects, so no session is restored and the guard
// resolves to its skeleton or redirect — that path is what gets asserted here.
// The authenticated render is covered by the browser matrix in QA_CHECKLIST.md.
function guarded(group, element) {
  if (group === 'customer') return <ProtectedRoute>{element}</ProtectedRoute>
  if (group === 'admin') return <RoleRoute roles={STAFF_ROLES} loginPath="/admin/login">{element}</RoleRoute>
  return element
}

export function renderToStaticMarkup(Page, path, group = 'public') {
  const target = concretePath(path)
  const element = guarded(group, <Page />)

  return reactRender(
    <Providers>
      <MemoryRouter initialEntries={[target]}>
        <Routes>
          <Route path={path} element={element} />
          <Route path="*" element={element} />
        </Routes>
      </MemoryRouter>
    </Providers>
  )
}
