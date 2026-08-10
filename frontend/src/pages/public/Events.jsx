import { Link } from 'react-router-dom'
import EmptyState from '../../components/common/EmptyState.jsx'
import FilterPanel from '../../components/common/FilterPanel.jsx'
import ImageFrame from '../../components/common/ImageFrame.jsx'
import LoadingState from '../../components/common/LoadingState.jsx'
import PageHeader from '../../components/common/PageHeader.jsx'
import Section from '../../components/common/Section.jsx'
import StaggerGroup from '../../components/motion/StaggerGroup.jsx'
import useCollection from '../../hooks/useCollection.js'
import usePageMeta from '../../hooks/usePageMeta.js'
import useUrlFilterState from '../../hooks/useUrlFilterState.js'
import { formatDate } from '../../lib/formatters.js'
import { primaryImageMedia } from '../../lib/media.js'
import { matchesText } from '../../lib/queryList.js'

const TITLE = 'Events'
const DESCRIPTION = 'Public briefings, cultural dates, campaigns, and travel events that are safe to share.'
const NO_FILTERS = { search: '', eventType: '' }

function EventCard({ item }) {
  const image = primaryImageMedia(item)
  return (
    <article className="overflow-hidden border border-stone-200 bg-white shadow-sm">
      <ImageFrame src={image.imageSrc} alt={image.alt || item.title} focalPosition={image.focalPosition} ratio="wide" radius="none" />
      <div className="p-5">
        <div className="flex flex-wrap items-center gap-2 text-caption font-semibold uppercase tracking-widest text-stone-500">
          <span>{item.eventType?.replace(/_/g, ' ') || 'Event'}</span>
          <span>{formatDate(item.startDateTime, { short: true })}</span>
        </div>
        <h2 className="mt-3 text-h4 font-sans text-stone-900">
          <Link to={`/events/${item.slug}`} className="hover:text-primary-800">{item.title}</Link>
        </h2>
        <p className="mt-2 line-clamp-3 text-small text-stone-600">{item.shortDescription}</p>
        <div className="mt-5">
          <Link to={`/events/${item.slug}`} className="text-small font-semibold text-primary-800 underline underline-offset-4">View event</Link>
        </div>
      </div>
    </article>
  )
}

export default function Events() {
  usePageMeta(TITLE, DESCRIPTION)
  const events = useCollection('events', { pageSize: 0, sort: 'startDateTime' })
  const { choice, applyChoice, clear } = useUrlFilterState(NO_FILTERS)

  const published = events.items.filter((item) => ['published', 'cancelled', 'completed'].includes(item.status))
  const eventTypes = [...new Set(published.map((item) => item.eventType).filter(Boolean))]
    .map((value) => ({ value, label: value.replace(/_/g, ' ') }))
  const visible = published.filter((item) =>
    matchesText(choice.search, [item.title, item.shortDescription, item.fullDescription, item.eventType, item.venueName]) &&
    (!choice.eventType || item.eventType === choice.eventType)
  )

  return (
    <>
      <PageHeader title={TITLE} description={DESCRIPTION} />
      <Section>
        {events.status === 'loading' && <LoadingState rows={6} label="Loading events" />}
        {events.status === 'ready' && (
          <>
            <FilterPanel
              resultCount={visible.length}
              totalCount={published.length}
              onApply={applyChoice}
              onClear={clear}
              filters={[
                { name: 'search', label: 'Search events', placeholder: 'Title, place, or type', control: 'search', value: choice.search, options: [] },
                { name: 'eventType', label: 'Type', anyLabel: 'Every type', value: choice.eventType, options: eventTypes },
              ]}
            />
            <div className="mt-10">
              {visible.length ? (
                <StaggerGroup className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {visible.map((item) => <EventCard key={item.id} item={item} />)}
                </StaggerGroup>
              ) : (
                <EmptyState title="No public events match that search" description="Clear the filters to see every currently published event." />
              )}
            </div>
          </>
        )}
      </Section>
    </>
  )
}

