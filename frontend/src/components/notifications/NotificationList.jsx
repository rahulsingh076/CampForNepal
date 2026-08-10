import { Link } from 'react-router-dom'
import useCollection from '../../hooks/useCollection.js'
import { updateItem } from '../../lib/dataClient.js'
import { formatDate } from '../../lib/formatters.js'
import { useAuth } from '../../contexts/AuthContext.jsx'
import ErrorState from '../common/ErrorState.jsx'
import LoadingState from '../common/LoadingState.jsx'
import { safeInternalPath } from '../../lib/urlSafety.js'

function notificationLink(link) {
  return safeInternalPath(String(link || '/').replace(/^\/dashboard(?=\/|$)/, '/customer'), '/')
}

export default function NotificationList() {
  const { user } = useAuth()
  const notifications = useCollection('notifications', { filters: { userId: user?.id }, sort: 'createdAt', direction: 'desc', pageSize: 0 })
  const unread = notifications.items.filter((item) => !item.read)

  async function markRead(item) {
    if (!item.read) await updateItem('notifications', item.id, { read: true }, user)
  }

  async function markAllRead() {
    await Promise.all(unread.map((item) => updateItem('notifications', item.id, { read: true }, user)))
  }

  if (notifications.status === 'loading') return <LoadingState label="Loading notifications" rows={4} />
  if (notifications.status === 'error') return <ErrorState title="We could not load notifications" description="Try again to refresh your updates." action={<button type="button" onClick={notifications.reload} className="rounded-lg border border-stone-300 px-3 py-2 text-small font-semibold text-primary-800 hover:border-primary-600">Try again</button>} />
  return <section className="border border-stone-200 bg-white"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 p-5"><p className="text-small text-stone-600">{unread.length} unread</p>{unread.length > 0 && <button type="button" onClick={markAllRead} className="rounded-lg border border-stone-300 px-3 py-2 text-small font-semibold text-primary-800 hover:border-primary-600">Mark all as read</button>}</div>{notifications.items.length ? <ul className="divide-y divide-stone-200">{notifications.items.map((item) => <li key={item.id} className={item.read ? 'bg-white' : 'bg-primary-50/50'}><div className="flex items-start gap-4 p-5"><span aria-hidden="true" className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${item.read ? 'bg-stone-300' : 'bg-primary-600'}`} /><div className="min-w-0 flex-1"><Link to={notificationLink(item.link)} onClick={() => markRead(item)} className="text-body font-semibold text-stone-900 hover:text-primary-800">{item.title}</Link><p className="mt-1 text-small leading-6 text-stone-600">{item.message}</p><p className="mt-2 text-small text-stone-500">{formatDate(item.createdAt, { short: true })}</p></div>{!item.read && <button type="button" onClick={() => markRead(item)} className="shrink-0 text-small font-semibold text-primary-700 hover:text-primary-900">Mark read</button>}</div></li>)}</ul> : <p className="p-8 text-center text-small text-stone-600">No notifications yet.</p>}</section>
}
