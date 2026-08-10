// The booking call to action: a sticky card on desktop, a bottom bar on mobile.
// No payment anywhere — this collects interest and opens the request flow.
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLocale } from '../../contexts/LocaleContext.jsx'
import { describePriceBasis, formatPrice, priceBasisLabel } from '../../lib/formatters.js'
import Button from '../common/Button.jsx'
import Card from '../common/Card.jsx'
import useSingleton from '../../hooks/useSingleton.js'

function Price({ item, currency }) {
  const hasDiscount = Number.isFinite(item.discountPrice) && item.discountPrice < item.price

  return (
    <p>
      <span className="block text-small text-stone-600">From</span>
      <span className="whitespace-nowrap text-h3 font-semibold tabular-nums text-stone-900">
        {formatPrice(hasDiscount ? item.discountPrice : item.price, currency)}
      </span>
      {hasDiscount && (
        <span className="ml-2 text-small text-stone-500 line-through">
          {formatPrice(item.price, currency)}
        </span>
        )}
      <span className="block text-small text-stone-600">{priceBasisLabel(item)}</span>
    </p>
  )
}

export default function BookingSummary({ item }) {
  const { currency } = useLocale()
  const contact = useSingleton('contactDetails')
  const [formFocused, setFormFocused] = useState(false)

  useEffect(() => {
    function syncFocus() {
      setFormFocused(Boolean(document.activeElement?.closest?.('#inquiry')))
    }

    function onFocusOut() {
      requestAnimationFrame(syncFocus)
    }

    document.addEventListener('focusin', syncFocus)
    document.addEventListener('focusout', onFocusOut)
    return () => {
      document.removeEventListener('focusin', syncFocus)
      document.removeEventListener('focusout', onFocusOut)
    }
  }, [])

  return (
    <>
      {/* Desktop: rides alongside the content, never over it. */}
      <div className="hidden lg:block">
        <div className="trip-summary-sticky sticky">
          <Card padding="lg">
            <Price item={item} currency={currency} />
            <p className="mt-2 text-small text-stone-600">{describePriceBasis(currency)}</p>

            <div className="mt-6 space-y-3">
              <Button href="#inquiry" fullWidth>
                Check Availability
              </Button>
              <Button href="/contact" variant="secondary" fullWidth>
                Talk to a Trip Expert
              </Button>
            </div>

            <ul className="mt-6 space-y-3 border-t border-stone-200 pt-5 text-small text-stone-700">
              <li>Dates, party details, and trip information are checked before confirmation.</li>
              {contact.data?.responseTime && <li>{contact.data.responseTime}</li>}
              <li>
                Read the{' '}
                <Link to="/cancellation-policy" className="font-semibold text-primary-800 underline underline-offset-4 hover:text-primary-700">cancellation policy</Link>,{' '}
                <Link to="/privacy-policy" className="font-semibold text-primary-800 underline underline-offset-4 hover:text-primary-700">privacy policy</Link>, and{' '}
                <Link to="/terms-and-conditions" className="font-semibold text-primary-800 underline underline-offset-4 hover:text-primary-700">terms</Link>.
              </li>
              <li>No payment is requested in this V1 demo.</li>
            </ul>
          </Card>
        </div>
      </div>

      {/* Mobile: a bar pinned to the bottom. The page reserves space for it, and
          the right padding keeps the buttons clear of the WhatsApp button. */}
      <div className={`trip-mobile-action safe-area-cta fixed inset-x-0 bottom-0 z-sticky border-t border-stone-200 bg-white px-4 pt-4 pr-20 shadow-lg transition-all duration-200 lg:hidden ${formFocused ? 'pointer-events-none translate-y-full opacity-0' : ''}`}>
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-small text-stone-600">Availability check. No payment.</p>
            <p className="mt-1 whitespace-nowrap text-h4 font-semibold tabular-nums text-stone-900">{formatPrice(item.discountPrice ?? item.price, currency)}</p>
          </div>
          {/* A plain anchor, because this jumps within the page rather than routing. */}
          <a href="#inquiry" className="flex min-h-11 shrink-0 items-center rounded-lg bg-amber-600 px-3 py-2 text-small font-semibold text-white">
            Check Availability
          </a>
        </div>
      </div>
    </>
  )
}
