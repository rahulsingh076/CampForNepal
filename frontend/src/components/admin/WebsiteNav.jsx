import { NavLink } from 'react-router-dom'

const LINKS = [
  { label: 'Homepage', path: '/admin/website/homepage' },
  { label: 'Menu', path: '/admin/website/menu' },
  { label: 'Footer', path: '/admin/website/footer' },
  { label: 'Pages', path: '/admin/website/pages' },
  { label: 'Contact', path: '/admin/website/contact' },
  { label: 'Certificates', path: '/admin/website/certificates' },
  { label: 'Travel info', path: '/admin/website/travel-info' },
]

export default function WebsiteNav() {
  return (
    <nav aria-label="Website builder" className="overflow-x-auto border-b border-stone-200">
      <div className="flex min-w-max gap-1">
        {LINKS.map((link) => (
          <NavLink key={link.path} to={link.path} className={({ isActive }) => `border-b-2 px-3 py-3 text-small font-semibold transition-colors ${isActive ? 'border-primary-700 text-primary-800' : 'border-transparent text-stone-600 hover:text-primary-800'}`}>
            {link.label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
