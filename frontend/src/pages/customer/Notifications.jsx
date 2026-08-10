import NotificationList from '../../components/notifications/NotificationList.jsx'
import usePageMeta from '../../hooks/usePageMeta.js'

export default function Notifications() {
  usePageMeta('Notifications', 'Updates about your bookings, reviews, and messages.')
  return <div className="mx-auto max-w-3xl"><h1 className="font-display text-h2 text-stone-900">Notifications</h1><p className="mt-1 text-body text-stone-600">Updates about your trip and messages from the team.</p><div className="mt-8"><NotificationList /></div></div>
}
