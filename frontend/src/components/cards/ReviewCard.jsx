// Review card: rating, country, and whether the booking was verified.
import Badge from '../common/Badge.jsx'
import Card from '../common/Card.jsx'
import useSingleton from '../../hooks/useSingleton.js'

function Stars({ rating }) {
  return (
    <p className="text-amber-600" aria-label={`${rating} out of 5`}>
      <span aria-hidden="true">{'★'.repeat(rating)}{'☆'.repeat(5 - rating)}</span>
    </p>
  )
}

export default function ReviewCard({ item, countryNames = {} }) {
  const settings = useSingleton('siteSettings')
  const demoMode = settings.data?.demoMode !== false

  return (
    <Card padding="lg" className="flex h-full flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Stars rating={item.rating} />
        {demoMode && <Badge tone="info" size="sm">Sample review</Badge>}
      </div>

      <h3 className="mt-3 text-h4 font-display text-stone-900">{item.title}</h3>
      <p className="mt-2 line-clamp-5 text-small text-stone-700">{item.reviewText}</p>

      <div className="mt-auto flex flex-wrap items-center gap-2 pt-6">
        <span className="text-small font-semibold text-stone-900">
          {demoMode ? 'Sample traveller' : item.customerName}
        </span>
        <span className="text-small text-stone-500">
          {countryNames[item.country] || item.country}
        </span>
        {item.verifiedBooking && <Badge tone={demoMode ? 'info' : 'success'}>{demoMode ? 'Sample booking record' : 'Verified booking'}</Badge>}
      </div>
    </Card>
  )
}
