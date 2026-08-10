// Preview scaffolding: shows how the site adapts to the visitor's country and currency.
import { useEffect, useState } from 'react'
import Button from '../../components/common/Button.jsx'
import Card from '../../components/common/Card.jsx'
import LocaleSwitcher from '../../components/common/LocaleSwitcher.jsx'
import { useLocale } from '../../contexts/LocaleContext.jsx'
import { getItem } from '../../lib/dataClient.js'
import { describePriceBasis, formatDate, formatPrice } from '../../lib/formatters.js'

// Sample amounts in USD, the currency every price is stored in.
const SAMPLE_PRICES = [1650, 2250, 420, 42000]

export default function LocalePreview() {
  const locale = useLocale()
  const [country, setCountry] = useState(null)

  useEffect(() => {
    let active = true
    getItem('countries', locale.country).then((result) => {
      if (active) setCountry(result.success ? result.data : null)
    })
    return () => {
      active = false
    }
  }, [locale.country])

  return (
    <div className="space-y-8">
      <Card padding="lg">
        <h3 className="text-h4 font-display text-stone-900">Change your locale</h3>
        <p className="mt-2 text-small text-stone-600">
          The same switcher that sits in the public header. Everything below reacts
          to it immediately.
        </p>
        <div className="mt-6">
          <LocaleSwitcher />
        </div>
      </Card>

      <Card padding="lg">
        <h3 className="text-h4 font-display text-stone-900">Prices adapt</h3>
        <p className="mt-2 text-small text-stone-600">{describePriceBasis(locale.currency)}</p>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {SAMPLE_PRICES.map((amount) => (
            <li
              key={amount}
              className="flex items-baseline justify-between rounded-lg bg-sand-100 px-4 py-3"
            >
              <span className="text-small font-mono text-stone-500">${amount} USD</span>
              <span className="text-body font-semibold text-stone-900">
                {formatPrice(amount, locale.currency)}
              </span>
            </li>
          ))}
        </ul>
      </Card>

      <Card padding="lg">
        <h3 className="text-h4 font-display text-stone-900">Support text adapts</h3>
        {country ? (
          <>
            <p className="mt-4 text-body text-stone-700">{country.suggestedSupportText}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {country.recommendedContentTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-primary-100 px-3 py-1 text-small text-primary-800"
                >
                  {tag}
                </span>
              ))}
            </div>
          </>
        ) : (
          <p className="mt-4 text-small text-stone-600">No country selected.</p>
        )}
        <p className="mt-6 text-small text-stone-600">
          Dates format consistently too: {formatDate('2026-10-12')}.
        </p>
      </Card>

      <Card padding="lg">
        <h3 className="text-h4 font-display text-stone-900">Reset onboarding</h3>
        <p className="mt-2 text-small text-stone-600">
          Clears the four saved locale keys and sends you back to the welcome screen.
        </p>
        <div className="mt-6">
          <Button variant="secondary" onClick={locale.resetOnboarding}>
            {locale.t('locale.reset')}
          </Button>
        </div>
      </Card>
    </div>
  )
}
