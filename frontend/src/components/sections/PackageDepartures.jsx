// Group departures a visitor can still join for this particular trip.
import useCollection from '../../hooks/useCollection.js'
import DepartureCard from '../cards/DepartureCard.jsx'
import Button from '../common/Button.jsx'
import EmptyState from '../common/EmptyState.jsx'
import ErrorState from '../common/ErrorState.jsx'
import LoadingState from '../common/LoadingState.jsx'
import StaggerGroup from '../motion/StaggerGroup.jsx'
import useSingleton from '../../hooks/useSingleton.js'

const JOINABLE = ['booking_open', 'almost_full', 'guaranteed']

export default function PackageDepartures({ packageId, packageSlug }) {
  const settings = useSingleton('siteSettings')
  const demoMode = settings.data?.demoMode !== false
  const { status, items, reload } = useCollection('fixedDepartures', {
    filters: { packageId },
    sort: 'startDate',
    direction: 'asc',
  })

  if (status === 'loading') return <LoadingState rows={3} label="Loading departures" />

  if (status === 'error') {
    return (
      <ErrorState
        title="We could not load departures"
        description="Please try again, or send an inquiry for private dates."
        action={<Button variant="secondary" onClick={reload}>Try again</Button>}
      />
    )
  }

  const joinable = items.filter(
    (item) => JOINABLE.includes(item.status) && item.bookedSeats < item.totalSeats
  )

  if (joinable.length === 0) {
    return (
      <EmptyState
        title={demoMode ? 'No sample departures are shown for this trip' : 'No group departures are scheduled yet'}
        description={demoMode ? 'This browser-only demo has no joinable sample dates here. Send an inquiry to record the dates you would like to check.' : 'Send an inquiry with your dates and party size to check what may be available.'}
      />
    )
  }

  return (
    <StaggerGroup className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {joinable.map((item) => (
        <DepartureCard key={item.id} item={item} packageSlug={packageSlug} />
      ))}
    </StaggerGroup>
  )
}
