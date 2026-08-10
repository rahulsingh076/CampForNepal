// Destination list with region and season filters.
import DestinationCard from '../../components/cards/DestinationCard.jsx'
import Button from '../../components/common/Button.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import ErrorState from '../../components/common/ErrorState.jsx'
import FilterPanel from '../../components/common/FilterPanel.jsx'
import LoadingState from '../../components/common/LoadingState.jsx'
import PageHeader from '../../components/common/PageHeader.jsx'
import Section from '../../components/common/Section.jsx'
import StaggerGroup from '../../components/motion/StaggerGroup.jsx'
import useCollection from '../../hooks/useCollection.js'
import usePageMeta from '../../hooks/usePageMeta.js'
import useUrlFilterState from '../../hooks/useUrlFilterState.js'
import { matchesText } from '../../lib/queryList.js'

const TITLE = 'Destinations'
const DESCRIPTION =
  'The regions we know best, from the Khumbu and the Annapurnas to Chitwan and Lumbini, with the seasons that suit each one.'
const NO_FILTERS = { search: '', region: '', season: '' }

// Builds a sorted, de-duplicated option list out of whatever the data holds.
function optionsFrom(items, pick) {
  const values = new Set()
  items.forEach((item) => [].concat(pick(item) || []).forEach((value) => values.add(value)))
  return [...values].sort().map((value) => ({ value, label: value }))
}

export default function Destinations() {
  usePageMeta(TITLE, DESCRIPTION)

  const { status, items, reload } = useCollection('destinations', {
    filters: { status: 'published' },
  })
  const { choice, applyChoice, clear } = useUrlFilterState(NO_FILTERS)

  const visible = [...items]
    .filter((item) =>
      matchesText(choice.search, [item.title, item.shortDescription, item.region, item.bestSeason]) &&
      (!choice.region || item.region === choice.region) &&
      (!choice.season || item.bestSeason?.includes(choice.season))
    )
    .sort((left, right) => left.title.localeCompare(right.title))

  return (
    <>
      <PageHeader title={TITLE} description={DESCRIPTION} />

      <Section>
        {status === 'loading' && <LoadingState rows={6} label="Loading destinations" />}

        {status === 'error' && (
          <ErrorState
            title="We could not load the destinations"
            description="Something went wrong on our side. Please try again."
            action={
              <Button variant="secondary" onClick={reload}>
                Try again
              </Button>
            }
          />
        )}

        {status === 'ready' && (
          <>
            <FilterPanel
              resultCount={visible.length}
              totalCount={items.length}
              onApply={applyChoice}
              onClear={clear}
              filters={[
                {
                  name: 'search',
                  label: 'Search destinations',
                  placeholder: 'Place or region',
                  control: 'search',
                  value: choice.search,
                  options: [],
                },
                {
                  name: 'region',
                  label: 'Region',
                  anyLabel: 'Every region',
                  value: choice.region,
                  options: optionsFrom(items, (item) => item.region),
                },
                {
                  name: 'season',
                  label: 'Best season',
                  anyLabel: 'Any time of year',
                  value: choice.season,
                  options: optionsFrom(items, (item) => item.bestSeason),
                },
              ]}
            />

            <div className="mt-10">
              {visible.length === 0 ? (
                <EmptyState
                  title="No destinations match those filters"
                  description="Try a different region, or clear the season filter to see everything."
                  action={
                    <Button variant="secondary" onClick={clear}>
                      Clear all
                    </Button>
                  }
                />
              ) : (
                <StaggerGroup className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {visible.map((item) => (
                    <DestinationCard key={item.id} item={item} />
                  ))}
                </StaggerGroup>
              )}
            </div>
          </>
        )}
      </Section>
    </>
  )
}
