import AdminCrudPage from '../../components/admin/AdminCrudPage.jsx'
import StatusBadge from '../../components/admin/StatusBadge.jsx'
import { ActivityForm } from '../../components/admin/catalog/CatalogForms.jsx'
import useCollection from '../../hooks/useCollection.js'

export default function Activities() {
  const destinations = useCollection('destinations', { pageSize: 0 })
  const packages = useCollection('packages', { pageSize: 0 })
  const mediaAssets = useCollection('mediaAssets', { pageSize: 0 })
  const columns = [
    { key: 'title', label: 'Activity', sortable: true, searchValue: (row) => [row.title, row.category, row.shortDescription], render: (row) => <div><p className="font-semibold text-stone-900">{row.title}</p><p className="mt-0.5 text-stone-600">{row.category}</p></div> },
    { key: 'difficulty', label: 'Difficulty', sortable: true },
    { key: 'status', label: 'Status', sortable: true, render: (row) => <StatusBadge status={row.status} /> },
  ]

  return <AdminCrudPage entity="activities" title="Activities" description="The travel experiences visitors can browse and connect to trips." columns={columns} Form={ActivityForm} formProps={{ destinations: destinations.items, packages: packages.items, mediaAssets: mediaAssets.items }} createLabel="Add activity" emptyState={{ title: 'No activities yet', description: 'Create an activity to make it available to the catalogue.' }} />
}
