import AdminCrudPage from '../../components/admin/AdminCrudPage.jsx'
import StatusBadge from '../../components/admin/StatusBadge.jsx'
import WebsiteNav from '../../components/admin/WebsiteNav.jsx'
import { TravelInfoForm } from '../../components/admin/website/WebsiteCollectionForms.jsx'
import useCollection from '../../hooks/useCollection.js'

const columns = [
  { key: 'title', label: 'Page', sortable: true, searchValue: (row) => [row.title, row.category, row.summary], render: (row) => <div><p className="font-semibold text-stone-900">{row.title}</p><p className="mt-0.5 text-stone-600">{row.category}</p></div> },
  { key: 'status', label: 'Status', sortable: true, render: (row) => <StatusBadge status={row.status} /> },
  { key: 'updatedAt', label: 'Updated', sortable: true },
]

export default function WebsiteTravelInfo() {
  const packages = useCollection('packages', { pageSize: 0 })
  return <AdminCrudPage entity="travelInfoPages" title="Travel information" description="Write, publish, and maintain practical guides for visitors." columns={columns} Form={TravelInfoForm} formProps={{ packages: packages.items }} createLabel="Add travel page" headerChildren={<WebsiteNav />} emptyState={{ title: 'No travel information yet', description: 'Add the first practical guide for the public site.' }} />
}
