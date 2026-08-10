import AdminCrudPage from '../../components/admin/AdminCrudPage.jsx'
import StatusBadge from '../../components/admin/StatusBadge.jsx'
import { DestinationForm } from '../../components/admin/catalog/CatalogForms.jsx'
import useCollection from '../../hooks/useCollection.js'

export default function Destinations() {
  const packages = useCollection('packages', { pageSize: 0 })
  const guides = useCollection('guides', { pageSize: 0 })
  const mediaAssets = useCollection('mediaAssets', { pageSize: 0 })
  const columns = [
    { key: 'title', label: 'Destination', sortable: true, searchValue: (row) => [row.title, row.region, row.shortDescription], render: (row) => <div><p className="font-semibold text-stone-900">{row.title}</p><p className="mt-0.5 text-stone-600">{row.region}</p></div> },
    { key: 'bestSeason', label: 'Best season', render: (row) => <span className="line-clamp-2">{row.bestSeason?.join(', ') || 'Not set'}</span> },
    { key: 'status', label: 'Status', sortable: true, render: (row) => <StatusBadge status={row.status} /> },
  ]

  return <AdminCrudPage entity="destinations" title="Destinations" description="Regions and places that can appear across the public trip catalogue." columns={columns} Form={DestinationForm} formProps={{ packages: packages.items, guides: guides.items, mediaAssets: mediaAssets.items }} createLabel="Add destination" emptyState={{ title: 'No destinations yet', description: 'Create a destination to make it available to the catalogue.' }} />
}
