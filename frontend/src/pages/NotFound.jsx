// Friendly 404 for any address that does not match a route.
import { Link } from 'react-router-dom'
import PageHeader from '../components/common/PageHeader.jsx'
import Section from '../components/common/Section.jsx'
import usePageMeta from '../hooks/usePageMeta.js'

export default function NotFound() {
  usePageMeta('Page not found', 'The Camp for Nepal page you requested is not available.')
  return (
    <>
      <PageHeader
        eyebrow="404"
        title="We cannot find that page"
        description="The link may be out of date, or the page may have moved. Nothing is broken on your side."
      />
      <Section width="narrow">
        <p className="text-body text-stone-700">
          Try one of these instead, or use the menu at the top of the page.
        </p>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {[
            { label: 'Browse all packages', path: '/packages' },
            { label: 'Explore destinations', path: '/destinations' },
            { label: 'Meet our guides', path: '/guides' },
            { label: 'Talk to us', path: '/contact' },
          ].map((link) => (
            <li key={link.path}>
              <Link
                to={link.path}
                className="block rounded-lg bg-sand-100 px-4 py-3 text-body font-medium text-primary-800 transition-colors duration-200 hover:bg-sand-200"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </Section>
    </>
  )
}
