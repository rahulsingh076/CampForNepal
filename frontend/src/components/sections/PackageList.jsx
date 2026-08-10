// The shared list engine behind /packages, /trekking and /expeditions.
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import useCollection from '../../hooks/useCollection.js'
import {
  DURATIONS,
  NO_FILTERS,
  PRICES,
  SORTS,
  filterPackages,
  optionsFrom,
  sortPackages,
} from '../../config/packageFilters.js'
import PackageCard from '../cards/PackageCard.jsx'
import Button from '../common/Button.jsx'
import EmptyState from '../common/EmptyState.jsx'
import ErrorState from '../common/ErrorState.jsx'
import FilterPanel from '../common/FilterPanel.jsx'
import LoadingState from '../common/LoadingState.jsx'
import Section from '../common/Section.jsx'
import StaggerGroup from '../motion/StaggerGroup.jsx'
import { difficultyDetails } from '../../lib/displayLabels.js'

const FILTER_QUERY_KEYS = Object.keys(NO_FILTERS)

function choicesMatch(left, right) {
  return FILTER_QUERY_KEYS.every((key) => left[key] === right[key])
}

function choiceFromParams(params, destinationItems) {
  const destinationValue = params.get('destination') || ''
  const destination = destinationItems.find((item) => item.id === destinationValue || item.slug === destinationValue)

  return FILTER_QUERY_KEYS.reduce((choice, key) => ({
    ...choice,
    [key]: key === 'destination' ? destination?.id || '' : params.get(key) || '',
  }), { ...NO_FILTERS })
}

export default function PackageList({ type }) {
  const packages = useCollection('packages', type ? { filters: { type } } : {})
  const destinations = useCollection('destinations', { filters: { status: 'published' } })
  const [params, setParams] = useSearchParams()
  const [choice, setChoice] = useState(() => choiceFromParams(params, []))

  // The quick-explore panel sends a readable slug; filtering works on ids, so
  // both slugs and ids are normalised once the destination list has loaded.
  useEffect(() => {
    if (destinations.status !== 'ready') return

    const nextChoice = choiceFromParams(params, destinations.items)
    setChoice((current) => (choicesMatch(current, nextChoice) ? current : nextChoice))
  }, [destinations.items, destinations.status, params])

  useEffect(() => {
    if (destinations.status !== 'ready') return

    const nextParams = new URLSearchParams(params)
    FILTER_QUERY_KEYS.forEach((key) => nextParams.delete(key))
    FILTER_QUERY_KEYS.forEach((key) => {
      const value = key === 'destination'
        ? destinations.items.find((item) => item.id === choice.destination)?.slug || ''
        : choice[key]
      if (value) nextParams.set(key, value)
    })
    if (nextParams.toString() !== params.toString()) setParams(nextParams)
  }, [choice, destinations.items, destinations.status, params, setParams])

  const clear = () => setChoice({ ...NO_FILTERS })

  const publishedPackages = packages.items.filter((item) => item.status === 'published')
  const visible = sortPackages(filterPackages(publishedPackages, choice), choice.sort)

  return (
    <Section>
      {packages.status === 'loading' && <LoadingState rows={6} label="Loading trips" />}

      {packages.status === 'error' && (
        <ErrorState
          title="We could not load these trips"
          description="Something went wrong on our side. Please try again."
          action={
            <Button variant="secondary" onClick={packages.reload}>
              Try again
            </Button>
          }
        />
      )}

      {packages.status === 'ready' && (
        <>
          <FilterPanel
            resultCount={visible.length}
            totalCount={publishedPackages.length}
            onApply={setChoice}
            onClear={clear}
            filters={[
              {
                name: 'search',
                label: 'Search trips',
                placeholder: 'Trip, region, or season',
                control: 'search',
                value: choice.search,
                options: [],
              },
              {
                name: 'destination',
                label: 'Destination',
                anyLabel: 'Anywhere in Nepal',
                value: choice.destination,
                options: destinations.items.map((row) => ({ value: row.id, label: row.title })),
              },
              {
                name: 'duration',
                label: 'Duration',
                anyLabel: 'Any length',
                value: choice.duration,
                options: DURATIONS,
              },
              {
                name: 'price',
                label: 'Price range',
                anyLabel: 'Any price',
                value: choice.price,
                options: PRICES,
              },
              {
                name: 'difficulty',
                label: 'Difficulty',
                anyLabel: 'Any difficulty',
                value: choice.difficulty,
                options: optionsFrom(publishedPackages, (item) => item.difficulty, (value) => difficultyDetails(value).label),
              },
              {
                name: 'season',
                label: 'Season',
                anyLabel: 'Any time of year',
                value: choice.season,
                options: optionsFrom(publishedPackages, (item) => item.bestSeason),
              },
              {
                name: 'sort',
                label: 'Sort by',
                anyLabel: 'Name, A-Z',
                value: choice.sort,
                options: SORTS,
                control: 'sort',
                countsAsFilter: false,
              },
            ]}
          />

          <div className="mt-10">
            {visible.length === 0 ? (
              <EmptyState
                title="No trips match those filters"
                description="Try widening the price range or searching by a region. You can also browse every trip or outline a private trip instead."
                actions={[
                  <Button key="clear" variant="secondary" onClick={clear}>Clear filters</Button>,
                  <Button key="browse" variant="secondary" href="/packages">Browse all trips</Button>,
                  <Button key="custom" href="/custom-trip">Plan a custom trip</Button>,
                ]}
              />
            ) : (
              <StaggerGroup className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {visible.map((item) => (
                  <PackageCard key={item.id} item={item} />
                ))}
              </StaggerGroup>
            )}
          </div>
        </>
      )}
    </Section>
  )
}
