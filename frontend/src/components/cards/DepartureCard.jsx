// Fixed departure card: dates, status, price basis, and an inquiry-led action.
import { useLocale } from '../../contexts/LocaleContext.jsx'
import { formatDateRange, formatPrice, priceBasisLabel } from '../../lib/formatters.js'
import Card from '../common/Card.jsx'
import ListingCardAction from '../common/ListingCardAction.jsx'
import SeatMeter from '../common/SeatMeter.jsx'
import StatusBadge from '../common/StatusBadge.jsx'
import { reserveLink } from '../sections/reserveLink.js'

export default function DepartureCard({ item, packageSlug }) {
  const { currency } = useLocale()
  const inquiryTo = packageSlug
    ? reserveLink({ ...item, trip: { title: item.title, slug: packageSlug } })
    : ''

  return (
    <Card padding="md" className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={item.status} />
      </div>

      <h3 className="mt-3 line-clamp-2 text-h4 font-display text-stone-900">{item.title}</h3>

      <p className="mt-2 min-h-10 text-small text-stone-600">
        {formatDateRange(item.startDate, item.endDate)} · {item.durationDays} days
      </p>

      <div className="mt-4"><SeatMeter totalSeats={item.totalSeats} bookedSeats={item.bookedSeats} /></div>

      <div className="mt-auto flex flex-wrap items-end justify-between gap-4 pt-6">
        <p>
          <span className="block whitespace-nowrap text-h4 font-semibold tabular-nums text-stone-900">{formatPrice(item.price, currency)}</span>
          <span className="block text-small text-stone-500">{priceBasisLabel(item)}</span>
        </p>
        {inquiryTo && <ListingCardAction to={inquiryTo}>Check availability</ListingCardAction>}
      </div>
    </Card>
  )
}
