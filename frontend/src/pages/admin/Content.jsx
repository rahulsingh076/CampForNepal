import { Link } from 'react-router-dom'
import AdminPageHeader from '../../components/admin/AdminPageHeader.jsx'

const MODULES = [
  { title: 'Destinations', description: 'Regions, location facts, galleries, and related trips.', path: '/admin/destinations' },
  { title: 'Activities', description: 'Experiences, safety notes, permits, and related content.', path: '/admin/activities' },
  { title: 'Packages', description: 'Trip pricing, itinerary, practical details, and publication.', path: '/admin/packages' },
  { title: 'Fixed departures', description: 'Scheduled dates, seats, assigned guides, and internal notes.', path: '/admin/fixed-departures' },
  { title: 'Guides', description: 'Public profiles, verification, availability, and activation.', path: '/admin/guides' },
  { title: 'Media library', description: 'Images, video/reel references, metadata, and usage protection.', path: '/admin/media' },
  { title: 'Events', description: 'Information sessions, cultural dates, campaigns, and public event details.', path: '/admin/events' },
]

export default function Content() {
  return (
    <div className="space-y-8">
      <AdminPageHeader title="Catalogue" description="Manage the visitor-facing travel catalogue. Every change writes to the local demo data and audit trail." />
      <div className="divide-y divide-stone-200 border-y border-stone-200 bg-white">
        {MODULES.map((module) => (
          <Link key={module.path} to={module.path} className="flex flex-col gap-3 px-5 py-5 transition-colors hover:bg-sand-50 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-h4 font-sans text-stone-900">{module.title}</h2>
              <p className="mt-1 text-small text-stone-600">{module.description}</p>
            </div>
            <span className="text-small font-semibold text-primary-700">Open</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
