import useCollection, { orderByIds } from '../../hooks/useCollection.js'
import ReviewCard from '../cards/ReviewCard.jsx'
import StaggerGroup from '../motion/StaggerGroup.jsx'
import SectionShell from './SectionShell.jsx'

// Once the moderation team marks any review as featured, that deliberate list
// takes precedence over the old seeded picks in the homepage section.
export default function FeaturedReviewsSection({ section, lookups = {} }) {
  const reviews = useCollection('reviews', { filters: { status: 'published' }, sort: 'createdAt', direction: 'desc', pageSize: 0 })
  const featured = reviews.items.filter((review) => review.featured)
  const picked = featured.length ? featured : orderByIds(reviews.items, section.itemIds).slice(0, 6)

  return (
    <SectionShell section={section} status={reviews.status} isEmpty={picked.length === 0} onRetry={reviews.reload}>
      <StaggerGroup className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {picked.map((review) => <ReviewCard key={review.id} item={review} countryNames={lookups.countryNames} />)}
      </StaggerGroup>
    </SectionShell>
  )
}
