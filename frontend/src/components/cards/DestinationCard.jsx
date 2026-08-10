// Destination card with a hover image zoom.
import { Link, useLocation } from 'react-router-dom'
import { primaryImageMedia } from '../../lib/media.js'
import { locationTarget } from '../../lib/returnTo.js'
import ListingCardAction from '../common/ListingCardAction.jsx'
import WishlistButton from '../customer/WishlistButton.jsx'
import MotionCard from '../motion/MotionCard.jsx'
import MotionImage from '../motion/MotionImage.jsx'

export default function DestinationCard({ item }) {
  const location = useLocation()
  const detailState = location.pathname === '/destinations' ? { returnTo: locationTarget(location) } : undefined
  const image = primaryImageMedia(item)

  return (
    <MotionCard padding="none" className="flex h-full flex-col">
      <div className="relative">
        <MotionImage ratio="landscape" radius="none" src={image.imageSrc} alt={image.alt || item.title} focalPosition={image.focalPosition} />
        <WishlistButton type="destination" id={item.id} name={item.title} />
      </div>

      <div className="flex flex-1 flex-col p-6">
        <p className="text-small font-semibold uppercase tracking-widest text-amber-700">
          {item.region}
        </p>

        <h3 className="mt-2 line-clamp-2 text-h4 font-display text-stone-900">
          <Link to={`/destinations/${item.slug}`} state={detailState} className="hover:text-primary-700">
            {item.title}
          </Link>
        </h3>

        <p className="mt-2 min-h-10 line-clamp-2 text-small text-stone-600">{item.shortDescription}</p>

        <p className="min-h-10 pt-4 text-small text-stone-500">
          {item.bestSeason?.length > 0 ? `Best time: ${item.bestSeason.slice(0, 3).join(', ')}` : 'Season details on the destination page'}
        </p>

        <div className="mt-auto pt-5">
          <ListingCardAction to={`/destinations/${item.slug}`} state={detailState}>Explore destination</ListingCardAction>
        </div>
      </div>
    </MotionCard>
  )
}
