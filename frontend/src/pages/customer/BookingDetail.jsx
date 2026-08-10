// One booking: trip summary, simple status, and private chat for details.
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import EmptyState from '../../components/common/EmptyState.jsx'
import ErrorState from '../../components/common/ErrorState.jsx'
import LoadingState from '../../components/common/LoadingState.jsx'
import StatusBadge from '../../components/common/StatusBadge.jsx'
import BookingStatusTimeline from '../../components/customer/BookingStatusTimeline.jsx'
import BookingTripSummary from '../../components/customer/BookingTripSummary.jsx'
import { bookingStatusLabel, normalizeBookingStatus } from '../../config/bookingStatuses.js'
import { useAuth } from '../../contexts/AuthContext.jsx'
import usePageMeta from '../../hooks/usePageMeta.js'
import { getItem } from '../../lib/dataClient.js'
import useDataChange from '../../hooks/useDataChange.js'

export default function BookingDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const [state, setState] = useState({ status: 'loading' })
  const dataVersion = useDataChange(['bookings', 'packages', 'fixedDepartures', 'guides'])

  useEffect(() => {
    let active = true
    setState({ status: 'loading' })
    getItem('bookings', id).then(async (result) => {
      if (!active) return
      // A missing id and someone else's booking look identical from outside.
      if (!result.success || result.data.userId !== user.id) {
        setState({ status: 'notFound' })
        return
      }

      const booking = result.data
      const [pkg, departure] = await Promise.all([
        getItem('packages', booking.packageId),
        booking.departureId ? getItem('fixedDepartures', booking.departureId) : Promise.resolve(null),
      ])
      if (!active) return

      if (!pkg.success) {
        setState({ status: 'error' })
        return
      }
      setState({
        status: 'ready',
        booking,
        packageItem: pkg.data,
        departure: departure?.success ? departure.data : null,
      })
    })

    return () => {
      active = false
    }
  }, [dataVersion, id, user.id])

  usePageMeta(
    state.status === 'ready' ? `Booking ${state.booking.reference}` : null,
    state.status === 'ready' ? `Booking status and private chat for ${state.packageItem?.title || 'your booking'}.` : undefined,
  )

  if (state.status === 'loading') return <LoadingState label="Loading your booking…" rows={8} />
  if (state.status === 'error') {
    return <ErrorState title="Could not load this booking" description="Please go back and try again." />
  }
  if (state.status === 'notFound') {
    return (
      <EmptyState
        title="No such booking on your account"
        description="The link may be old, or the booking may belong to a different account."
        action={
          <Link to="/customer/bookings" className="mt-6 rounded-lg bg-primary-700 px-4 py-2 text-small font-semibold text-white transition-colors duration-200 hover:bg-primary-800">
            Back to my bookings
          </Link>
        }
      />
    )
  }

  const { booking, packageItem, departure } = state
  return (
    <div className="mx-auto max-w-5xl">
      <Link to="/customer/bookings" className="text-small font-semibold text-primary-700 hover:text-primary-800">
        ← My bookings
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h1 className="font-display text-h2 text-stone-900">{packageItem.title}</h1>
        <StatusBadge status={normalizeBookingStatus(booking.status)} label={bookingStatusLabel(booking.status)} />
      </div>
      <p className="mt-1 text-body text-stone-600">Booking reference {booking.reference}</p>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <BookingTripSummary booking={booking} packageItem={packageItem} departure={departure} />

          <section aria-labelledby="status-heading" className="rounded-xl border border-stone-200 bg-white p-6">
            <h2 id="status-heading" className="text-h4 font-display text-stone-900">Booking status</h2>
            <div className="mt-5">
              <BookingStatusTimeline status={booking.status} history={booking.statusHistory} />
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section aria-label="Private chat" className="rounded-xl border border-stone-200 bg-white p-6">
            <h2 className="text-h4 font-display text-stone-900">Private chat</h2>
            <p className="mt-2 text-small text-stone-600">
              Use chat for documents, guide details, date changes, special requests, or cancellation discussion.
            </p>
            <Link to="/customer/messages" className="mt-4 inline-flex rounded-lg bg-primary-700 px-4 py-2 text-small font-semibold text-white transition-colors duration-200 hover:bg-primary-800">
              Open private chat
            </Link>
          </section>
        </div>
      </div>
    </div>
  )
}
