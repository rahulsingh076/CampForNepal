import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Portal from '../common/Portal.jsx'
import LoadingState from '../common/LoadingState.jsx'
import useCollection from '../../hooks/useCollection.js'
import {
  ADMIN_SEARCH_TYPES,
  PUBLIC_SEARCH_TYPES,
  allowedAdminSearchTypes,
  buildAdminSearchResults,
  buildPublicSearchResults,
} from '../../lib/globalSearch.js'

const RESULT_LIMIT = 12

function SearchIcon({ className = 'h-5 w-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M11 18a7 7 0 100-14 7 7 0 000 14zM16 16l4 4" strokeLinecap="round" />
    </svg>
  )
}

function useDialogFocus(open) {
  const inputRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    requestAnimationFrame(() => inputRef.current?.focus())

    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [open])

  return inputRef
}

function ResultLink({ item, onClose }) {
  const external = item.url.startsWith('http')
  const content = (
    <>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-caption font-semibold uppercase tracking-widest text-stone-500">{item.type}</span>
          {item.reference && <span className="text-caption font-semibold text-primary-800">{item.reference}</span>}
        </div>
        <h3 className="mt-1 truncate text-body font-semibold text-stone-900">{item.title}</h3>
        {item.description && <p className="mt-1 line-clamp-2 text-small text-stone-600">{item.description}</p>}
      </div>
      {item.url && <span className="shrink-0 text-small font-semibold text-primary-800">Open</span>}
    </>
  )

  if (!item.url) {
    return <div className="flex gap-4 px-5 py-4 sm:items-center sm:justify-between">{content}</div>
  }

  if (external) {
    return (
      <a href={item.url} target="_blank" rel="noreferrer" onClick={onClose} className="flex gap-4 px-5 py-4 hover:bg-sand-50 sm:items-center sm:justify-between">
        {content}
      </a>
    )
  }

  return (
    <Link to={item.url} onClick={onClose} className="flex gap-4 px-5 py-4 hover:bg-sand-50 sm:items-center sm:justify-between">
      {content}
    </Link>
  )
}

function SearchDialog({
  open,
  onClose,
  title,
  placeholder,
  query,
  onQueryChange,
  type,
  onTypeChange,
  typeOptions,
  loading,
  results,
  emptyTitle,
  emptyDescription,
}) {
  const inputRef = useDialogFocus(open)
  const shown = results.slice(0, RESULT_LIMIT)

  useEffect(() => {
    if (!open) return undefined

    function closeOnEscape(event) {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [onClose, open])

  if (!open) return null

  return (
    <Portal>
      <div className="fixed inset-0 z-modal">
        <button type="button" aria-label="Close search" onClick={onClose} className="fixed inset-0 bg-primary-950/45" />
        <section
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className="safe-area-panel fixed inset-x-3 top-3 z-modal mx-auto flex max-h-[calc(100vh-1.5rem)] max-w-3xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl ring-1 ring-stone-200 sm:inset-x-6 sm:top-8 sm:max-h-[calc(100vh-4rem)]"
        >
          <div className="flex min-w-0 items-center gap-3 border-b border-stone-200 px-4 py-3">
            <SearchIcon className="h-5 w-5 shrink-0 text-stone-500" />
            <label className="sr-only" htmlFor="in-page-search-input">{title}</label>
            <input
              id="in-page-search-input"
              ref={inputRef}
              type="search"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder={placeholder}
              className="min-h-11 min-w-0 flex-1 bg-transparent text-body font-medium text-stone-900 outline-none placeholder:text-stone-500"
            />
            <button type="button" onClick={onClose} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-stone-300 text-stone-800" aria-label="Close search">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div className="border-b border-stone-200 px-4 py-3">
            <div role="tablist" aria-label="Search type" className="flex gap-2 overflow-x-auto pb-1">
              {typeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="tab"
                  aria-selected={type === option.value}
                  onClick={() => onTypeChange(option.value)}
                  className={`min-h-11 shrink-0 rounded-lg px-3 py-2 text-small font-semibold ${
                    type === option.value
                      ? 'bg-primary-700 text-white'
                      : 'border border-stone-300 text-stone-700 hover:border-primary-600 hover:text-primary-800'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-5">
                <LoadingState rows={5} label="Searching" />
              </div>
            ) : shown.length ? (
              <div className="divide-y divide-stone-200">
                {shown.map((item) => <ResultLink key={item.id} item={item} onClose={onClose} />)}
                {results.length > shown.length && (
                  <p className="px-5 py-3 text-small text-stone-600">{results.length - shown.length} more results. Refine the search to narrow them down.</p>
                )}
              </div>
            ) : (
              <div className="p-8 text-center">
                <p className="font-semibold text-stone-900">{emptyTitle}</p>
                <p className="mt-2 text-small text-stone-600">{emptyDescription}</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </Portal>
  )
}

export function PublicSearchDialog({ open, onClose }) {
  const [query, setQuery] = useState('')
  const [type, setType] = useState('all')
  const collections = {
    packages: useCollection('packages', { pageSize: 0 }),
    destinations: useCollection('destinations', { pageSize: 0 }),
    activities: useCollection('activities', { pageSize: 0 }),
    guides: useCollection('guides', { pageSize: 0 }),
    blogPosts: useCollection('blogPosts', { pageSize: 0 }),
    travelUpdates: useCollection('travelUpdates', { pageSize: 0 }),
    events: useCollection('events', { pageSize: 0 }),
    mediaAssets: useCollection('mediaAssets', { pageSize: 0 }),
  }
  const loading = Object.values(collections).some((collection) => collection.status === 'loading')
  const results = useMemo(() => buildPublicSearchResults(collections, query, type), [collections, query, type])

  return (
    <SearchDialog
      open={open}
      onClose={onClose}
      title="Search Camp For Nepal"
      placeholder="Search trips, places, events, stories..."
      query={query}
      onQueryChange={setQuery}
      type={type}
      onTypeChange={setType}
      typeOptions={PUBLIC_SEARCH_TYPES}
      loading={loading}
      results={results}
      emptyTitle={query ? 'No public results found' : 'Search public content'}
      emptyDescription={query ? 'Try another term or switch the type.' : 'Enter a trip, place, event, story, video, or reel term.'}
    />
  )
}

export function AdminSearchDialog({ open, onClose, role }) {
  const [query, setQuery] = useState('')
  const [type, setType] = useState('all')
  const allowed = allowedAdminSearchTypes(role)
  const typeOptions = ADMIN_SEARCH_TYPES.filter((option) => option.value === 'all' || allowed.has(option.value))
  const collections = {
    bookings: useCollection('bookings', { pageSize: 0 }),
    inquiries: useCollection('inquiries', { pageSize: 0 }),
    messageThreads: useCollection('messageThreads', { pageSize: 0 }),
    users: useCollection('users', { pageSize: 0 }),
    packages: useCollection('packages', { pageSize: 0 }),
    destinations: useCollection('destinations', { pageSize: 0 }),
    activities: useCollection('activities', { pageSize: 0 }),
    guides: useCollection('guides', { pageSize: 0 }),
    blogPosts: useCollection('blogPosts', { pageSize: 0 }),
    travelUpdates: useCollection('travelUpdates', { pageSize: 0 }),
    events: useCollection('events', { pageSize: 0 }),
    mediaAssets: useCollection('mediaAssets', { pageSize: 0 }),
  }
  const loading = Object.values(collections).some((collection) => collection.status === 'loading')
  const results = useMemo(() => buildAdminSearchResults(collections, query, type, role), [collections, query, role, type])

  useEffect(() => {
    if (type !== 'all' && !allowed.has(type)) setType('all')
  }, [allowed, type])

  return (
    <SearchDialog
      open={open}
      onClose={onClose}
      title="Search admin records"
      placeholder="Search reference, customer, event, or media"
      query={query}
      onQueryChange={setQuery}
      type={type}
      onTypeChange={setType}
      typeOptions={typeOptions}
      loading={loading}
      results={results}
      emptyTitle={query ? 'No permitted results found' : 'Search permitted records'}
      emptyDescription={query ? 'Try another term or switch the type.' : 'Search by reference, customer, content, event, or media metadata.'}
    />
  )
}
