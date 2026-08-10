// Sticky public header: logo, main nav from the CMS menu, locale, and login.
import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext.jsx'
import LocaleSwitcher from '../common/LocaleSwitcher.jsx'
import CallbackButton from '../forms/CallbackButton.jsx'
import BrandLogo from './BrandLogo.jsx'
import MobileMenu from './MobileMenu.jsx'
import NavDropdown from './NavDropdown.jsx'
import UserMenu from './UserMenu.jsx'
import NotificationBell from '../notifications/NotificationBell.jsx'
import { homePathForRole } from '../../config/navigation.js'
import { SITE_NAME } from '../../config/siteIdentity.js'
import { PublicSearchDialog } from '../search/InPageSearch.jsx'

export default function Header({ menu = [], globalAction, companyName = SITE_NAME }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const { user } = useAuth()

  return (
    <header className="sticky top-0 z-header border-b border-stone-200 bg-sand-50/95 backdrop-blur">
      <div className="mx-auto flex h-20 max-w-screen-xl items-center gap-4 px-4 sm:gap-5 sm:px-6 lg:gap-6 lg:px-8">
        <Link to="/" className="shrink-0" aria-label={`${companyName} home`}>
          <BrandLogo className="h-12 sm:h-14" alt={companyName} />
        </Link>

        <nav aria-label="Main" className="ml-auto hidden items-center gap-1 xl:flex">
          {menu.map((item) =>
            item.children?.length ? (
              <NavDropdown key={item.path} item={item} />
            ) : (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex min-h-11 items-center rounded-lg px-3 py-2 text-small font-medium transition-colors duration-200 ${
                    isActive ? 'text-primary-800' : 'text-stone-700 hover:text-primary-700'
                  }`
                }
              >
                {item.label}
              </NavLink>
            )
          )}
        </nav>

        <div className="ml-auto flex items-center gap-2 sm:gap-3 xl:ml-0">
          <button type="button" onClick={() => setSearchOpen(true)} className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-stone-300 text-stone-800 hover:border-primary-600 hover:text-primary-800 sm:flex" aria-label="Search">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M11 18a7 7 0 100-14 7 7 0 000 14zM16 16l4 4" strokeLinecap="round" />
            </svg>
          </button>
          {globalAction && (
            <Link
              to={globalAction.path}
              className="hidden min-h-11 shrink-0 items-center justify-center whitespace-nowrap rounded-lg bg-amber-600 px-4 py-2 text-small font-semibold leading-none text-white transition-colors duration-200 hover:bg-amber-700 lg:inline-flex"
            >
              {globalAction.label}
            </Link>
          )}
          <CallbackButton className="hidden min-h-11 whitespace-nowrap rounded-lg border border-stone-300 px-4 py-2 text-small font-medium text-stone-800 transition-colors duration-200 hover:border-stone-400 2xl:inline-flex" label="Call me" />
          <LocaleSwitcher compact className="hidden sm:block" />

          {user ? (
            <>
              <NotificationBell className="hidden sm:block" viewAllPath={user.role === 'customer' ? '/customer/notifications' : `${homePathForRole(user.role)}/notifications`} />
              <div className="hidden sm:block"><UserMenu /></div>
            </>
          ) : (
            <Link
              to="/login"
              className="hidden min-h-11 items-center whitespace-nowrap rounded-lg border border-stone-300 px-4 py-2 text-small font-semibold text-stone-800 transition-colors duration-200 hover:border-stone-400 sm:inline-flex"
            >
              Log in
            </Link>
          )}

          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            aria-expanded={mobileOpen}
            aria-controls="mobile-navigation"
            className="flex h-11 w-11 items-center justify-center rounded-lg border border-stone-300 text-stone-800 xl:hidden"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} onSearch={() => setSearchOpen(true)} menu={menu} globalAction={globalAction} />
      {searchOpen && <PublicSearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />}
    </header>
  )
}
