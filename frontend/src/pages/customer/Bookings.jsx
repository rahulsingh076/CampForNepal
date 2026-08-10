// My Bookings: every booking on the account, with a simple booked/cancelled state.
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import EmptyState from '../../components/common/EmptyState.jsx'
import ErrorState from '../../components/common/ErrorState.jsx'
import LoadingState from '../../components/common/LoadingState.jsx'
import BookingRow from '../../components/customer/BookingRow.jsx'
import { useAuth } from '../../contexts/AuthContext.jsx'
import usePageMeta from '../../hooks/usePageMeta.js'
import useDataChange from '../../hooks/useDataChange.js'
import { listItems } from '../../lib/dataClient.js'

export default function Bookings() {
  usePageMeta('My Bookings', 'Every trip on your account and where it stands.')
  const { user } = useAuth()
  const [state, setState] = useState({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)
  const dataVersion = useDataChange(['bookings', 'packages', 'fixedDepartures'])

  useEffect(() => {
    let active = true

    Promise.all([
      listItems('bookings', { filters: { userId: user.id }, sort: 'createdAt', direction: 'desc', pageSize: 0 }),
      listItems('packages', { pageSize: 0 }),
      listItems('fixedDepartures', { pageSize: 0 }),
    ]).then(([bookings, packages, departures]) => {
      if (!active) return
      if (!bookings.success || !packages.success || !departures.success) {
        setState({ status: 'error' })
        return
      }
      setState({ status: 'ready', bookings: bookings.data, packages: packages.data, departures: departures.data })
    })

    return () => {
      active = false
    }
  }, [user.id, attempt, dataVersion])

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-h2 text-stone-900">My Bookings</h1>
      <p className="mt-1 text-body text-stone-600">
        Each trip is marked as booked or cancelled. Anything else can be discussed in private chat.
      </p>

      <div className="mt-8">
        {state.status === 'loading' && <LoadingState label="Loading your bookings…" rows={6} />}

        {state.status === 'error' && (
          <ErrorState
            title="Could not load your bookings"
            description="Something went wrong on this device."
            action={
              <button
                type="button"
                onClick={() => setAttempt((value) => value + 1)}
                className="mt-6 rounded-lg bg-primary-700 px-4 py-2 text-small font-semibold text-white transition-colors duration-200 hover:bg-primary-800"
              >
                Try again
              </button>
            }
          />
        )}

        {state.status === 'ready' && state.bookings.length === 0 && (
          <EmptyState
            title="No bookings yet"
            description="When a demo inquiry becomes a booking in this browser, it appears here with its status."
            action={
              <Link
                to="/packages"
                className="mt-6 rounded-lg bg-primary-700 px-4 py-2 text-small font-semibold text-white transition-colors duration-200 hover:bg-primary-800"
              >
                Browse trips
              </Link>
            }
          />
        )}

        {state.status === 'ready' && state.bookings.length > 0 && (
          <ul className="space-y-4">
            {state.bookings.map((booking) => (
              <li key={booking.id}>
                <BookingRow
                  booking={booking}
                  packageItem={state.packages.find((row) => row.id === booking.packageId)}
                  departure={state.departures.find((row) => row.id === booking.departureId)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
