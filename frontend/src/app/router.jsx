// The route table. Every page is lazily loaded so a visitor only downloads
// the screen they asked for.
import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from '../components/auth/ProtectedRoute.jsx'
import RoleRoute from '../components/auth/RoleRoute.jsx'
import PageSkeleton from '../components/common/PageSkeleton.jsx'
import AdminLayout from '../components/layout/AdminLayout.jsx'
import CustomerLayout from '../components/layout/CustomerLayout.jsx'
import PublicLayout from '../components/layout/PublicLayout.jsx'
import { STAFF_ROLES } from '../config/navigation.js'
import { ADMIN_ROUTES, CUSTOMER_ROUTES, PUBLIC_ROUTES } from '../config/routes.js'
import OnboardingGate from './OnboardingGate.jsx'
import ScrollToTop from './ScrollToTop.jsx'

const NotFound = lazy(() => import('../pages/NotFound.jsx'))
const Welcome = lazy(() => import('../pages/Welcome.jsx'))
// The route below was already development-only, but an unconditional lazy()
// still gave Rollup a reason to build and ship the chunk. Guarding the import
// itself lets a production build drop the design preview entirely.
const DesignPreview = import.meta.env.DEV
  ? lazy(() => import('../pages/DesignPreview.jsx'))
  : null
const AdminLogin = lazy(() => import('../pages/public/AdminLogin.jsx'))

// Vite needs a statically analysable import, so the folder is spelled out here.
const loaders = {
  public: (file) => lazy(() => import(`../pages/public/${file}.jsx`)),
  customer: (file) => lazy(() => import(`../pages/customer/${file}.jsx`)),
  admin: (file) => lazy(() => import(`../pages/admin/${file}.jsx`)),
}

function renderRoutes(routes, group) {
  return routes.map((route) => {
    const Page = loaders[group](route.file)
    // Nested layouts own the prefix, so child paths are relative.
    const path = group === 'public' ? route.path : route.path.replace(/^\/(customer|admin)\/?/, '')
    const page = <Page />
    const element =
      group === 'admin' ? (
        <RoleRoute roles={route.roles || STAFF_ROLES} loginPath="/admin/login" nested>
          {page}
        </RoleRoute>
      ) : (
        page
      )
    return <Route key={route.path} path={path || ''} index={path === ''} element={element} />
  })
}

export default function AppRouter() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ScrollToTop />
      <Routes>
        <Route path="/welcome" element={<Welcome />} />
        {/* Development scaffolding only — never part of the shipped site. */}
        {DesignPreview && <Route path="/design-preview" element={<DesignPreview />} />}

        <Route element={<OnboardingGate />}>
          <Route element={<PublicLayout />}>
            {renderRoutes(PUBLIC_ROUTES, 'public')}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="*" element={<NotFound />} />
          </Route>

          <Route
            path="/customer"
            element={
              <ProtectedRoute>
                <CustomerLayout />
              </ProtectedRoute>
            }
          >
            {renderRoutes(CUSTOMER_ROUTES, 'customer')}
          </Route>

          {/* Fine-grained per-section roles arrive with the admin phases. */}
          <Route
            path="/admin"
            element={
              <RoleRoute roles={STAFF_ROLES} loginPath="/admin/login">
                <AdminLayout />
              </RoleRoute>
            }
          >
            {renderRoutes(ADMIN_ROUTES, 'admin')}
          </Route>
        </Route>

        <Route path="/dashboard/*" element={<Navigate to="/customer" replace />} />
      </Routes>
    </Suspense>
  )
}
