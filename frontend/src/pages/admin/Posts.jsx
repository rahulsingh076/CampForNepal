import { useCallback, useEffect, useMemo, useState } from 'react'
import AdminPageHeader from '../../components/admin/AdminPageHeader.jsx'
import ConfirmDialog from '../../components/admin/ConfirmDialog.jsx'
import PostEditorFields from '../../components/admin/PostEditorFields.jsx'
import PostOverflowMenu from '../../components/admin/PostOverflowMenu.jsx'
import StatusBadge from '../../components/admin/StatusBadge.jsx'
import { useToast } from '../../components/admin/Toast.jsx'
import Badge from '../../components/common/Badge.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import FormField from '../../components/common/FormField.jsx'
import LoadingState from '../../components/common/LoadingState.jsx'
import { applyImageFallback, resolveImageSrc } from '../../components/common/ImageFrame.jsx'
import useCollection from '../../hooks/useCollection.js'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { createItem, deleteItem, listItems, updateItem } from '../../lib/dataClient.js'
import { formatDate } from '../../lib/formatters.js'
import { buildFeed, minutesToRead, sortFeed, toFeedPost } from '../../lib/postFeed.js'
import { notifyUsers, staffUserIds } from '../../lib/notifications.js'

const STATUS_TABS = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Drafts' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' },
]

const TYPE_OPTIONS = [
  { value: 'all', label: 'Every category' },
  { value: 'blog', label: 'Blog' },
  { value: 'travel_update', label: 'Travel update' },
  { value: 'announcement', label: 'Announcement' },
]

function slugify(value) {
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function emptyValues() {
  return {
    title: '',
    contentType: 'blog',
    content: '',
    featuredImage: '',
    featuredImageAlt: '',
    featuredImageFocalPosition: '50% 50%',
    relatedPackageIds: [],
    seo: { metaTitle: '', metaDescription: '', keywords: [] },
  }
}

function valuesFromPost(post) {
  return {
    title: post.title || '',
    contentType: post.contentType || 'blog',
    content: post.content || '',
    featuredImage: post.featuredImage || '',
    featuredImageAlt: post.featuredImageAlt || '',
    featuredImageFocalPosition: post.featuredImageFocalPosition || '50% 50%',
    relatedPackageIds: post.relatedPackageIds || [],
    seo: post.seo || { metaTitle: '', metaDescription: '', keywords: [] },
  }
}

function excerptFrom(content) {
  return String(content || '').trim().split('\n\n')[0].slice(0, 220)
}

function sourceFor(values) {
  return values.contentType === 'blog' ? 'blogPosts' : 'travelUpdates'
}

function recordFromValues(values, collection, user, status, existing) {
  const excerpt = excerptFrom(values.content)
  const publishedAt = status === 'published'
    ? existing?.publishedAt || new Date().toISOString()
    : existing?.publishedAt || null
  const common = {
    title: values.title.trim(),
    slug: slugify(values.title),
    contentType: values.contentType,
    category: values.contentType,
    author: existing?.author || user.fullName,
    content: values.content.trim(),
    featuredImage: values.featuredImage.trim(),
    featuredImageAlt: values.featuredImageAlt.trim(),
    featuredImageFocalPosition: values.featuredImageFocalPosition || '50% 50%',
    relatedPackageIds: values.relatedPackageIds || [],
    seo: values.seo,
    status,
    publishedAt,
  }

  if (collection === 'blogPosts') {
    return {
      ...common,
      excerpt,
      gallery: existing?.gallery || [],
      readingMinutes: minutesToRead(values.content),
    }
  }

  return {
    ...common,
    summary: excerpt,
    severity: existing?.severity || (values.contentType === 'announcement' ? 'info' : 'advisory'),
    relatedDestinationIds: existing?.relatedDestinationIds || [],
    expiresAt: existing?.expiresAt || null,
  }
}

function validate(values, feed, currentId) {
  const errors = {}
  const slug = slugify(values.title)
  if (!values.title.trim()) errors.title = 'Title is needed.'
  if (!values.content.trim()) errors.content = 'Write an update before saving.'
  if (slug && feed.some((post) => post.slug === slug && post.id !== currentId)) {
    errors.title = 'That title would reuse an existing public URL.'
  }
  return errors
}

function Composer({ open, values, onField, onExpand, onSave, packages, busy, errors, seoOpen, setSeoOpen }) {
  if (!open) {
    return (
      <button type="button" onClick={onExpand} className="flex w-full items-center gap-3 border border-stone-200 bg-white px-5 py-4 text-left text-body text-stone-500 shadow-sm hover:border-primary-500 hover:text-stone-700">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-primary-800">+</span>
        Share an update...
      </button>
    )
  }

  return (
    <section className="border border-stone-200 bg-white p-5 shadow-sm" aria-label="Post composer">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 className="text-h4 font-sans text-stone-900">Share an update</h2>
        <span className="text-small text-stone-500">{values.contentType === 'travel_update' ? 'Travel update' : values.contentType}</span>
      </div>
      <PostEditorFields values={values} onField={onField} packages={packages} errors={errors} seoOpen={seoOpen} setSeoOpen={setSeoOpen} />
      <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-stone-200 pt-5">
        <button type="button" onClick={() => onSave('draft')} disabled={busy} className="rounded-lg border border-stone-300 px-4 py-2 text-small font-semibold text-stone-800 hover:border-stone-400 disabled:cursor-not-allowed disabled:opacity-60">Save draft</button>
        <button type="button" onClick={() => onSave('published')} disabled={busy} className="rounded-lg bg-primary-700 px-4 py-2 text-small font-semibold text-white hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-60">Publish</button>
      </div>
    </section>
  )
}

function FeedCard({ post, packages, editing, onEdit, onSaveEdit, onCancelEdit, onPublish, onUnpublish, onArchive, onDelete, busy }) {
  const [values, setValues] = useState(() => valuesFromPost(post))
  const [errors, setErrors] = useState({})
  const [seoOpen, setSeoOpen] = useState(false)

  function field(name, value) {
    setValues((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: null }))
  }

  function submit(event) {
    event.preventDefault()
    onSaveEdit(post, values, setErrors)
  }

  if (editing) {
    return (
      <article className="border border-primary-300 bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center justify-between gap-4"><h2 className="text-h4 font-sans text-stone-900">Editing update</h2><StatusBadge status={post.status} /></div>
        <form onSubmit={submit}>
          <PostEditorFields values={values} onField={field} packages={packages} errors={errors} seoOpen={seoOpen} setSeoOpen={setSeoOpen} compact />
          <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-stone-200 pt-5">
            <button type="button" onClick={onCancelEdit} disabled={busy} className="rounded-lg border border-stone-300 px-4 py-2 text-small font-semibold text-stone-800 hover:border-stone-400 disabled:cursor-not-allowed disabled:opacity-60">Cancel</button>
            <button type="submit" disabled={busy} className="rounded-lg bg-primary-700 px-4 py-2 text-small font-semibold text-white hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-60">Save changes</button>
          </div>
        </form>
      </article>
    )
  }

  return (
    <article className="overflow-hidden border border-stone-200 bg-white shadow-sm">
      <div className="grid lg:grid-cols-[14rem,minmax(0,1fr)]">
        {post.featuredImage ? <img src={resolveImageSrc(post.featuredImage)} alt={post.featuredImageAlt || post.title} onError={applyImageFallback} loading="lazy" decoding="async" className="aspect-[16/8] h-full w-full object-cover lg:aspect-auto" style={{ objectPosition: post.featuredImageFocalPosition || '50% 50%' }} /> : <div className="aspect-[16/8] bg-sand-100 lg:aspect-auto" />}
        <div className="min-w-0 p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={post.contentType === 'announcement' ? 'cta' : 'neutral'}>{post.contentTypeLabel}</Badge>
              <StatusBadge status={post.status} />
            </div>
            <PostOverflowMenu post={post} onEdit={onEdit} onPublish={onPublish} onUnpublish={onUnpublish} onArchive={onArchive} onDelete={onDelete} />
          </div>
          <h2 className="mt-4 text-h4 font-sans text-stone-900">{post.title}</h2>
          <p className="mt-2 line-clamp-3 text-small text-stone-600">{post.excerpt}</p>
          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 text-small text-stone-500">
            <span>{post.author}</span>
            <span>{formatDate(post.publishedAt || post.updatedAt || post.createdAt, { short: true }) || 'Not published'}</span>
            <span>Views: --</span>
          </div>
        </div>
      </div>
    </article>
  )
}

export default function Posts() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const packages = useCollection('packages', { pageSize: 0 })
  const [state, setState] = useState({ status: 'loading', feed: [], error: '' })
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [composerOpen, setComposerOpen] = useState(false)
  const [composerValues, setComposerValues] = useState(emptyValues)
  const [composerErrors, setComposerErrors] = useState({})
  const [composerSeoOpen, setComposerSeoOpen] = useState(false)
  const [editingKey, setEditingKey] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [busyKey, setBusyKey] = useState('')

  const load = useCallback(async () => {
    setState((current) => ({ ...current, status: 'loading', error: '' }))
    const [posts, updates] = await Promise.all([
      listItems('blogPosts', { pageSize: 0 }),
      listItems('travelUpdates', { pageSize: 0 }),
    ])
    if (!posts.success || !updates.success) {
      setState({ status: 'error', feed: [], error: posts.message || updates.message || 'The editorial feed could not be loaded.' })
      return
    }
    setState({ status: 'ready', feed: buildFeed(posts.data, updates.data), error: '' })
  }, [])

  useEffect(() => { load() }, [load])

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return state.feed.filter((post) => {
      const matchesStatus = statusFilter === 'all' || post.status === statusFilter
      const matchesType = typeFilter === 'all' || post.contentType === typeFilter
      const matchesSearch = !needle || [post.title, post.excerpt, post.author, post.contentTypeLabel].join(' ').toLowerCase().includes(needle)
      return matchesStatus && matchesType && matchesSearch
    })
  }, [search, state.feed, statusFilter, typeFilter])

  function composerField(name, value) {
    setComposerValues((current) => ({ ...current, [name]: value }))
    setComposerErrors((current) => ({ ...current, [name]: null }))
  }

  async function notifyPublished(post) {
    const recipients = await staffUserIds(['admin', 'super_admin'])
    await notifyUsers(recipients.filter((id) => id !== user.id), 'post_published', {
      title: post.title,
      author: post.author || user.fullName,
      contentTypeLabel: post.contentTypeLabel || post.contentType?.replace(/_/g, ' ') || 'post',
      link: `/blog/${post.slug}`,
    }, user)
  }

  async function createPost(status) {
    const errors = validate(composerValues, state.feed)
    if (Object.keys(errors).length) return setComposerErrors(errors)

    const collection = sourceFor(composerValues)
    const record = recordFromValues(composerValues, collection, user, status)
    const temporaryId = `pending-${Date.now()}`
    const optimistic = toFeedPost({ ...record, id: temporaryId, createdAt: new Date().toISOString() }, collection)
    const previous = state.feed
    setBusyKey('composer')
    setState({ status: 'ready', feed: sortFeed([optimistic, ...previous]), error: '' })
    setComposerOpen(false)
    setComposerValues(emptyValues())
    setComposerErrors({})
    setComposerSeoOpen(false)

    const result = await createItem(collection, record, user)
    setBusyKey('')
    if (!result.success) {
      setState({ status: 'ready', feed: previous, error: '' })
      showToast(result.message || 'Could not save this update.', 'error')
      return
    }
    const saved = toFeedPost(result.data, collection)
    setState((current) => ({ ...current, feed: sortFeed(current.feed.map((post) => post.id === temporaryId ? saved : post)) }))
    if (status === 'published') await notifyPublished(saved)
    showToast(status === 'published' ? 'Update published.' : 'Draft saved.')
  }

  async function patchPost(post, changes, message) {
    const previous = state.feed
    const optimistic = toFeedPost({ ...post, ...changes }, post.collection)
    setBusyKey(`${post.collection}-${post.id}`)
    setState({ status: 'ready', feed: sortFeed(previous.map((item) => item.id === post.id && item.collection === post.collection ? optimistic : item)), error: '' })
    const result = await updateItem(post.collection, post.id, changes, user)
    setBusyKey('')
    if (!result.success) {
      setState({ status: 'ready', feed: previous, error: '' })
      showToast(result.message || 'Could not update this post.', 'error')
      return false
    }
    const saved = toFeedPost(result.data, post.collection)
    setState((current) => ({ ...current, feed: sortFeed(current.feed.map((item) => item.id === post.id && item.collection === post.collection ? saved : item)) }))
    if (post.status !== 'published' && saved.status === 'published') await notifyPublished(saved)
    showToast(message)
    return true
  }

  async function saveInline(post, values, setErrors) {
    const errors = validate(values, state.feed, post.id)
    if (Object.keys(errors).length) return setErrors(errors)
    const record = recordFromValues(values, post.collection, user, post.status, post)
    const saved = await patchPost(post, record, 'Update saved.')
    if (saved) setEditingKey(null)
  }

  async function deletePost() {
    if (!pendingDelete) return
    const post = pendingDelete
    const previous = state.feed
    setBusyKey(`${post.collection}-${post.id}`)
    setPendingDelete(null)
    setState({ status: 'ready', feed: previous.filter((item) => !(item.id === post.id && item.collection === post.collection)), error: '' })
    const result = await deleteItem(post.collection, post.id, user)
    setBusyKey('')
    if (!result.success) {
      setState({ status: 'ready', feed: previous, error: '' })
      showToast(result.message || 'Could not delete this post.', 'error')
      return
    }
    showToast('Post deleted.')
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Posts and updates" description="Write the public journal, operational travel updates, and announcements from one feed." />

      <Composer open={composerOpen} values={composerValues} onField={composerField} onExpand={() => setComposerOpen(true)} onSave={createPost} packages={packages.items} busy={busyKey === 'composer'} errors={composerErrors} seoOpen={composerSeoOpen} setSeoOpen={setComposerSeoOpen} />

      <section className="border-y border-stone-200 py-4" aria-label="Post filters">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Post status">
            {STATUS_TABS.map((tab) => <button key={tab.value} type="button" role="tab" aria-selected={statusFilter === tab.value} onClick={() => setStatusFilter(tab.value)} className={`rounded-md px-3 py-1.5 text-small font-semibold ${statusFilter === tab.value ? 'bg-primary-700 text-white' : 'border border-stone-300 text-stone-700 hover:border-primary-600 hover:text-primary-800'}`}>{tab.label}</button>)}
          </div>
          <div className="grid gap-3 sm:grid-cols-[12rem,minmax(16rem,22rem)]">
            <FormField label="Category" as="select" options={TYPE_OPTIONS} value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} />
            <FormField label="Search posts" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Title or author" />
          </div>
        </div>
      </section>

      {state.status === 'loading' && <LoadingState rows={5} label="Loading editorial feed" />}
      {state.status === 'error' && <div className="border border-danger-200 bg-danger-50 p-5 text-danger-900"><p className="font-semibold">{state.error}</p><button type="button" onClick={load} className="mt-3 text-small font-semibold underline">Try again</button></div>}
      {state.status === 'ready' && visible.length === 0 && <EmptyState title="Nothing in this feed yet" description="Try another filter, or share the first update." action={<button type="button" onClick={() => { setStatusFilter('all'); setTypeFilter('all'); setSearch('') }} className="rounded-lg border border-stone-300 px-4 py-2 text-small font-semibold text-primary-800 hover:border-primary-600">Clear filters</button>} />}
      {state.status === 'ready' && visible.length > 0 && <div className="space-y-4">{visible.map((post) => <FeedCard key={`${post.collection}-${post.id}`} post={post} packages={packages.items} editing={editingKey === `${post.collection}-${post.id}`} onEdit={() => setEditingKey(`${post.collection}-${post.id}`)} onSaveEdit={saveInline} onCancelEdit={() => setEditingKey(null)} onPublish={() => patchPost(post, { status: 'published', publishedAt: post.publishedAt || new Date().toISOString() }, 'Post published.')} onUnpublish={() => patchPost(post, { status: 'draft' }, 'Post moved to drafts.')} onArchive={() => patchPost(post, { status: 'archived' }, 'Post archived.')} onDelete={() => setPendingDelete(post)} busy={busyKey === `${post.collection}-${post.id}`} />)}</div>}

      <ConfirmDialog open={Boolean(pendingDelete)} onClose={() => !busyKey && setPendingDelete(null)} onConfirm={deletePost} busy={Boolean(busyKey)} title={`Delete ${pendingDelete?.title || 'this post'}?`} description="This removes the post from the local demo feed and public site immediately." confirmLabel="Delete post" />
    </div>
  )
}
