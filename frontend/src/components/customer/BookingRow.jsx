// One booking in the My Bookings list, with a compact booked/cancelled status.
import { Link } from 'react-router-dom'
import StatusBadge from '../common/StatusBadge.jsx'
import { bookingStatusLabel, normalizeBookingStatus } from '../../config/bookingStatuses.js'
import { formatDateRange } from '../../lib/formatters.js'
import BookingStatusTimeline from './BookingStatusTimeline.jsx'

export default function BookingRow({ booking, packageItem, departure }) {
  return (
    <article className="rounded-xl border border-stone-200 bg-white p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-h4 font-display text-stone-900">
            <Link to={`/customer/bookings/${booking.id}`} className="hover:text-primary-700">
              {packageItem?.title || 'Trip'}
            </Link>
          </h2>
          <p className="mt-1 text-small text-stone-600">
            {booking.reference}
            {departure && <> · {formatDateRange(departure.startDate, departure.endDate)}</>}
            {!departure && <> · Dates being planned</>}
            {' · '}
            {booking.travellers.adults + booking.travellers.children} traveller
            {booking.travellers.adults + booking.travellers.children === 1 ? '' : 's'}
          </p>
        </div>
        <StatusBadge status={normalizeBookingStatus(booking.status)} label={bookingStatusLabel(booking.status)} />
      </div>

      <div className="mt-4">
        <BookingStatusTimeline compact status={booking.status} history={booking.statusHistory} />
      </div>

      <div className="mt-4">
        <Link
          to={`/customer/bookings/${booking.id}`}
          className="text-small font-semibold text-primary-700 hover:text-primary-800"
        >
          View booking details →
        </Link>
      </div>
    </article>
  )
}
