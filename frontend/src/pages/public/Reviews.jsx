// The review wall, filtered by country and by trip.
import ReviewCard from '../../components/cards/ReviewCard.jsx'
import Button from '../../components/common/Button.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import ErrorState from '../../components/common/ErrorState.jsx'
import DemoNotice from '../../components/common/DemoNotice.jsx'
import FilterPanel from '../../components/common/FilterPanel.jsx'
import LoadingState from '../../components/common/LoadingState.jsx'
import PageHeader from '../../components/common/PageHeader.jsx'
import Section from '../../components/common/Section.jsx'
import StaggerGroup from '../../components/motion/StaggerGroup.jsx'
import RatingSummary from '../../components/sections/RatingSummary.jsx'
import useCollection from '../../hooks/useCollection.js'
import usePageMeta from '../../hooks/usePageMeta.js'
import useUrlFilterState from '../../hooks/useUrlFilterState.js'
import { matchesText } from '../../lib/queryList.js'

const TITLE = 'Sample reviews'
const DESCRIPTION =
  'Sample review records for this browser-only demo. They show the review layout, not real customer evidence.'

const NO_FILTERS = { search: '', country: '', packageId: '' }

export default function Reviews() {
  usePageMeta(TITLE, DESCRIPTION)

  const reviews = useCollection('reviews', {
    filters: { status: 'published' },
    sort: 'createdAt',
    direction: 'desc',
  })
  const countries = useCollection('countries', {})
  const packages = useCollection('packages', { filters: { status: 'published' } })
  const { choice, applyChoice, clear } = useUrlFilterState(NO_FILTERS)

  const countryNames = Object.fromEntries(
    countries.items.map((row) => [row.countryCode, row.countryName])
  )

  const visible = reviews.items.filter(
    (review) =>
      matchesText(choice.search, [review.title, review.reviewText]) &&
      (!choice.country || review.country === choice.country) &&
      (!choice.packageId || review.packageId === choice.packageId)
  )

  return (
    <>
      <PageHeader title={TITLE} description={DESCRIPTION} />

      <Section>
        <DemoNotice context="evidence" className="mb-6" />
        {reviews.status === 'loading' && <LoadingState rows={6} label="Loading reviews" />}

        {reviews.status === 'error' && (
          <ErrorState
            title="We could not load the reviews"
                  description="No review records were changed. Try again, or return to the trip list."
            action={
              <Button variant="secondary" onClick={reviews.reload}>
                Try again
              </Button>
            }
          />
        )}

        {reviews.status === 'ready' && (
          <>
            <RatingSummary reviews={reviews.items} />

            <div className="mt-10">
              <FilterPanel
                resultCount={visible.length}
                totalCount={reviews.items.length}
                onApply={applyChoice}
                onClear={clear}
                filters={[
                  {
                    name: 'search',
                    label: 'Search reviews',
                    placeholder: 'Review topic',
                    control: 'search',
                    value: choice.search,
                    options: [],
                  },
                  {
                    name: 'country',
                    label: 'Traveller from',
                    anyLabel: 'Everywhere',
                    value: choice.country,
                    options: [...new Set(reviews.items.map((r) => r.country))]
                      .sort()
                      .map((code) => ({ value: code, label: countryNames[code] || code })),
                  },
                  {
                    name: 'packageId',
                    label: 'Trip',
                    anyLabel: 'Any trip',
                    value: choice.packageId,
                    options: [...new Set(reviews.items.map((r) => r.packageId).filter(Boolean))]
                      .map((id) => ({
                        value: id,
                        label: packages.items.find((p) => p.id === id)?.title || id,
                      })),
                  },
                ]}
              />
            </div>

            <div className="mt-10">
              {visible.length === 0 ? (
                <EmptyState
                  title="No reviews match those filters"
                  description="Try another country or clear the trip filter. These are sample records in this demo."
                  action={
                    <Button variant="secondary" onClick={clear}>
                      Clear filters
                    </Button>
                  }
                />
              ) : (
                <StaggerGroup className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {visible.map((review) => (
                    <ReviewCard key={review.id} item={review} countryNames={countryNames} />
                  ))}
                </StaggerGroup>
              )}
            </div>
          </>
        )}
      </Section>
    </>
  )
}
