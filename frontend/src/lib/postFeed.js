// Presents the two editorial collections as one feed without changing their
// underlying records. The source remains available for every admin write.
const TYPE_LABELS = {
  blog: 'Blog',
  travel_update: 'Travel update',
  announcement: 'Announcement',
}

export function postType(record, collection) {
  if (record.contentType === 'announcement') return 'announcement'
  if (record.contentType === 'travel_update') return 'travel_update'
  if (record.contentType === 'blog') return 'blog'
  return collection === 'travelUpdates' ? 'travel_update' : 'blog'
}

export function postSummary(record) {
  if (record.excerpt || record.summary) return record.excerpt || record.summary
  return String(record.content || '').split('\n\n')[0].slice(0, 220)
}

export function toFeedPost(record, collection) {
  const contentType = postType(record, collection)
  return {
    ...record,
    collection,
    contentType,
    contentTypeLabel: TYPE_LABELS[contentType],
    excerpt: postSummary(record),
  }
}

export function sortFeed(items) {
  return [...items].sort((left, right) => {
    const leftDate = left.publishedAt || left.updatedAt || left.createdAt || ''
    const rightDate = right.publishedAt || right.updatedAt || right.createdAt || ''
    return new Date(rightDate).getTime() - new Date(leftDate).getTime()
  })
}

export function buildFeed(blogPosts = [], travelUpdates = []) {
  return sortFeed([
    ...blogPosts.map((record) => toFeedPost(record, 'blogPosts')),
    ...travelUpdates.map((record) => toFeedPost(record, 'travelUpdates')),
  ])
}

export function minutesToRead(content) {
  return Math.max(1, Math.ceil(String(content || '').trim().split(/\s+/).filter(Boolean).length / 220))
}
