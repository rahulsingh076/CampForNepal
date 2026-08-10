import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import useCollection from '../../hooks/useCollection.js'
import { updateItem } from '../../lib/dataClient.js'
import { formatDate } from '../../lib/formatters.js'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { safeInternalPath } from '../../lib/urlSafety.js'

function notificationLink(link) {
  return safeInternalPath(String(link || '/').replace(/^\/dashboard(?=\/|$)/, '/customer'), '/')
}

export default function NotificationBell({ viewAllPath, className = '' }) {
  const { user } = useAuth()
  const notifications = useCollection('notifications', { filters: { userId: user?.id }, sort: 'createdAt', direction: 'desc', pageSize: 0 })
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const triggerRef = useRef(null)
  const items = notifications.items
  const unread = useMemo(() => items.filter((item) => !item.read), [items])

  useEffect(() => {
    if (!open) return undefined
    const closeOutside = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false)
    }
    const closeEscape = (event) => {
      if (event.key !== 'Escape') return
      // Escape must hand focus back, or a keyboard user is dropped at the top
      // of the page with no idea where they are.
      setOpen(false)
      triggerRef.current?.focus()
    }
    document.addEventListener('mousedown', closeOutside)
    document.addEventListener('keydown', closeEscape)
    return () => {
      document.removeEventListener('mousedown', closeOutside)
      document.removeEventListener('keydown', closeEscape)
    }
  }, [open])

  if (!user) return null

  async function markRead(item) {
    if (item.read) return
    await updateItem('notifications', item.id, { read: true }, user)
  }

  async function markAllRead() {
    await Promise.all(unread.map((item) => updateItem('notifications', item.id, { read: true }, user)))
  }

  // A disclosure panel, not an ARIA menu: it holds headings, descriptive text,
  // and a "Mark as read" button nested beside each link. role="menu" promises a
  // single-item-at-a-time keyboard model this content cannot honour.
  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={`Notifications, ${unread.length} unread`}
        className="relative flex h-11 w-11 items-center justify-center rounded-lg text-stone-700 hover:bg-sand-100"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
          <path d="M6 9a6 6 0 1112 0c0 5 2 6 2 6H4s2-1 2-6M10 20a2 2 0 004 0" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {unread.length > 0 && (
          <span aria-hidden="true" className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-600 px-1 text-[10px] font-bold text-white">
            {unread.length > 9 ? '9+' : unread.length}
          </span>
        )}
      </button>

      {open && (
        <div aria-label="Notifications" className="absolute right-0 z-dropdown mt-2 w-[min(25rem,calc(100vw-2rem))] overflow-hidden rounded-lg border border-stone-200 bg-white shadow-xl">
          <div className="flex items-center justify-between gap-3 border-b border-stone-200 px-4 py-3">
            <h2 className="text-small font-semibold text-stone-900">Notifications</h2>
            {unread.length > 0 && (
              <button type="button" onClick={markAllRead} className="min-h-11 text-small font-semibold text-primary-700 hover:text-primary-900">Mark all read</button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {items.length ? (
              items.slice(0, 5).map((item) => (
                <div key={item.id} className={`border-b border-stone-100 px-4 py-3 ${item.read ? 'bg-white' : 'bg-primary-50/50'}`}>
                  <Link to={notificationLink(item.link)} onClick={() => { markRead(item); setOpen(false) }} className="block rounded text-left hover:text-primary-800">
                    <p className="text-small font-semibold text-stone-900">{item.title}</p>
                    <p className="mt-1 line-clamp-2 text-small text-stone-600">{item.message}</p>
                    <p className="mt-1.5 text-small text-stone-500">{formatDate(item.createdAt, { short: true })}</p>
                  </Link>
                  {!item.read && (
                    <button type="button" onClick={() => markRead(item)} className="mt-1 min-h-11 text-small font-semibold text-primary-700 hover:text-primary-900">Mark as read</button>
                  )}
                </div>
              ))
            ) : (
              <p className="px-4 py-8 text-center text-small text-stone-600">You are all caught up.</p>
            )}
          </div>

          <Link to={viewAllPath} onClick={() => setOpen(false)} className="flex min-h-11 items-center justify-center border-t border-stone-200 px-4 py-3 text-center text-small font-semibold text-primary-700 hover:bg-primary-50">
            View all notifications
          </Link>
        </div>
      )}
    </div>
  )
}
