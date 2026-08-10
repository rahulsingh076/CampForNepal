// Shell for the customer dashboard: a sidebar of sections and a simple topbar.
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { CUSTOMER_NAV, NAV_ICONS } from '../../config/navigation.js'
import { SITE_NAME } from '../../config/siteIdentity.js'
import { useAuth } from '../../contexts/AuthContext.jsx'
import useSingleton from '../../hooks/useSingleton.js'
import DemoNotice from '../common/DemoNotice.jsx'
import NotificationBell from '../notifications/NotificationBell.jsx'
import BrandLogo from './BrandLogo.jsx'
import SkipLink from '../common/SkipLink.jsx'

export default function CustomerLayout() {
  // ProtectedRoute guarantees a signed-in user before this layout renders.
  const { user, logout } = useAuth()
  const settings = useSingleton('siteSettings')
  const navigate = useNavigate()
  const siteName = settings.data?.siteName || SITE_NAME

  return (
    <div data-private-shell="customer" className="flex min-h-screen bg-sand-50">
      <SkipLink />
      <aside className="hidden w-64 shrink-0 border-r border-stone-200 bg-white lg:block">
        <div className="flex h-20 items-center px-6">
          <Link to="/" aria-label={`${siteName} home`}>
            <BrandLogo className="h-12" alt={siteName} />
          </Link>
        </div>

        <nav aria-label="Dashboard" className="px-3 pb-8">
          <ul className="space-y-1">
            {CUSTOMER_NAV.map((item) => (
              <li key={item.path}>
                <NavLink
                  end={item.path === '/customer'}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-small font-medium transition-colors duration-200 ${
                      isActive
                        ? 'bg-primary-50 text-primary-800'
                        : 'text-stone-700 hover:bg-sand-100'
                    }`
                  }
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
                    <path d={NAV_ICONS[item.icon]} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-20 items-center justify-between border-b border-stone-200 bg-white px-4 sm:px-6">
          <div className="min-w-0">
            <p className="text-small text-stone-600">Signed in as</p>
            <p className="truncate text-body font-semibold text-stone-900">{user?.fullName}</p>
          </div>
          <div className="flex items-center gap-2">
          <NotificationBell viewAllPath="/customer/notifications" />
          <button
            type="button"
            onClick={() => {
              logout()
              navigate('/')
            }}
            className="rounded-lg border border-stone-300 px-4 py-2 text-small font-medium text-stone-800 transition-colors duration-200 hover:border-stone-400"
          >
            Log out
          </button>
          </div>
        </div>

        {/* The sidebar is hidden below lg, so the same links appear here. */}
        <nav aria-label="Dashboard sections" className="border-b border-stone-200 bg-white px-4 py-3 lg:hidden">
          <ul className="flex gap-2 overflow-x-auto">
            {CUSTOMER_NAV.map((item) => (
              <li key={item.path}>
                <NavLink
                  end={item.path === '/customer'}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex min-h-11 items-center whitespace-nowrap rounded-lg px-3 py-2 text-small font-medium ${
                      isActive ? 'bg-primary-50 text-primary-800' : 'text-stone-700'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <main id="main" tabIndex={-1} className="flex-1 p-4 focus:outline-none sm:p-6 lg:p-8">
          <DemoNotice className="mb-6" />
          <Outlet />
        </main>
      </div>
    </div>
  )
}
