// Shell for the admin panel: dark sidebar, topbar with role badge and bell.
import { useState } from 'react'
import { matchPath, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { ADMIN_ROLE_LABELS, adminNavForRole, canAccessAdminPath } from '../../config/navigation.js'
import { ADMIN_ROUTES } from '../../config/routes.js'
import { SITE_NAME } from '../../config/siteIdentity.js'
import Badge from '../common/Badge.jsx'
import Breadcrumbs from '../common/Breadcrumbs.jsx'
import SkipLink from '../common/SkipLink.jsx'
import usePageMeta from '../../hooks/usePageMeta.js'
import useSingleton from '../../hooks/useSingleton.js'
import DemoNotice from '../common/DemoNotice.jsx'
import AdminSidebar from './AdminSidebar.jsx'
import AdminMobileNav from './AdminMobileNav.jsx'
import NotificationBell from '../notifications/NotificationBell.jsx'
import UserMenu from './UserMenu.jsx'
import { AdminSearchDialog } from '../search/InPageSearch.jsx'

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  // RoleRoute guarantees a signed-in staff member before this layout renders.
  const { user } = useAuth()
  const settings = useSingleton('siteSettings')
  const location = useLocation()
  const route = ADMIN_ROUTES.find((item) => matchPath({ path: item.path, end: true }, location.pathname))
  const siteName = settings.data?.siteName || SITE_NAME
  usePageMeta(route?.title || 'Admin', `${siteName} admin: ${route?.title || 'administration'}.`)
  const currentItem = adminNavForRole(user?.role)
    .flatMap((group) => group.items)
    .find((item) => item.path === location.pathname)
  const breadcrumbs = currentItem
    ? currentItem.path === '/admin'
      ? [{ label: 'Admin' }]
      : [{ label: 'Admin', ...(canAccessAdminPath(user?.role, '/admin') ? { path: '/admin' } : {}) }, { label: currentItem.label }]
    : [{ label: 'Admin' }]

  return (
    <div data-private-shell="admin" className="flex min-h-screen bg-sand-50">
      <SkipLink />
      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="sticky top-0 h-screen">
          <AdminSidebar companyName={siteName} />
        </div>
      </aside>

      <AdminMobileNav open={sidebarOpen} onClose={() => setSidebarOpen(false)} companyName={siteName} />

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-20 items-center gap-4 border-b border-stone-200 bg-white px-4 sm:px-6">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation"
            aria-expanded={sidebarOpen}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-stone-300 text-stone-800 lg:hidden"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            </svg>
          </button>

          <div role="search" className="hidden min-w-0 flex-1 xl:block">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="flex h-11 w-full max-w-md items-center gap-3 rounded-lg border border-stone-300 bg-white px-3 text-left text-small text-stone-500 hover:border-primary-600 hover:text-stone-700 xl:max-w-xl"
              aria-label="Search admin records"
            >
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M11 18a7 7 0 100-14 7 7 0 000 14zM16 16l4 4" strokeLinecap="round" />
              </svg>
              <span className="truncate">Search reference, customer, event, or media</span>
            </button>
          </div>
          <button type="button" onClick={() => setSearchOpen(true)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-stone-300 text-stone-800 hover:border-primary-600 hover:text-primary-800 xl:hidden" aria-label="Search admin records">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M11 18a7 7 0 100-14 7 7 0 000 14zM16 16l4 4" strokeLinecap="round" />
            </svg>
          </button>

          <div className="ml-auto flex min-w-0 items-center gap-3 sm:gap-4">
            <NotificationBell viewAllPath="/admin/notifications" />

            <div className="hidden text-right sm:block">
              <p className="text-small font-semibold text-stone-900">{user?.fullName}</p>
              <Badge tone="brand" size="sm">
                {ADMIN_ROLE_LABELS[user?.role] || user?.role.replace(/_/g, ' ')}
              </Badge>
            </div>
            <UserMenu compact />
          </div>
        </div>

        <main id="main" tabIndex={-1} className="flex-1 p-4 focus:outline-none sm:p-6 lg:p-8">
          <div className="mb-6">
            <Breadcrumbs trail={breadcrumbs} />
          </div>
          <DemoNotice context="admin" className="mb-6" />
          <Outlet />
        </main>
      </div>
      {searchOpen && <AdminSearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} role={user?.role} />}
    </div>
  )
}
