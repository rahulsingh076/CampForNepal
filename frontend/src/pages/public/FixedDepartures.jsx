// Scheduled group departures: a table on desktop, cards on mobile, one data source.
import Button from '../../components/common/Button.jsx'
import DemoNotice from '../../components/common/DemoNotice.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import ErrorState from '../../components/common/ErrorState.jsx'
import FilterPanel from '../../components/common/FilterPanel.jsx'
import LoadingState from '../../components/common/LoadingState.jsx'
import PageHeader from '../../components/common/PageHeader.jsx'
import Section from '../../components/common/Section.jsx'
import DepartureList from '../../components/sections/DepartureList.jsx'
import DepartureTable from '../../components/sections/DepartureTable.jsx'
import {
  NO_FILTERS,
  PUBLIC_STATUSES,
  buildDepartureFilters,
  byStartDate,
  filterDepartures,
} from '../../config/departureFilters.js'
import useCollection from '../../hooks/useCollection.js'
import usePageMeta from '../../hooks/usePageMeta.js'
import useSingleton from '../../hooks/useSingleton.js'
import useUrlFilterState from '../../hooks/useUrlFilterState.js'

const TITLE = 'Fixed departures'
const DESCRIPTION =
  'Sample departure records for this browser-only demo. Dates, guides, seats, and availability require direct confirmation before you make plans.'

// A visitor can only act on a departure that is open and has room.
const RESERVABLE = ['booking_open', 'almost_full', 'guaranteed']

export default function FixedDepartures() {
  const departures = useCollection('fixedDepartures', {})
  const packages = useCollection('packages', {})
  const settings = useSingleton('siteSettings')
  const demoMode = settings.data?.demoMode !== false
  const { choice, applyChoice, clear } = useUrlFilterState(NO_FILTERS)

  usePageMeta(demoMode ? 'Sample fixed departures' : TITLE, DESCRIPTION)

  const status =
    departures.status === 'error' || packages.status === 'error'
      ? 'error'
      : departures.status === 'loading' || packages.status === 'loading'
        ? 'loading'
        : 'ready'

  // One shared set of rows: each departure joined to its trip, seat maths done once.
  const rows = byStartDate(
    departures.items
      .filter((item) => PUBLIC_STATUSES.includes(item.status))
      .map((item) => {
        const trip = packages.items.find((row) => row.id === item.packageId)
        const seatsLeft = Math.max(0, item.totalSeats - item.bookedSeats)
        return {
          ...item,
          trip,
          seatsLeft,
          canReserve: RESERVABLE.includes(item.status) && seatsLeft > 0,
        }
      })
      .filter((item) => item.trip?.status === 'published')
  )

  const visible = filterDepartures(rows, choice)

  return (
    <>
      <PageHeader title={demoMode ? 'Sample fixed departures' : TITLE} description={DESCRIPTION} />

      <Section>
        <DemoNotice context="evidence" className="mb-6" />

        {status === 'loading' && <LoadingState rows={6} label="Loading departures" />}

        {status === 'error' && (
          <ErrorState
            title="We could not load the departures"
            description="No departure records were changed. Try again, or return to the trip list."
            action={
              <Button variant="secondary" onClick={departures.reload}>
                Try again
              </Button>
            }
          />
        )}

        {status === 'ready' && (
          <>
            <FilterPanel
              resultCount={visible.length}
              totalCount={rows.length}
              onApply={applyChoice}
              onClear={clear}
              filters={buildDepartureFilters(rows, choice)}
            />

            <div className="mt-10">
              {visible.length === 0 ? (
                <EmptyState
                  title={
                    choice.month
                      ? `Nothing is scheduled in ${choice.month} yet`
                      : 'No departures match those filters'
                  }
                  description={demoMode ? 'Try different filters or clear them to see the sample departure records. You can also record the dates you would like to check.' : 'Try different filters or clear them to see scheduled dates. You can also send an inquiry with your preferred dates.'}
                  action={
                    <Button variant="secondary" onClick={clear}>
                      Clear all
                    </Button>
                  }
                />
              ) : (
                <>
                  <div className="hidden lg:block">
                    <DepartureTable rows={visible} />
                  </div>
                  <div className="lg:hidden">
                    <DepartureList rows={visible} />
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </Section>
    </>
  )
}
