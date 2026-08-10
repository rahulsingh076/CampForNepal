// Average rating plus the distribution, so the number has context.
import Card from '../common/Card.jsx'
import useSingleton from '../../hooks/useSingleton.js'

export default function RatingSummary({ reviews }) {
  const settings = useSingleton('siteSettings')
  const demoMode = settings.data?.demoMode !== false

  if (reviews.length === 0) return null

  const total = reviews.length
  const average = Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / total) * 10) / 10

  const counts = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: reviews.filter((r) => r.rating === stars).length,
  }))

  const verified = reviews.filter((r) => r.verifiedBooking).length

  return (
    <Card padding="lg">
      <div className="grid gap-8 sm:grid-cols-3">
        <div>
          <p className="text-display font-display text-stone-900">{average}</p>
          <p className="mt-1 text-amber-600" aria-hidden="true">
            {'★'.repeat(Math.round(average))}
            {'☆'.repeat(5 - Math.round(average))}
          </p>
          <p className="mt-2 text-small text-stone-600">
            {demoMode
              ? `Sample rating: ${average} out of 5, from ${total} sample ${total === 1 ? 'review record' : 'review records'}`
              : `${average} out of 5, from ${total} published ${total === 1 ? 'review' : 'reviews'}`}
          </p>
          <p className="mt-1 text-small text-stone-600">{verified} from {demoMode ? 'sample booking records' : 'verified bookings'}</p>
        </div>

        <div className="sm:col-span-2">
          <ul className="space-y-2">
            {counts.map(({ stars, count }) => (
              <li key={stars} className="flex items-center gap-3">
                <span className="w-12 shrink-0 text-small text-stone-600">{stars} star</span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-stone-200" aria-hidden="true">
                  <span
                    className="block h-full rounded-full bg-amber-500"
                    style={{ width: `${total ? (count / total) * 100 : 0}%` }}
                  />
                </span>
                <span className="w-8 shrink-0 text-right text-small text-stone-600">{count}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  )
}
