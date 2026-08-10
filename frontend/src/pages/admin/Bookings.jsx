import { useMemo } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import AdminDataTable from '../../components/admin/AdminDataTable.jsx'
import AdminPageHeader from '../../components/admin/AdminPageHeader.jsx'
import StatusBadge from '../../components/admin/StatusBadge.jsx'
import { BOOKING_STATUS_OPTIONS, bookingStatusLabel, normalizeBookingStatus } from '../../config/bookingStatuses.js'
import useCollection from '../../hooks/useCollection.js'
import { formatDate, formatDateRange } from '../../lib/formatters.js'
import ErrorState from '../../components/common/ErrorState.jsx'
import LoadingState from '../../components/common/LoadingState.jsx'

export default function Bookings() {
  const bookings = useCollection('bookings', { pageSize: 0 })
  const packages = useCollection('packages', { pageSize: 0 })
  const departures = useCollection('fixedDepartures', { pageSize: 0 })
  const [searchParams, setSearchParams] = useSearchParams()
  const status = searchParams.get('status') || 'all'
  const navigate = useNavigate()
  const location = useLocation()
  const statuses = BOOKING_STATUS_OPTIONS
  const collectionStatus = [bookings, packages, departures].some((collection) => collection.status === 'error') ? 'error' : [bookings, packages, departures].some((collection) => collection.status === 'loading') ? 'loading' : 'ready'
  const rows = useMemo(() => status === 'all' ? bookings.items : bookings.items.filter((item) => normalizeBookingStatus(item.status) === status), [bookings.items, status])
  const columns = [
    { key: 'reference', label: 'Booking', sortable: true, searchValue: (row) => [row.reference, row.leadTraveller?.fullName], render: (row) => <div><p className="font-semibold text-stone-900">{row.reference}</p><p className="text-stone-600">{row.leadTraveller?.fullName}</p></div> },
    { key: 'packageId', label: 'Trip', searchValue: (row) => packages.items.find((item) => item.id === row.packageId)?.title || '', render: (row) => packages.items.find((item) => item.id === row.packageId)?.title || 'Trip being planned' },
    { key: 'departureId', label: 'Dates', render: (row) => { const departure = departures.items.find((item) => item.id === row.departureId); return departure ? formatDateRange(departure.startDate, departure.endDate) : 'Dates being planned' } },
    { key: 'status', label: 'Status', sortable: true, render: (row) => <StatusBadge status={normalizeBookingStatus(row.status)} label={bookingStatusLabel(row.status)} /> },
    { key: 'updatedAt', label: 'Updated', sortable: true, render: (row) => formatDate(row.updatedAt || row.createdAt, { short: true }) },
  ]

  function chooseStatus(nextStatus) {
    if (nextStatus === 'all') setSearchParams({})
    else setSearchParams({ status: nextStatus })
  }

  const activeFilters = status === 'all' ? [] : [`Status: ${bookingStatusLabel(status)}`]

  function retry() { bookings.reload(); packages.reload(); departures.reload() }
  return <div className="space-y-6"><AdminPageHeader title="Bookings" description="Bookings only use two states: booked or cancelled. Further details stay in private chat and internal notes." />{collectionStatus === 'loading' ? <LoadingState label="Loading bookings" rows={8} /> : collectionStatus === 'error' ? <ErrorState title="We could not load bookings" description="Try again to reload the booking queue and its trip details." action={<button type="button" onClick={retry} className="rounded-lg border border-stone-300 px-3 py-2 text-small font-semibold text-primary-800 hover:border-primary-600">Try again</button>} /> : <><div className="flex flex-wrap gap-2 border-b border-stone-200 pb-4" role="tablist" aria-label="Booking statuses"><button type="button" role="tab" aria-selected={status === 'all'} onClick={() => chooseStatus('all')} className={`rounded-md px-3 py-1.5 text-small font-semibold ${status === 'all' ? 'bg-primary-700 text-white' : 'border border-stone-300 text-stone-700'}`}>All</button>{statuses.map((item) => <button key={item.status} type="button" role="tab" aria-selected={status === item.status} onClick={() => chooseStatus(item.status)} className={`rounded-md px-3 py-1.5 text-small font-semibold ${status === item.status ? 'bg-primary-700 text-white' : 'border border-stone-300 text-stone-700'}`}>{item.label}</button>)}</div><AdminDataTable columns={columns} rows={rows} rowActions={(row) => [{ label: 'Open', onClick: () => navigate(`/admin/bookings/${row.id}${location.search}`) }]} searchPlaceholder="Search booking, traveller, or trip" activeFilters={activeFilters} onClearFilters={() => chooseStatus('all')} emptyState={{ title: 'No bookings match this status', description: 'Bookings created from inquiries will appear here immediately.' }} /></>}</div>
}
