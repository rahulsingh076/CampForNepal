// Activity list filtered by category and difficulty.
import ActivityCard from '../../components/cards/ActivityCard.jsx'
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
import { difficultyDetails } from '../../lib/displayLabels.js'
import { matchesText } from '../../lib/queryList.js'

const TITLE = 'Things To Do'
const DESCRIPTION =
  'Every way to spend your time in Nepal, from teahouse trekking and peak climbing to jungle safari, rafting and heritage walks.'
const NO_FILTERS = { search: '', category: '', difficulty: '' }

function optionsFrom(items, field, labelFor = (value) => value) {
  const values = [...new Set(items.map((item) => item[field]).filter(Boolean))]
  return values.sort().map((value) => ({ value, label: labelFor(value) }))
}

export default function ThingsToDo() {
  usePageMeta(TITLE, DESCRIPTION)

  const { status, items, reload } = useCollection('activities', {
    filters: { status: 'published' },
  })
  const { choice, applyChoice, clear } = useUrlFilterState(NO_FILTERS)

  const visible = [...items]
    .filter((item) =>
      matchesText(choice.search, [item.title, item.shortDescription, item.category]) &&
      (!choice.category || item.category === choice.category) &&
      (!choice.difficulty || item.difficulty === choice.difficulty)
    )
    .sort((left, right) => left.title.localeCompare(right.title))

  return (
    <>
      <PageHeader title={TITLE} description={DESCRIPTION} />

      <Section>
        {status === 'loading' && <LoadingState rows={6} label="Loading activities" />}

        {status === 'error' && (
          <ErrorState
            title="We could not load the activities"
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
                  label: 'Search activities',
                  placeholder: 'Activity or interest',
                  control: 'search',
                  value: choice.search,
                  options: [],
                },
                {
                  name: 'category',
                  label: 'Category',
                  anyLabel: 'Everything',
                  value: choice.category,
                  options: optionsFrom(items, 'category'),
                },
                {
                  name: 'difficulty',
                  label: 'Difficulty',
                  anyLabel: 'Any difficulty',
                  value: choice.difficulty,
                  options: optionsFrom(items, 'difficulty', (value) => difficultyDetails(value).label),
                },
              ]}
            />

            <div className="mt-10">
              {visible.length === 0 ? (
                <EmptyState
                  title="Nothing matches those filters"
                  description="Try another category, or clear the difficulty filter to see everything."
                  action={
                    <Button variant="secondary" onClick={clear}>
                      Clear all
                    </Button>
                  }
                />
              ) : (
                <StaggerGroup className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {visible.map((item) => (
                    <ActivityCard key={item.id} item={item} />
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
