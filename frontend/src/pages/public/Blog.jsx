// Stories and updates: a featured piece, then the grid, filtered by category.
import PostCard from '../../components/cards/PostCard.jsx'
import Button from '../../components/common/Button.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import ErrorState from '../../components/common/ErrorState.jsx'
import FilterPanel from '../../components/common/FilterPanel.jsx'
import LoadingState from '../../components/common/LoadingState.jsx'
import PageHeader from '../../components/common/PageHeader.jsx'
import Section from '../../components/common/Section.jsx'
import StaggerGroup from '../../components/motion/StaggerGroup.jsx'
import FeaturedPost from '../../components/sections/FeaturedPost.jsx'
import useCollection from '../../hooks/useCollection.js'
import usePageMeta from '../../hooks/usePageMeta.js'
import { buildFeed } from '../../lib/postFeed.js'
import { matchesText } from '../../lib/queryList.js'
import useUrlFilterState from '../../hooks/useUrlFilterState.js'

const TITLE = 'Blog and updates'
const DESCRIPTION =
  'Trail notes, preparation advice and news from the Kathmandu office — written by the guides who walk these routes.'
const NO_FILTERS = { search: '', category: '' }

export default function Blog() {
  usePageMeta(TITLE, DESCRIPTION)

  const posts = useCollection('blogPosts', {
    filters: { status: 'published' },
    sort: 'publishedAt',
    direction: 'desc',
  })
  const travelUpdates = useCollection('travelUpdates', {
    filters: { status: 'published' },
    sort: 'publishedAt',
    direction: 'desc',
  })
  const { choice, applyChoice, clear } = useUrlFilterState(NO_FILTERS)

  const status =
    posts.status === 'error' || travelUpdates.status === 'error'
      ? 'error'
      : posts.status === 'loading' || travelUpdates.status === 'loading'
        ? 'loading'
        : 'ready'
  const feed = buildFeed(posts.items, travelUpdates.items)
  const categories = [...new Set(feed.map((post) => post.contentType).filter(Boolean))]
    .map((value) => ({ value, label: value === 'travel_update' ? 'Travel updates' : value[0].toUpperCase() + value.slice(1) }))

  const visible = feed.filter((post) =>
    matchesText(choice.search, [post.title, post.excerpt, post.author, post.category, post.contentTypeLabel]) &&
    (!choice.category || post.contentType === choice.category)
  )
  // The newest post leads the page, but only when nothing is filtered.
  const [featured, ...rest] = choice.search || choice.category ? [null, ...visible] : visible

  return (
    <>
      <PageHeader title={TITLE} description={DESCRIPTION} />

      <Section>
        {status === 'loading' && <LoadingState rows={6} label="Loading articles" />}

        {status === 'error' && (
          <ErrorState
            title="We could not load the articles"
            description="Something went wrong on our side. Please try again."
            action={
              <Button variant="secondary" onClick={() => { posts.reload(); travelUpdates.reload() }}>
                Try again
              </Button>
            }
          />
        )}

        {status === 'ready' && (
          <>
            {featured && <FeaturedPost post={featured} />}

            <div className={featured ? 'mt-12' : ''}>
              <FilterPanel
                resultCount={visible.length}
                totalCount={feed.length}
                onApply={applyChoice}
                onClear={clear}
                filters={[
                  {
                    name: 'search',
                    label: 'Search stories',
                    placeholder: 'Title, topic, or author',
                    control: 'search',
                    value: choice.search,
                    options: [],
                  },
                  {
                    name: 'category',
                    label: 'Category',
                    anyLabel: 'Everything',
                    value: choice.category,
                    options: categories,
                  },
                ]}
              />
            </div>

            <div className="mt-10">
              {!featured && rest.filter(Boolean).length === 0 ? (
                <EmptyState
                  title="Nothing in that category yet"
                  description="Try another category, or clear the filter to read everything."
                  action={
                    <Button variant="secondary" onClick={clear}>
                      Clear filter
                    </Button>
                  }
                />
              ) : (
                <StaggerGroup className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {rest.filter(Boolean).map((post) => (
                    <PostCard key={`${post.collection}-${post.id}`} item={post} basePath="/blog" />
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
