// Heart toggle on cards. Signed-in state lives per account in this browser.
import { Link, useLocation } from 'react-router-dom'
import { useToast } from '../admin/Toast.jsx'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { useWishlist } from '../../contexts/WishlistContext.jsx'
import { locationTarget } from '../../lib/returnTo.js'

export default function WishlistButton({ type, id, name }) {
  const { user } = useAuth()
  const { isSaved, toggle } = useWishlist()
  const { showToast } = useToast()
  const location = useLocation()

  if (!user) {
    return (
      <Link
        to="/login"
        state={{ from: locationTarget(location) }}
        title="Sign in to save this trip in your browser"
        aria-label={`Sign in to save ${name} to your wishlist. Saved trips are kept in this browser.`}
        className="absolute right-3 top-3 z-base flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-stone-700 shadow-sm transition-colors duration-200 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700"
      >
        <svg className="h-5 w-5 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 20s-7-4.5-7-9a4 4 0 017-2.6A4 4 0 0119 11c0 4.5-7 9-7 9z" />
        </svg>
      </Link>
    )
  }
  const saved = isSaved(type, id)

  return (
    <button
      type="button"
      onClick={() => {
        toggle(type, id)
        showToast(saved ? `${name} removed from saved trips.` : `${name} saved in this browser.`)
      }}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${name} from wishlist` : `Save ${name} to wishlist`}
      className="absolute right-3 top-3 z-base flex h-11 w-11 items-center justify-center rounded-full bg-white/90 shadow-sm transition-colors duration-200 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700"
    >
      <svg
        className={`h-5 w-5 ${saved ? 'fill-danger-600 stroke-danger-600' : 'fill-none stroke-stone-700'}`}
        viewBox="0 0 24 24"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 20s-7-4.5-7-9a4 4 0 017-2.6A4 4 0 0119 11c0 4.5-7 9-7 9z" />
      </svg>
    </button>
  )
}
