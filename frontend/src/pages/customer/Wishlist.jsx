// Wishlist: the trips and destinations this account has saved with the heart.
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import EmptyState from '../../components/common/EmptyState.jsx'
import ErrorState from '../../components/common/ErrorState.jsx'
import LoadingState from '../../components/common/LoadingState.jsx'
import DestinationCard from '../../components/cards/DestinationCard.jsx'
import PackageCard from '../../components/cards/PackageCard.jsx'
import { useWishlist } from '../../contexts/WishlistContext.jsx'
import usePageMeta from '../../hooks/usePageMeta.js'
import { listItems } from '../../lib/dataClient.js'

const DETAIL_PATHS = { tour: '/packages', trekking: '/trekking', expedition: '/expeditions' }

export default function Wishlist() {
  usePageMeta('Wishlist', 'Trips and places you have saved for later.')
  const { saved } = useWishlist()
  const [state, setState] = useState({ status: 'loading' })

  useEffect(() => {
    let active = true

    Promise.all([listItems('packages', { pageSize: 0 }), listItems('destinations', { pageSize: 0 })]).then(
      ([packages, destinations]) => {
        if (!active) return
        if (!packages.success || !destinations.success) {
          setState({ status: 'error' })
          return
        }
        setState({ status: 'ready', packages: packages.data, destinations: destinations.data })
      }
    )

    return () => {
      active = false
    }
  }, [])

  if (state.status === 'loading') return <LoadingState label="Loading your wishlist…" rows={5} />
  if (state.status === 'error') {
    return <ErrorState title="Could not load your wishlist" description="Please refresh the page to try again." />
  }

  const savedPackages = saved
    .filter((entry) => entry.type === 'package')
    .map((entry) => state.packages.find((row) => row.id === entry.id))
    .filter(Boolean)
  const savedDestinations = saved
    .filter((entry) => entry.type === 'destination')
    .map((entry) => state.destinations.find((row) => row.id === entry.id))
    .filter(Boolean)

  return (
    <div>
      <h1 className="font-display text-h2 text-stone-900">Wishlist</h1>
      <p className="mt-1 text-body text-stone-600">
        Tap the heart on any trip or destination to keep it here. Saved in this browser only.
      </p>

      <div className="mt-8 space-y-10">
        {savedPackages.length === 0 && savedDestinations.length === 0 && (
          <EmptyState
            title="Nothing saved yet"
            description="Browse the trips and tap the heart on anything that catches your eye — it will wait for you here."
            action={
              <Link
                to="/packages"
                className="mt-6 rounded-lg bg-primary-700 px-4 py-2 text-small font-semibold text-white transition-colors duration-200 hover:bg-primary-800"
              >
                Browse trips
              </Link>
            }
          />
        )}

        {savedPackages.length > 0 && (
          <section aria-labelledby="saved-trips-heading">
            <h2 id="saved-trips-heading" className="text-h4 font-display text-stone-900">
              Saved trips
            </h2>
            <div className="mt-4 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {savedPackages.map((item) => (
                <PackageCard key={item.id} item={item} to={`${DETAIL_PATHS[item.type] || '/packages'}/${item.slug}`} />
              ))}
            </div>
          </section>
        )}

        {savedDestinations.length > 0 && (
          <section aria-labelledby="saved-places-heading">
            <h2 id="saved-places-heading" className="text-h4 font-display text-stone-900">
              Saved destinations
            </h2>
            <div className="mt-4 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {savedDestinations.map((item) => (
                <DestinationCard key={item.id} item={item} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
