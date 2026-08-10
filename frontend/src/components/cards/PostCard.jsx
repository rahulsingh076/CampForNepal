// Article card, used for both blog posts and travel updates.
import { Link, useLocation } from 'react-router-dom'
import { formatDate } from '../../lib/formatters.js'
import { locationTarget } from '../../lib/returnTo.js'
import Badge from '../common/Badge.jsx'
import ListingCardAction from '../common/ListingCardAction.jsx'
import MotionCard from '../motion/MotionCard.jsx'
import MotionImage from '../motion/MotionImage.jsx'

// Travel updates carry a severity; a blog post does not.
const SEVERITY_TONE = { info: 'info', advisory: 'cta', urgent: 'danger' }

export default function PostCard({ item, basePath = '/blog' }) {
  const location = useLocation()
  const summary = item.excerpt || item.summary
  const chip = item.contentTypeLabel || item.severity || item.category
  const detailState = location.pathname === basePath ? { returnTo: locationTarget(location) } : undefined

  return (
    <MotionCard padding="none" className="flex h-full flex-col">
      <MotionImage ratio="editorial" radius="none" src={item.featuredImage} alt={item.featuredImageAlt || item.title} focalPosition={item.featuredImageFocalPosition} />

      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={item.severity ? SEVERITY_TONE[item.severity] : 'neutral'}>
            {chip}
          </Badge>
          <span className="text-small text-stone-500">{formatDate(item.publishedAt)}</span>
        </div>

        <h3 className="mt-3 line-clamp-2 text-h4 font-display text-stone-900">
          <Link to={`${basePath}/${item.slug}`} state={detailState} className="hover:text-primary-700">
            {item.title}
          </Link>
        </h3>

        <p className="mt-2 min-h-16 line-clamp-3 text-small text-stone-600">{summary}</p>

        <p className="mt-4 min-h-10 text-small text-stone-500">
          {item.author && <span>{item.author}</span>}
          {item.author && item.readingMinutes && <span aria-hidden="true"> · </span>}
          {item.readingMinutes && (
            <span>{item.readingMinutes} minute read</span>
          )}
        </p>

        <div className="mt-auto pt-5">
          <ListingCardAction to={`${basePath}/${item.slug}`} state={detailState}>
            Read article
          </ListingCardAction>
        </div>
      </div>
    </MotionCard>
  )
}
