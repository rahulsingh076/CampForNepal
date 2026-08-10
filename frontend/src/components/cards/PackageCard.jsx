// Trip card: framed image, duration, difficulty, price in the visitor's currency.
import { Link, useLocation } from 'react-router-dom'
import { useLocale } from '../../contexts/LocaleContext.jsx'
import { formatPrice, priceBasisLabel, priceLeadLabel } from '../../lib/formatters.js'
import { difficultyDetails, humanizeCode } from '../../lib/displayLabels.js'
import { primaryImageMedia } from '../../lib/media.js'
import { locationTarget } from '../../lib/returnTo.js'
import Badge from '../common/Badge.jsx'
import ListingCardAction from '../common/ListingCardAction.jsx'
import WishlistButton from '../customer/WishlistButton.jsx'
import MotionCard from '../motion/MotionCard.jsx'
import MotionImage from '../motion/MotionImage.jsx'
import useSingleton from '../../hooks/useSingleton.js'

export default function PackageCard({ item, to }) {
  const { currency } = useLocale()
  const location = useLocation()
  const settings = useSingleton('siteSettings')
  const href = to || `/packages/${item.slug}`
  const hasDiscount = Number.isFinite(item.discountPrice) && item.discountPrice < item.price
  const hasRating = Number.isFinite(item.reviewsSummary?.averageRating) && item.reviewsSummary.averageRating > 0 && item.reviewsSummary.totalReviews > 0
  const demoMode = settings.data?.demoMode !== false
  const difficulty = difficultyDetails(item.difficulty)
  const carriesResultState = ['/packages', '/trekking', '/expeditions'].includes(location.pathname)
  const detailState = carriesResultState ? { returnTo: locationTarget(location) } : undefined
  const image = primaryImageMedia(item)

  return (
    <MotionCard padding="none" className="flex h-full flex-col">
      <div className="relative">
        <MotionImage ratio="landscape" radius="none" src={image.imageSrc} alt={image.alt || item.title} focalPosition={image.focalPosition} />
        <WishlistButton type="package" id={item.id} name={item.title} />
      </div>

      <div className="flex flex-1 flex-col p-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="brand">{humanizeCode(item.type)}</Badge>
          <Badge tone="neutral" title={difficulty.help || undefined} aria-label={`Difficulty: ${difficulty.label}${difficulty.help ? `. ${difficulty.help}` : ''}`}>
            {difficulty.label}
          </Badge>
        </div>

        <p className="mt-3 text-small font-medium text-primary-800">{item.region}</p>

        <h3 className="mt-3 line-clamp-2 text-h4 font-display text-stone-900">
          <Link to={href} state={detailState} className="hover:text-primary-700">
            {item.title}
          </Link>
        </h3>

        <p className="mt-2 min-h-10 line-clamp-2 text-small text-stone-600">{item.shortDescription}</p>

        <dl className="mt-4 grid gap-x-6 gap-y-2 text-small text-stone-600 sm:grid-cols-2">
          <div className="flex gap-1">
            <dt>Duration:</dt>
            <dd>{item.duration.days} days</dd>
          </div>
          <div className="flex gap-1">
            <dt>Best season:</dt>
            <dd>{item.bestSeason?.slice(0, 2).join(' and ') || 'See trip details'}</dd>
          </div>
          {hasRating && (
            <div className="flex gap-1">
              <dt className="sr-only">Rating</dt>
              <dd>
                <span aria-hidden="true">★</span> {demoMode ? 'Sample rating: ' : ''}{item.reviewsSummary.averageRating} (
                {item.reviewsSummary.totalReviews}{demoMode ? ' sample reviews' : ''})
              </dd>
            </div>
          )}
        </dl>

        {/* mt-auto pins the price row so every card's CTA lines up. */}
        <div className="mt-auto flex flex-wrap items-end justify-between gap-4 pt-6">
          <p className="min-w-0">
            <span className="block text-small text-stone-500">{priceLeadLabel(item)}</span>
            <span className="whitespace-nowrap text-h4 font-semibold tabular-nums text-stone-900">
              {formatPrice(hasDiscount ? item.discountPrice : item.price, currency)}
            </span>
            {hasDiscount && (
              <span className="ml-2 text-small text-stone-500 line-through">
                {formatPrice(item.price, currency)}
              </span>
            )}
            <span className="block text-small text-stone-500">{priceBasisLabel(item)}</span>
          </p>

          <ListingCardAction to={href} state={detailState}>
            View trip
          </ListingCardAction>
        </div>
      </div>
    </MotionCard>
  )
}
