// Compact anchor navigation for the shared package, trek, and expedition detail page.
import Container from '../common/Container.jsx'
import useCurrentSection from '../../hooks/useCurrentSection.js'

const CORE_LINKS = [
  { href: '#overview', label: 'Overview' },
  { href: '#highlights', label: 'Highlights' },
  { href: '#itinerary', label: 'Itinerary' },
  { href: '#includes', label: 'Includes' },
  { href: '#dates', label: 'Dates' },
]

export default function PackageAnchorNav({ showsGear }) {
  const links = [
    ...CORE_LINKS,
    ...(showsGear ? [{ href: '#safety-permits', label: 'Gear & permits' }] : []),
    { href: '#faq', label: 'FAQ' },
    { href: '#reviews', label: 'Reviews' },
  ]

  const currentId = useCurrentSection(links.map((link) => link.href.slice(1)))

  return (
    <nav aria-label="On this trip" className="package-anchor-nav border-b border-stone-200 bg-white">
      <Container>
        <div className="flex min-h-14 items-center gap-4">
          <p className="hidden shrink-0 text-small font-semibold text-stone-700 sm:block">On this trip</p>
          <ul className="flex min-w-0 gap-1 overflow-x-auto py-2">
            {links.map((link) => {
              const isCurrent = link.href.slice(1) === currentId
              return (
                <li key={link.href} className="shrink-0">
                  <a
                    href={link.href}
                    // "location" is the correct aria-current value for a place
                    // within the current page; "page" would claim it is a
                    // different page.
                    aria-current={isCurrent ? 'location' : undefined}
                    className={`flex min-h-11 items-center rounded-md px-3 text-small font-semibold transition-colors duration-200 ${
                      isCurrent
                        ? 'bg-primary-50 text-primary-900 underline decoration-2 underline-offset-4'
                        : 'text-primary-800 hover:bg-primary-50'
                    }`}
                  >
                    {link.label}
                  </a>
                </li>
              )
            })}
          </ul>
        </div>
      </Container>
    </nav>
  )
}
