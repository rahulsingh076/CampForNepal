// Reviews left about one guide.
import useCollection from '../../hooks/useCollection.js'
import ReviewCard from '../cards/ReviewCard.jsx'
import Button from '../common/Button.jsx'
import EmptyState from '../common/EmptyState.jsx'
import ErrorState from '../common/ErrorState.jsx'
import LoadingState from '../common/LoadingState.jsx'
import StaggerGroup from '../motion/StaggerGroup.jsx'
import useSingleton from '../../hooks/useSingleton.js'

export default function GuideReviews({ guideId, totalReviews }) {
  const reviews = useCollection('reviews', { filters: { guideId, status: 'published' } })
  const countries = useCollection('countries', {})
  const settings = useSingleton('siteSettings')
  const demoMode = settings.data?.demoMode !== false

  if (reviews.status === 'loading') return <LoadingState rows={3} label="Loading reviews" />

  if (reviews.status === 'error') {
    return (
        <ErrorState
          title="We could not load these reviews"
          description="No review records were changed. Try again in a moment."
        action={<Button variant="secondary" onClick={reviews.reload}>Try again</Button>}
      />
    )
  }

  if (reviews.items.length === 0) {
    return (
      <EmptyState
        title={demoMode ? 'No sample reviews for this guide yet' : 'No reviews for this guide yet'}
        description={demoMode ? 'This demo has no sample reviews for this profile. You can still request the guide or compare the full team.' : 'Reviews appear here once travellers get home and write to us.'}
      />
    )
  }

  const countryNames = Object.fromEntries(
    countries.items.map((row) => [row.countryCode, row.countryName])
  )

  return (
    <>
      {totalReviews > reviews.items.length && (
        <p className="mb-6 text-small text-stone-600">
          {demoMode
            ? `Sample records: showing ${reviews.items.length} of ${totalReviews} sample reviews.`
            : <>Showing {reviews.items.length} of {totalReviews} reviews.</>}
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
