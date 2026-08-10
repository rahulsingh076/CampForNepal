// Dark grouped navigation for the admin panel.
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { adminNavForRole, NAV_ICONS } from '../../config/navigation.js'
import { SITE_NAME } from '../../config/siteIdentity.js'
import BrandLogo from './BrandLogo.jsx'

export default function AdminSidebar({ onNavigate, companyName = SITE_NAME }) {
  const { role } = useAuth()
  const navigation = adminNavForRole(role)

  return (
    <div className="flex h-full flex-col bg-primary-900 text-sand-200">
      <div className="flex h-20 items-center px-6">
        <Link to="/" className="rounded-md bg-white px-2 py-1" aria-label={`${companyName} home`}>
          <BrandLogo className="h-12" alt={companyName} />
        </Link>
      </div>

      <nav aria-label="Admin" className="flex-1 overflow-y-auto px-3 pb-8">
        {navigation.map((group) => (
          <div key={group.heading} className="mb-6">
            <p className="px-3 pb-2 text-small font-semibold uppercase tracking-widest text-primary-300">
              {group.heading}
            </p>
            <ul className="space-y-1">
              {group.items.map((item) => (
                <li key={item.path || item.label}>
                  {item.disabled ? (
                    <span
                      aria-disabled="true"
                      title="Payments arrive in Version 2"
                      className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2 text-small font-medium text-primary-300"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
                        <path d={NAV_ICONS[item.icon]} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {item.label}
                      <span className="ml-auto text-xs font-semibold uppercase tracking-wide">Locked</span>
                    </span>
                  ) : (
                    <NavLink
                      end={item.path === '/admin'}
                      to={item.path}
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-lg px-3 py-2 text-small font-medium transition-colors duration-200 ${
                          isActive
                            ? 'bg-primary-700 text-white'
                            : 'text-sand-200 hover:bg-primary-800 hover:text-white'
                        }`
                      }
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
                        <path d={NAV_ICONS[item.icon]} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {item.label}
                    </NavLink>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </div>
  )
}
