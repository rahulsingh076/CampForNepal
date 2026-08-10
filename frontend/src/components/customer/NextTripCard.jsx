// Dashboard card for the next confirmed upcoming trip, with a day countdown.
import { Link } from 'react-router-dom'
import StatusBadge from '../common/StatusBadge.jsx'
import ImageFrame from '../common/ImageFrame.jsx'
import { bookingStatusLabel, normalizeBookingStatus } from '../../config/bookingStatuses.js'
import { formatDateRange, parseCalendarDate } from '../../lib/formatters.js'
import { primaryImageMedia } from '../../lib/media.js'

function daysUntil(dateString) {
  const days = Math.ceil((parseCalendarDate(dateString) - new Date()) / 86400000)
  return days > 0 ? days : 0
}

export default function NextTripCard({ booking, packageItem, departure }) {
  const days = departure ? daysUntil(departure.startDate) : null
  const image = primaryImageMedia(packageItem)

  return (
    <article className="overflow-hidden rounded-xl border border-stone-200 bg-white sm:flex">
      <div className="sm:w-64 sm:shrink-0">
        <ImageFrame
          ratio="landscape"
          radius="none"
          src={image.imageSrc}
          alt={image.alt || packageItem?.title || 'Your next trip'}
          focalPosition={image.focalPosition}
        />
      </div>

      <div className="flex flex-1 flex-col p-6">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={normalizeBookingStatus(booking.status)} label={bookingStatusLabel(booking.status)} />
          {days !== null && (
            <span className="text-small font-semibold text-amber-700">
              {days === 0 ? 'Starting now' : `${days} days to go`}
            </span>
          )}
        </div>

        <h3 className="mt-3 text-h4 font-display text-stone-900">{packageItem?.title}</h3>
        <p className="mt-1 text-small text-stone-600">
          {departure
            ? formatDateRange(departure.startDate, departure.endDate)
            : 'Dates being planned with our team'}
          {' · '}
          {booking.reference}
        </p>

        <div className="mt-auto pt-4">
          <Link
            to={`/customer/bookings/${booking.id}`}
            className="inline-flex rounded-lg bg-primary-700 px-4 py-2 text-small font-semibold text-white transition-colors duration-200 hover:bg-primary-800"
          >
            View booking
          </Link>
        </div>
      </div>
    </article>
  )
}
