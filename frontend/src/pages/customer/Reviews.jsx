// My Reviews: write one for a finished trip, and see what happened to each.
import { useEffect, useState } from 'react'
import EmptyState from '../../components/common/EmptyState.jsx'
import ErrorState from '../../components/common/ErrorState.jsx'
import LoadingState from '../../components/common/LoadingState.jsx'
import StatusBadge from '../../components/common/StatusBadge.jsx'
import ReviewForm from '../../components/customer/ReviewForm.jsx'
import { canReviewBooking } from '../../config/bookingStatuses.js'
import { useAuth } from '../../contexts/AuthContext.jsx'
import usePageMeta from '../../hooks/usePageMeta.js'
import { listItems } from '../../lib/dataClient.js'
import { formatDate } from '../../lib/formatters.js'

export default function Reviews() {
  usePageMeta('My Reviews', 'Reviews you have written, and trips waiting for one.')
  const { user } = useAuth()
  const [state, setState] = useState({ status: 'loading' })
  const [writingFor, setWritingFor] = useState(null)
  // Bumping attempt reruns the effect — used after a new review is submitted.
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true
    Promise.all([
      listItems('bookings', { filters: { userId: user.id }, pageSize: 0 }),
      listItems('reviews', { filters: { userId: user.id }, sort: 'createdAt', direction: 'desc', pageSize: 0 }),
      listItems('packages', { pageSize: 0 }),
    ]).then(([bookings, reviews, packages]) => {
      if (!active) return
      if (!bookings.success || !reviews.success || !packages.success) {
        setState({ status: 'error' })
        return
      }
      setState({ status: 'ready', bookings: bookings.data, reviews: reviews.data, packages: packages.data })
    })
    return () => {
      active = false
    }
  }, [user.id, attempt])

  if (state.status === 'loading') return <LoadingState label="Loading your reviews…" rows={6} />
  if (state.status === 'error') {
    return <ErrorState title="Could not load your reviews" description="Please refresh the page to try again." />
  }

  const packageFor = (id) => state.packages.find((row) => row.id === id)
  // A trip earns a review invite once it is over, and only one per booking.
  const awaiting = state.bookings.filter(
    (booking) =>
      canReviewBooking(booking.status) && !state.reviews.some((review) => review.bookingId === booking.id)
  )

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-h2 text-stone-900">My Reviews</h1>
      <p className="mt-1 text-body text-stone-600">
        Reviews from completed demo trips are saved here for moderation. They are not sent to a live review team.
      </p>

      {awaiting.length > 0 && (
        <section aria-labelledby="awaiting-heading" className="mt-8">
          <h2 id="awaiting-heading" className="text-h4 font-display text-stone-900">Waiting for your review</h2>
          <ul className="mt-3 space-y-3">
            {awaiting.map((booking) => (
              <li key={booking.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white p-4">
                <div>
                  <p className="text-body font-semibold text-stone-900">{packageFor(booking.packageId)?.title}</p>
                  <p className="text-small text-stone-600">{booking.reference}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setWritingFor(booking)}
                  className="rounded-lg bg-amber-600 px-4 py-2 text-small font-semibold text-white transition-colors duration-200 hover:bg-amber-700"
                >
                  Write a review
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="written-heading" className="mt-8">
        <h2 id="written-heading" className="text-h4 font-display text-stone-900">Written by you</h2>
        {state.reviews.length === 0 ? (
          <div className="mt-3">
            <EmptyState
              title="No reviews yet"
              description={
                awaiting.length > 0
                  ? 'Your finished trip above is ready whenever you are.'
                  : 'Once a trip finishes, you can review it here.'
              }
            />
          </div>
        ) : (
          <ul className="mt-3 space-y-3">
            {state.reviews.map((review) => (
              <li key={review.id} className="rounded-xl border border-stone-200 bg-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-body font-semibold text-stone-900">{review.title}</p>
                  <StatusBadge status={review.status} label={review.status === 'pending' ? 'Pending review' : review.status === 'published' ? 'Published' : 'Rejected'} />
                </div>
                <p className="mt-1 text-small text-stone-600">
                  <span aria-hidden="true" className="text-amber-600">{'★'.repeat(review.rating)}</span>
                  <span className="sr-only">{review.rating} out of 5 stars</span>
                  {' · '}
                  {packageFor(review.packageId)?.title} · {formatDate(review.createdAt)}
                </p>
                <p className="mt-2 text-small text-stone-700">{review.reviewText}</p>
                {review.status === 'pending' && (
                  <p className="mt-2 text-small text-stone-500">Saved for demo moderation. It stays private until an admin publishes it.</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {writingFor && (
        <ReviewForm
          booking={writingFor}
          packageItem={packageFor(writingFor.packageId)}
          open
          onClose={() => setWritingFor(null)}
          onSubmitted={() => {
            setWritingFor(null)
            setAttempt((value) => value + 1)
          }}
        />
      )}
    </div>
  )
}
