// Reviews left for this trip. The summary is an aggregate, so it says so.
import useCollection from '../../hooks/useCollection.js'
import ReviewCard from '../cards/ReviewCard.jsx'
import Button from '../common/Button.jsx'
import EmptyState from '../common/EmptyState.jsx'
import ErrorState from '../common/ErrorState.jsx'
import LoadingState from '../common/LoadingState.jsx'
import StaggerGroup from '../motion/StaggerGroup.jsx'
import useSingleton from '../../hooks/useSingleton.js'

export default function PackageReviews({ packageId, summary }) {
  const reviews = useCollection('reviews', { filters: { packageId, status: 'published' } })
  const countries = useCollection('countries', {})
  const settings = useSingleton('siteSettings')
  const demoMode = settings.data?.demoMode !== false

  if (reviews.status === 'loading') return <LoadingState rows={3} label="Loading reviews" />

  if (reviews.status === 'error') {
    return (
      <ErrorState
        title="We could not load reviews"
        description="No review records were changed. Try again in a moment."
        action={<Button variant="secondary" onClick={reviews.reload}>Try again</Button>}
      />
    )
  }

  if (reviews.items.length === 0) {
    return (
      <EmptyState
        title={demoMode ? 'No sample reviews for this trip yet' : 'No reviews for this trip yet'}
        description={demoMode ? 'This demo has no sample reviews for this trip. Read the itinerary, then send an inquiry with the details that matter to you.' : 'Reviews appear here once travellers get home and write to us.'}
      />
    )
  }

  const countryNames = Object.fromEntries(
    countries.items.map((row) => [row.countryCode, row.countryName])
  )

  return (
    <>
      {summary?.totalReviews > 0 && (
        <p className="mb-6 text-small text-stone-600">
          {demoMode
            ? `Sample records: showing ${reviews.items.length} of ${summary.totalReviews} sample reviews, averaging ${summary.averageRating} out of 5.`
            : <>Showing {reviews.items.length} of {summary.totalReviews} reviews, averaging {summary.averageRating} out of 5.</>}
        </p>
      )}

      <StaggerGroup className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {reviews.items.map((item) => (
          <ReviewCard key={item.id} item={item} countryNames={countryNames} />
        ))}
      </StaggerGroup>
    </>
  )
}
