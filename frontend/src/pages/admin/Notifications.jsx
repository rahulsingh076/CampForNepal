import AdminPageHeader from '../../components/admin/AdminPageHeader.jsx'
import NotificationList from '../../components/notifications/NotificationList.jsx'

export default function Notifications() {
  return <div className="space-y-6"><AdminPageHeader title="Notifications" description="Operational updates from the local demo workflow." /><NotificationList /></div>
}
