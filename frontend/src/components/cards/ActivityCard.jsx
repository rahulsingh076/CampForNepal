// Category card for a thing to do, sized for a compact grid.
import { Link, useLocation } from 'react-router-dom'
import { difficultyDetails, humanizeCode } from '../../lib/displayLabels.js'
import { primaryImageMedia } from '../../lib/media.js'
import { locationTarget } from '../../lib/returnTo.js'
import Badge from '../common/Badge.jsx'
import ListingCardAction from '../common/ListingCardAction.jsx'
import MotionCard from '../motion/MotionCard.jsx'
import MotionImage from '../motion/MotionImage.jsx'

export default function ActivityCard({ item }) {
  const location = useLocation()
  const difficulty = difficultyDetails(item.difficulty)
  const detailState = location.pathname === '/things-to-do' ? { returnTo: locationTarget(location) } : undefined
  const image = primaryImageMedia(item)

  return (
    <MotionCard padding="none" className="flex h-full flex-col">
      <MotionImage ratio="landscape" radius="none" src={image.imageSrc} alt={image.alt || item.title} focalPosition={image.focalPosition} />

      <div className="flex flex-1 flex-col p-6">
        <Badge tone="info">{humanizeCode(item.category)}</Badge>

        <h3 className="mt-3 line-clamp-2 text-h4 font-display text-stone-900">
          <Link to={`/things-to-do/${item.slug}`} state={detailState} className="hover:text-primary-700">
            {item.title}
          </Link>
        </h3>

        <p className="mt-2 min-h-10 line-clamp-2 text-small text-stone-600">{item.shortDescription}</p>

        <p className="min-h-10 pt-4 text-small text-stone-500" title={difficulty.help || undefined} aria-label={`Difficulty: ${difficulty.label}${difficulty.help ? `. ${difficulty.help}` : ''}`}>
          Difficulty: {difficulty.label}
        </p>
        <div className="mt-auto pt-5">
          <ListingCardAction to={`/things-to-do/${item.slug}`} state={detailState}>Explore activity</ListingCardAction>
        </div>
      </div>
    </MotionCard>
  )
}
