// Next departures that a traveller can actually join, with seats remaining.
import useCollection, { orderByIds } from '../../hooks/useCollection.js'
import DepartureCard from '../cards/DepartureCard.jsx'
import StaggerGroup from '../motion/StaggerGroup.jsx'
import SectionShell from './SectionShell.jsx'

// Only statuses a visitor can act on. A draft or cancelled trip is not an offer.
const BOOKABLE = ['booking_open', 'almost_full', 'guaranteed']

export default function FixedDeparturesSection({ section }) {
  const departures = useCollection('fixedDepartures', { sort: 'startDate', direction: 'asc' })
  const packages = useCollection('packages')

  const status =
    departures.status === 'error' || packages.status === 'error'
      ? 'error'
      : departures.status === 'loading' || packages.status === 'loading'
        ? 'loading'
        : 'ready'

  const publishedPackageIds = new Set(packages.items.filter((item) => item.status === 'published').map((item) => item.id))
  const upcoming = departures.items
    .filter((item) => BOOKABLE.includes(item.status))
    .filter((item) => item.bookedSeats < item.totalSeats)
    .filter((item) => publishedPackageIds.has(item.packageId))
  const picked = section.itemIds?.length ? orderByIds(upcoming, section.itemIds) : upcoming

  function reload() {
    departures.reload()
    packages.reload()
  }

  return (
    <SectionShell
      section={section}
      status={status}
      isEmpty={picked.length === 0}
      onRetry={reload}
      emptyTitle="No group departures are open right now"
    >
      <StaggerGroup className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {picked.slice(0, 6).map((item) => (
          <DepartureCard
            key={item.id}
            item={item}
            packageSlug={packages.items.find((row) => row.id === item.packageId)?.slug}
          />
        ))}
      </StaggerGroup>
    </SectionShell>
  )
}
