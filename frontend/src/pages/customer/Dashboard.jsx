// Customer dashboard: next trip, a few counts, latest messages, quick links.
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import EmptyState from '../../components/common/EmptyState.jsx'
import ErrorState from '../../components/common/ErrorState.jsx'
import LoadingState from '../../components/common/LoadingState.jsx'
import NextTripCard from '../../components/customer/NextTripCard.jsx'
import { isFinishedBooking } from '../../config/bookingStatuses.js'
import { CUSTOMER_NAV } from '../../config/navigation.js'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { useWishlist } from '../../contexts/WishlistContext.jsx'
import usePageMeta from '../../hooks/usePageMeta.js'
import useDataChange from '../../hooks/useDataChange.js'
import { getItem, listItems } from '../../lib/dataClient.js'
import { parseCalendarDate } from '../../lib/formatters.js'
import { unreadThreadCount } from '../../lib/messageThreads.js'

export default function Dashboard() {
  usePageMeta('Dashboard', 'Your trips, messages, and saved ideas in one place.')
  const { user } = useAuth()
  const { count: savedCount } = useWishlist()
  const [state, setState] = useState({ status: 'loading' })
  const dataVersion = useDataChange(['bookings', 'messageThreads', 'fixedDepartures', 'packages'])

  useEffect(() => {
    let active = true
    const byUser = { filters: { userId: user.id }, pageSize: 0 }

    Promise.all([
      listItems('bookings', { ...byUser, sort: 'createdAt', direction: 'desc' }),
      listItems('messageThreads', { ...byUser, sort: 'updatedAt', direction: 'desc' }),
      listItems('fixedDepartures', { pageSize: 0 }),
    ]).then(async ([bookings, threads, departures]) => {
      if (!active) return
      if (!bookings.success || !threads.success || !departures.success) {
        setState({ status: 'error' })
        return
      }

      // The next trip: the soonest departure that has not happened yet.
      const upcoming = bookings.data
        .filter((booking) => booking.departureId && !isFinishedBooking(booking.status))
        .map((booking) => ({
          booking,
          departure: departures.data.find((row) => row.id === booking.departureId),
        }))
        .filter((row) => row.departure && parseCalendarDate(row.departure.startDate) >= new Date())
        .sort((a, b) => a.departure.startDate.localeCompare(b.departure.startDate))[0]

      let packageItem = null
      if (upcoming) {
        const result = await getItem('packages', upcoming.booking.packageId)
        packageItem = result.success ? result.data : null
      }
      if (!active) return

      setState({ status: 'ready', bookings: bookings.data, threads: threads.data, upcoming, packageItem })
    })

    return () => {
      active = false
    }
  }, [dataVersion, user.id])

  if (state.status === 'loading') return <LoadingState label="Loading your dashboard…" rows={6} />
  if (state.status === 'error') {
    return <ErrorState title="Could not load your dashboard" description="Please refresh the page to try again." />
  }

  const currentBooking = state.upcoming?.booking || state.bookings.find((booking) => !isFinishedBooking(booking.status))
  const unreadMessages = unreadThreadCount(state.threads)
  const stats = [
    { label: 'Bookings', value: state.bookings.length, path: '/customer/bookings' },
    { label: 'Unread messages', value: unreadMessages, path: '/customer/messages' },
    { label: 'Saved trips', value: savedCount, path: '/customer/wishlist' },
  ]

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="font-display text-h2 text-stone-900">Namaste, {user.fullName.split(' ')[0]}</h1>
        <p className="mt-1 text-body text-stone-600">Here is where everything stands today.</p>
      </div>

      <section aria-labelledby="next-trip-heading" className="grid gap-6 lg:grid-cols-[minmax(0,1fr),16rem]">
        <div>
          <h2 id="next-trip-heading" className="text-h4 font-display text-stone-900">Your next trip</h2>
          <div className="mt-3">
          {state.upcoming ? (
            <NextTripCard booking={state.upcoming.booking} packageItem={state.packageItem} departure={state.upcoming.departure} />
          ) : (
            <EmptyState
              title="Nothing on the calendar yet"
              description="When a trip with fixed dates is on your account, it appears here with a countdown."
              action={
                <Link to="/packages" className="mt-6 rounded-lg bg-primary-700 px-4 py-2 text-small font-semibold text-white transition-colors duration-200 hover:bg-primary-800">
                  Browse trips
                </Link>
              }
            />
          )}
          </div>
        </div>
        {currentBooking && (
          <aside className="border border-stone-200 bg-white p-5" aria-labelledby="next-action-heading">
            <p className="text-small font-semibold uppercase tracking-wide text-stone-500">Next action</p>
            <h2 id="next-action-heading" className="mt-2 text-h4 font-sans text-stone-900">Continue in private chat</h2>
            <p className="mt-2 text-small text-stone-600">
              Use chat for documents, guide details, date changes, special requests, or cancellation discussion.
            </p>
            <Link to="/customer/messages" className="mt-4 inline-flex text-small font-semibold text-primary-700 hover:text-primary-800">
              Open private chat →
            </Link>
          </aside>
        )}
      </section>

      <section aria-labelledby="messages-heading">
        <h2 id="messages-heading" className="text-h4 font-display text-stone-900">Latest messages</h2>
        {state.threads.length === 0 ? (
          <p className="mt-3 text-small text-stone-600">No demo conversations yet. Saved replies stay in this browser and are not transmitted.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {state.threads.slice(0, 2).map((thread) => (
              <li key={thread.id}>
                <Link to="/customer/messages" className="block rounded-xl border border-stone-200 bg-white p-4 transition-colors duration-200 hover:border-primary-400">
                  <p className="flex items-center gap-2 text-body font-semibold text-stone-900">{thread.subject}{unreadThreadCount([thread]) > 0 && <span className="text-small text-primary-800">New</span>}</p>
                  <p className="mt-1 line-clamp-2 text-small text-stone-600">
                    {thread.messages[thread.messages.length - 1]?.body}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <dl className="grid grid-cols-3 gap-3 border-y border-stone-200 py-5">
        {stats.map((stat) => (
          <Link key={stat.label} to={stat.path} className="rounded-lg px-2 py-2 transition-colors duration-200 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700">
            <dt className="text-small text-stone-600">{stat.label}</dt>
            <dd className="mt-1 text-h4 font-display text-stone-900">{stat.value}</dd>
          </Link>
        ))}
      </dl>

      <nav aria-label="Quick links" className="grid gap-3 sm:grid-cols-3">
        {CUSTOMER_NAV.filter((item) => item.path !== '/customer').map((item) => (
          <Link key={item.path} to={item.path} className="rounded-xl border border-stone-200 bg-white px-4 py-3 text-small font-semibold text-stone-800 transition-colors duration-200 hover:border-primary-400 hover:text-primary-800">
            {item.label} →
          </Link>
        ))}
      </nav>
    </div>
  )
}
