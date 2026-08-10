// The at-a-glance facts for one booking: trip, dates, travellers, requests.
import { Link } from 'react-router-dom'
import ImageFrame from '../common/ImageFrame.jsx'
import { formatDateRange } from '../../lib/formatters.js'
import { primaryImageMedia } from '../../lib/media.js'

const DETAIL_PATHS = { tour: '/packages', trekking: '/trekking', expedition: '/expeditions' }

export default function BookingTripSummary({ booking, packageItem, departure }) {
  const tripPath = `${DETAIL_PATHS[packageItem.type] || '/packages'}/${packageItem.slug}`
  const image = primaryImageMedia(packageItem)

  const facts = [
    {
      label: 'Dates',
      value: departure
        ? formatDateRange(departure.startDate, departure.endDate)
        : 'Being planned with our team',
    },
    {
      label: 'Travellers',
      value: `${booking.travellers.adults} adult${booking.travellers.adults === 1 ? '' : 's'}${
        booking.travellers.children > 0
          ? `, ${booking.travellers.children} child${booking.travellers.children === 1 ? '' : 'ren'}`
          : ''
      }`,
    },
    { label: 'Duration', value: `${packageItem.duration.days} days` },
    { label: 'Lead traveller', value: booking.leadTraveller.fullName },
  ]

  return (
    <section aria-label="Trip summary" className="overflow-hidden rounded-xl border border-stone-200 bg-white sm:flex">
      <div className="sm:w-56 sm:shrink-0">
        <ImageFrame ratio="landscape" radius="none" src={image.imageSrc} alt={image.alt || packageItem.title} focalPosition={image.focalPosition} />
      </div>

      <div className="flex-1 p-6">
        <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
          {facts.map((fact) => (
            <div key={fact.label}>
              <dt className="text-small text-stone-600">{fact.label}</dt>
              <dd className="text-body font-semibold text-stone-900">{fact.value}</dd>
            </div>
          ))}
        </dl>

        {booking.specialRequests && (
          <div className="mt-4 border-t border-stone-200 pt-4">
            <p className="text-small text-stone-600">Special requests</p>
            <p className="mt-1 text-small text-stone-800">{booking.specialRequests}</p>
          </div>
        )}

        <Link to={tripPath} className="mt-4 inline-block text-small font-semibold text-primary-700 hover:text-primary-800">
          View the full itinerary →
        </Link>
      </div>
    </section>
  )
}
