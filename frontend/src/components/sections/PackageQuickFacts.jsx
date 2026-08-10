// The bar of headline numbers directly under the hero.
import { useLocale } from '../../contexts/LocaleContext.jsx'
import { difficultyDetails } from '../../lib/displayLabels.js'
import { formatNumber, formatPrice, priceBasisLabel } from '../../lib/formatters.js'
import useCollection from '../../hooks/useCollection.js'
import useSingleton from '../../hooks/useSingleton.js'
import Container from '../common/Container.jsx'

const JOINABLE = ['booking_open', 'almost_full', 'guaranteed']

function availabilityLabel(status, departures, demoMode) {
  if (status === 'loading') return 'Checking dates'
  if (status === 'error') return 'Ask about dates'
  const joinable = departures.filter((departure) => (
    JOINABLE.includes(departure.status) && departure.bookedSeats < departure.totalSeats
  ))
  const label = joinable.length > 0
    ? `${joinable.length} upcoming date${joinable.length === 1 ? '' : 's'}`
    : 'Private dates on request'
  return demoMode ? `Sample: ${label}` : label
}

export default function PackageQuickFacts({ item }) {
  const { currency } = useLocale()
  const departures = useCollection('fixedDepartures', { filters: { packageId: item.id } })
  const settings = useSingleton('siteSettings')
  const demoMode = settings.data?.demoMode !== false
  const difficulty = difficultyDetails(item.difficulty)

  const facts = [
    { label: 'Duration', value: `${item.duration.days} days` },
    { label: 'Difficulty', value: difficulty.label, help: difficulty.help },
    item.maxElevationMetres >= 1000 && {
      label: 'Highest point',
      value: `${formatNumber(item.maxElevationMetres)}m`,
    },
    { label: 'Group size', value: `${item.groupSize.min} to ${item.groupSize.max}` },
    { label: 'Best season', value: item.bestSeason.slice(0, 3).join(', ') },
    {
      label: 'From',
      value: formatPrice(item.discountPrice ?? item.price, currency),
      detail: priceBasisLabel(item),
    },
    { label: 'Availability', value: availabilityLabel(departures.status, departures.items, demoMode) },
  ].filter(Boolean)

  return (
    <div className="border-y border-stone-200 bg-white py-8">
      <Container>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3 lg:grid-cols-7">
          {facts.map((fact) => (
            <div key={fact.label}>
              <dt className="text-small text-stone-600">{fact.label}</dt>
              <dd className="mt-1 text-h4 font-semibold text-stone-900" title={fact.help || undefined}>{fact.value}</dd>
              {fact.detail && <p className="mt-1 text-small text-stone-500">{fact.detail}</p>}
            </div>
          ))}
        </dl>
      </Container>
    </div>
  )
}
