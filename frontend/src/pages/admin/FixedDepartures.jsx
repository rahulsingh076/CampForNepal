import AdminCrudPage from '../../components/admin/AdminCrudPage.jsx'
import StatusBadge from '../../components/admin/StatusBadge.jsx'
import { DepartureForm } from '../../components/admin/catalog/CatalogForms.jsx'
import useCollection from '../../hooks/useCollection.js'
import { formatDateRange, formatPrice } from '../../lib/formatters.js'

function cloneDeparture(item) {
  const { id, createdAt, updatedAt, ...values } = item
  return { ...values, title: `${item.title} copy`, startDate: '', endDate: '', bookedSeats: 0, status: 'draft', guaranteed: false }
}

export default function FixedDepartures() {
  const packages = useCollection('packages', { pageSize: 0 })
  const guides = useCollection('guides', { pageSize: 0 })
  const names = Object.fromEntries(packages.items.map((item) => [item.id, item.title]))
  const columns = [
    { key: 'title', label: 'Departure', sortable: true, searchValue: (row) => [row.title, names[row.packageId]], render: (row) => <div><p className="font-semibold text-stone-900">{row.title}</p><p className="mt-0.5 text-stone-600">{names[row.packageId] || 'Package unavailable'}</p></div> },
    { key: 'startDate', label: 'Dates', sortable: true, render: (row) => formatDateRange(row.startDate, row.endDate) },
    { key: 'bookedSeats', label: 'Seats', sortable: true, render: (row) => `${row.bookedSeats} / ${row.totalSeats}` },
    { key: 'price', label: 'Price', sortable: true, render: (row) => formatPrice(row.price) },
    { key: 'status', label: 'Status', sortable: true, render: (row) => <StatusBadge status={row.status} /> },
  ]

  return <AdminCrudPage entity="fixedDepartures" title="Fixed departures" description="Scheduled group dates, seat inventory, guide assignments, and internal operational notes." columns={columns} Form={DepartureForm} formProps={{ packages: packages.items, guides: guides.items }} createLabel="Add departure" rowActions={(row, actions) => [{ label: 'Clone', onClick: () => actions.create(cloneDeparture(row)) }]} emptyState={{ title: 'No fixed departures yet', description: 'Create the first scheduled group departure.' }} />
}
