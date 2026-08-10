import { Link } from 'react-router-dom'
import AdminPageHeader from '../../components/admin/AdminPageHeader.jsx'
import WebsiteNav from '../../components/admin/WebsiteNav.jsx'

export default function Website() {
  return (
    <div className="space-y-6">
      <AdminPageHeader title="Website builder" description="Edit the public site without touching code. Every saved change is recorded in the demo audit log." />
      <WebsiteNav />
      <div className="divide-y divide-stone-200 border-y border-stone-200 bg-white">
        {[
          { title: 'Homepage', text: 'Hero, ordered sections, calls to action, and featured picks.', path: '/admin/website/homepage' },
          { title: 'Menu', text: 'Header navigation with one level of child links.', path: '/admin/website/menu' },
          { title: 'Footer', text: 'Columns, legal links, contact block, and social profiles.', path: '/admin/website/footer' },
          { title: 'Static pages', text: 'About, privacy, terms, and cancellation policy sections.', path: '/admin/website/pages' },
          { title: 'Contact', text: 'Office details, email, phone, WhatsApp, and map link.', path: '/admin/website/contact' },
          { title: 'Certificates', text: 'Licences and memberships shown publicly.', path: '/admin/website/certificates' },
          { title: 'Travel information', text: 'Practical visitor guides and publication status.', path: '/admin/website/travel-info' },
        ].map((item) => (
          <Link key={item.path} to={item.path} className="flex flex-col gap-2 px-5 py-5 transition-colors hover:bg-sand-50 sm:flex-row sm:items-center sm:justify-between">
            <div><h2 className="text-h4 font-sans text-stone-900">{item.title}</h2><p className="mt-1 text-small text-stone-600">{item.text}</p></div>
            <span className="text-small font-semibold text-primary-700">Open</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
