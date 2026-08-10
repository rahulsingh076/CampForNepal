// Guide card. Takes an already-projected public guide, never a raw record.
import { Link, useLocation } from 'react-router-dom'
import ImageFrame from '../common/ImageFrame.jsx'
import ListingCardAction from '../common/ListingCardAction.jsx'
import Badge from '../common/Badge.jsx'
import MotionCard from '../motion/MotionCard.jsx'
import useSingleton from '../../hooks/useSingleton.js'
import { locationTarget } from '../../lib/returnTo.js'
import { humanizeCode } from '../../lib/displayLabels.js'

export default function GuideCard({ item, languageNames = {} }) {
  const location = useLocation()
  const settings = useSingleton('siteSettings')
  const demoMode = settings.data?.demoMode !== false
  const detailState = location.pathname === '/guides' ? { returnTo: locationTarget(location) } : undefined
  const hasRating = Number.isFinite(item.rating) && item.rating > 0 && item.totalReviews > 0
  const requestPath = { pathname: `/guides/${item.slug}`, hash: '#guide-request' }

  return (
    <MotionCard padding="none" className="flex h-full flex-col">
      <div className="relative">
        <ImageFrame ratio="portrait" radius="none" src={item.photo} alt={item.hasApprovedPortrait ? item.photoAlt || item.fullName : ''} focalPosition={item.photoFocalPosition} />
        {!item.hasApprovedPortrait && <p className="absolute inset-x-0 bottom-0 bg-primary-900/85 px-3 py-2 text-small font-medium text-white">Portrait owner-required</p>}
      </div>

      <div className="flex flex-1 flex-col p-6">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-small font-semibold text-primary-800">{humanizeCode(item.guideType)}</p>
          {demoMode && <Badge tone="info" size="sm">Sample guide profile</Badge>}
        </div>

        <h3 className="mt-3 line-clamp-2 text-h4 font-display text-stone-900">
          <Link to={`/guides/${item.slug}`} state={detailState} className="hover:text-primary-700">
            {item.fullName}
          </Link>
        </h3>

        <p className="mt-1 min-h-10 line-clamp-2 text-small text-stone-600">
          {demoMode ? 'Sample experience: ' : ''}{item.experienceYears} years · {item.regions.join(', ')}
        </p>

        <p className="mt-3 min-h-10 line-clamp-2 text-small text-stone-600">{item.bio}</p>

        {hasRating && (
          <p className="mt-2 text-small text-stone-700">
            <span aria-hidden="true" className="text-amber-600">
              ★
            </span>{' '}
            {demoMode ? 'Sample rating: ' : ''}{item.rating}
            {item.totalReviews > 0 && (
              <span className="text-stone-500">
                {' '}from {item.totalReviews} {demoMode ? 'sample reviews' : 'reviews'}
              </span>
            )}
          </p>
        )}

        <p className="mt-2 min-h-10 line-clamp-2 text-small text-stone-500">
          Speaks {item.languages.map((code) => languageNames[code] || code).join(', ')}
        </p>

        <div className="mt-auto pt-5">
          <ListingCardAction to={requestPath} state={detailState}>Request This Guide</ListingCardAction>
        </div>
      </div>
    </MotionCard>
  )
}
