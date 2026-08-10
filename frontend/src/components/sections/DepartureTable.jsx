// Desktop view of the departures. The mobile view uses cards over the same rows.
import { Link, useLocation } from 'react-router-dom'
import { useLocale } from '../../contexts/LocaleContext.jsx'
import { difficultyDetails } from '../../lib/displayLabels.js'
import { formatDateRange, formatPrice, priceBasisLabel } from '../../lib/formatters.js'
import ListingCardAction from '../common/ListingCardAction.jsx'
import SeatMeter from '../common/SeatMeter.jsx'
import StatusBadge from '../common/StatusBadge.jsx'
import { reserveLink } from './reserveLink.js'
import { locationTarget } from '../../lib/returnTo.js'

export default function DepartureTable({ rows }) {
  const { currency } = useLocale()
  const location = useLocation()
  const detailState = { returnTo: locationTarget(location) }

  return (
    <div className="overflow-x-auto rounded-xl bg-white ring-1 ring-stone-200">
      <table className="w-full min-w-3xl border-collapse text-left">
        <caption className="sr-only">
          Scheduled group departures, earliest first
        </caption>
        <thead>
          <tr className="border-b border-stone-200 bg-sand-50">
            {['Trip', 'Dates', 'Duration', 'Price', 'Seats', 'Status', ''].map((heading) => (
              <th
                key={heading || 'actions'}
                scope="col"
                className="px-4 py-3 text-small font-semibold text-stone-800"
              >
                {heading || <span className="sr-only">Actions</span>}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-stone-200">
          {rows.map((row) => (
            <tr key={row.id} className="align-top transition-colors duration-200 hover:bg-sand-50">
              <td className="px-4 py-4">
                <p className="text-body font-semibold text-stone-900">
                  {row.trip ? <Link to={`/packages/${row.trip.slug}`} state={detailState} className="hover:text-primary-700">{row.title}</Link> : row.title}
                </p>
                {row.trip && (
                  <p className="mt-1 text-small text-stone-600" title={difficultyDetails(row.trip.difficulty).help || undefined}>
                    {row.trip.region} · {difficultyDetails(row.trip.difficulty).label}
                  </p>
                )}
                {row.guaranteed && (
                  <p className="mt-1 text-small font-medium text-success-700">
                    Guaranteed to run
                  </p>
                )}
              </td>

              <td className="px-4 py-4 text-small text-stone-700">
                {formatDateRange(row.startDate, row.endDate)}
              </td>

              <td className="px-4 py-4 text-small text-stone-700">{row.durationDays} days</td>

              <td className="px-4 py-4 text-body font-semibold text-stone-900">
                <span className="block whitespace-nowrap tabular-nums">{formatPrice(row.price, currency)}</span>
                <span className="mt-1 block text-small font-normal text-stone-500">{priceBasisLabel(row)}</span>
              </td>

              <td className="px-4 py-4">
                <SeatMeter totalSeats={row.totalSeats} bookedSeats={row.bookedSeats} />
              </td>

              <td className="px-4 py-4">
                <StatusBadge status={row.status} />
              </td>

              <td className="px-4 py-4">
                {row.canReserve ? (
                  <ListingCardAction to={reserveLink(row)} className="whitespace-nowrap">Check availability</ListingCardAction>
                ) : row.trip ? (
                  <ListingCardAction to={`/packages/${row.trip.slug}`} state={detailState} className="whitespace-nowrap">View trip</ListingCardAction>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
