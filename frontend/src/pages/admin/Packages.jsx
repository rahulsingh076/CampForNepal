import { useState } from 'react'
import AdminCrudPage from '../../components/admin/AdminCrudPage.jsx'
import StatusBadge from '../../components/admin/StatusBadge.jsx'
import { PackageForm } from '../../components/admin/catalog/CatalogForms.jsx'
import useCollection from '../../hooks/useCollection.js'
import { formatPrice } from '../../lib/formatters.js'

const TABS = [
  { value: 'all', label: 'All packages' },
  { value: 'tour', label: 'Tours' },
  { value: 'trekking', label: 'Trekking' },
  { value: 'expedition', label: 'Expeditions' },
]

export default function Packages() {
  const [type, setType] = useState('all')
  const destinations = useCollection('destinations', { pageSize: 0 })
  const activities = useCollection('activities', { pageSize: 0 })
  const packages = useCollection('packages', { pageSize: 0 })
  const mediaAssets = useCollection('mediaAssets', { pageSize: 0 })
  const rows = type === 'all' ? packages.items : packages.items.filter((item) => item.type === type)
  const columns = [
    { key: 'title', label: 'Package', sortable: true, searchValue: (row) => [row.title, row.region, row.shortDescription], render: (row) => <div><p className="font-semibold text-stone-900">{row.title}</p><p className="mt-0.5 text-stone-600">{row.region}</p></div> },
    { key: 'type', label: 'Type', sortable: true },
    { key: 'price', label: 'Price', sortable: true, render: (row) => <div><p className="font-semibold text-stone-900">{formatPrice(row.price)}</p>{typeof row.discountPrice === 'number' && <p className="mt-0.5 text-stone-600">Sale {formatPrice(row.discountPrice)}</p>}</div> },
    { key: 'status', label: 'Status', sortable: true, render: (row) => <div className="flex flex-wrap gap-2"><StatusBadge status={row.status} />{row.featured && <StatusBadge label="featured" variant="info" />}</div> },
  ]

  return (
    <AdminCrudPage
      entity="packages"
      title="Packages"
      description="Trip catalogue, pricing, itinerary, and publication controls. Draft packages never render to visitors."
      columns={columns}
      rows={rows}
      Form={PackageForm}
      formProps={{ destinations: destinations.items, activities: activities.items, mediaAssets: mediaAssets.items }}
      createLabel="Add package"
      emptyState={{ title: 'No packages in this view', description: 'Try another category or create the first package.' }}
      onChanged={packages.reload}
      headerChildren={<div className="mt-5 flex flex-wrap gap-2" role="tablist" aria-label="Package type"><span className="mr-1 self-center text-small font-semibold text-stone-600">Show</span>{TABS.map((tab) => <button key={tab.value} type="button" role="tab" aria-selected={type === tab.value} onClick={() => setType(tab.value)} className={`rounded-md px-3 py-1.5 text-small font-semibold ${type === tab.value ? 'bg-primary-700 text-white' : 'border border-stone-300 text-stone-700 hover:border-primary-600 hover:text-primary-800'}`}>{tab.label}</button>)}</div>}
    />
  )
}
