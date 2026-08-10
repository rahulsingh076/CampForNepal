import PostCard from '../cards/PostCard.jsx'
import useCollection from '../../hooks/useCollection.js'
import { buildFeed } from '../../lib/postFeed.js'
import { orderByIds } from '../../hooks/useCollection.js'
import StaggerGroup from '../motion/StaggerGroup.jsx'
import SectionShell from './SectionShell.jsx'

// The homepage preview deliberately takes the newest published item from either source.
export default function PostFeedHighlightsSection({ section }) {
  const blogPosts = useCollection('blogPosts', { filters: { status: 'published' }, pageSize: 0 })
  const travelUpdates = useCollection('travelUpdates', { filters: { status: 'published' }, pageSize: 0 })
  const status =
    blogPosts.status === 'error' || travelUpdates.status === 'error'
      ? 'error'
      : blogPosts.status === 'loading' || travelUpdates.status === 'loading'
        ? 'loading'
        : 'ready'
  const feed = buildFeed(blogPosts.items, travelUpdates.items)
  const posts = (section.itemIds?.length ? orderByIds(feed, section.itemIds) : feed).slice(0, 3)

  function reload() {
    blogPosts.reload()
    travelUpdates.reload()
  }

  return (
    <SectionShell section={section} status={status} isEmpty={posts.length === 0} onRetry={reload}>
      <StaggerGroup className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => <PostCard key={`${post.collection}-${post.id}`} item={post} basePath="/blog" />)}
      </StaggerGroup>
    </SectionShell>
  )
}
