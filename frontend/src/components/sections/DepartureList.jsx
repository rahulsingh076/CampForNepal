// Mobile view of the departures: the same rows as the table, as cards.
import { Link, useLocation } from 'react-router-dom'
import { useLocale } from '../../contexts/LocaleContext.jsx'
import { difficultyDetails } from '../../lib/displayLabels.js'
import { formatDateRange, formatPrice, priceBasisLabel } from '../../lib/formatters.js'
import Card from '../common/Card.jsx'
import ListingCardAction from '../common/ListingCardAction.jsx'
import SeatMeter from '../common/SeatMeter.jsx'
import StatusBadge from '../common/StatusBadge.jsx'
import StaggerGroup from '../motion/StaggerGroup.jsx'
import { reserveLink } from './reserveLink.js'
import { locationTarget } from '../../lib/returnTo.js'

export default function DepartureList({ rows }) {
  const { currency } = useLocale()
  const location = useLocation()
  const detailState = { returnTo: locationTarget(location) }

  return (
    <StaggerGroup className="grid gap-4">
      {rows.map((row) => {
        const difficulty = difficultyDetails(row.trip?.difficulty)
        const actionTo = row.canReserve ? reserveLink(row) : row.trip ? `/packages/${row.trip.slug}` : ''
        const actionLabel = row.canReserve ? 'Check availability' : 'View trip'

        return (
          <Card key={row.id} padding="md" className="flex h-full flex-col">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={row.status} />
              {row.guaranteed && (
                <span className="text-small font-medium text-stone-700">Guaranteed to run</span>
              )}
            </div>

            <h3 className="mt-3 line-clamp-2 text-h4 font-display text-stone-900">
              {row.trip ? <Link to={`/packages/${row.trip.slug}`} state={detailState} className="hover:text-primary-700">{row.title}</Link> : row.title}
            </h3>

            <p className="mt-1 min-h-10 text-small text-stone-600" title={difficulty.help || undefined}>
              {formatDateRange(row.startDate, row.endDate)} · {row.durationDays} days
              {row.trip ? ` · ${difficulty.label}` : ''}
            </p>

            <div className="mt-4">
              <SeatMeter totalSeats={row.totalSeats} bookedSeats={row.bookedSeats} />
            </div>

            <div className="mt-auto flex flex-wrap items-end justify-between gap-4 pt-6">
              <p>
                <span className="block whitespace-nowrap text-h4 font-semibold tabular-nums text-stone-900">{formatPrice(row.price, currency)}</span>
                <span className="block text-small text-stone-500">{priceBasisLabel(row)}</span>
              </p>
              {actionTo && <ListingCardAction to={actionTo} state={row.canReserve ? undefined : detailState}>{actionLabel}</ListingCardAction>}
            </div>
          </Card>
        )
      })}
    </StaggerGroup>
  )
}
