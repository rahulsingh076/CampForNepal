import { useMemo, useState } from 'react'
import AdminDataTable from '../../components/admin/AdminDataTable.jsx'
import AdminPageHeader from '../../components/admin/AdminPageHeader.jsx'
import DetailDrawer from '../../components/admin/DetailDrawer.jsx'
import StatusBadge from '../../components/admin/StatusBadge.jsx'
import { useToast } from '../../components/admin/Toast.jsx'
import FormField from '../../components/common/FormField.jsx'
import { allowedInquiryTransitions, inquiryStatusLabel } from '../../config/inquiryStatuses.js'
import { useAuth } from '../../contexts/AuthContext.jsx'
import useCollection from '../../hooks/useCollection.js'
import { convertInquiryToBooking } from '../../lib/bookingWorkflow.js'
import { formatDate } from '../../lib/formatters.js'
import { updateItem } from '../../lib/dataClient.js'
import ErrorState from '../../components/common/ErrorState.jsx'
import LoadingState from '../../components/common/LoadingState.jsx'

const TYPE_OPTIONS = [
  { value: '', label: 'All types' },
  { value: 'package_inquiry', label: 'Package' },
  { value: 'custom_trip', label: 'Custom trip' },
  { value: 'contact', label: 'Contact' },
  { value: 'callback', label: 'Callback' },
  { value: 'emergency', label: 'Emergency' },
  { value: 'guide_request', label: 'Guide request' },
]

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  ...['new', 'contacted', 'quoted', 'converted', 'lost', 'closed'].map((status) => ({ value: status, label: inquiryStatusLabel(status) })),
]

function typeLabel(type) {
  return TYPE_OPTIONS.find((item) => item.value === type)?.label || String(type || '').replace(/_/g, ' ')
}

function noteList(inquiry) {
  if (Array.isArray(inquiry.internalNotes)) return inquiry.internalNotes
  if (!inquiry.internalNotes) return []
  return [{ body: inquiry.internalNotes, authorName: 'Existing team note', createdAt: inquiry.updatedAt || inquiry.createdAt }]
}

function Detail({ inquiry, packages, departures, staff, onClose, onChanged }) {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [assignedTo, setAssignedTo] = useState(inquiry.assignedTo || '')
  const [followUpDate, setFollowUpDate] = useState(inquiry.followUpDate || '')
  const [note, setNote] = useState('')
  const [nextStatus, setNextStatus] = useState(allowedInquiryTransitions(inquiry.status)[0] || '')
  const [conversionPackageId, setConversionPackageId] = useState(inquiry.packageId || '')
  const [conversionDepartureId, setConversionDepartureId] = useState('')
  const [busy, setBusy] = useState(false)
  const notes = noteList(inquiry)
  const nextOptions = allowedInquiryTransitions(inquiry.status)
  const availableDepartures = departures.filter((departure) => departure.packageId === conversionPackageId && !['cancelled', 'completed'].includes(departure.status))

  async function saveDetails() {
    setBusy(true)
    const result = await updateItem('inquiries', inquiry.id, { assignedTo: assignedTo || null, followUpDate: followUpDate || null }, user)
    setBusy(false)
    if (result.success) {
      showToast('Inquiry details saved.')
      onChanged(result.data)
    } else showToast(result.message || 'Could not save inquiry details.', 'error')
  }

  async function addNote() {
    if (!note.trim()) return
    setBusy(true)
    const result = await updateItem('inquiries', inquiry.id, {
      internalNotes: [...notes, { body: note.trim(), authorName: user.fullName, createdAt: new Date().toISOString() }],
    }, user)
    setBusy(false)
    if (result.success) {
      setNote('')
      showToast('Internal note added.')
      onChanged(result.data)
    } else showToast(result.message || 'Could not add this note.', 'error')
  }

  async function moveStatus() {
    if (!nextStatus) return
    setBusy(true)
    const result = await updateItem('inquiries', inquiry.id, {
      status: nextStatus,
      statusHistory: [...(inquiry.statusHistory || []), { status: nextStatus, changedAt: new Date().toISOString(), by: user.fullName }],
    }, user)
    setBusy(false)
    if (result.success) {
      showToast(`Inquiry marked ${inquiryStatusLabel(nextStatus)}.`)
      onChanged(result.data)
    } else showToast(result.message || 'Could not update this inquiry.', 'error')
  }

  async function convert() {
    setBusy(true)
    const result = await convertInquiryToBooking({
      inquiry,
      packageId: conversionPackageId,
      departureId: conversionDepartureId || null,
      actor: user,
    })
    setBusy(false)
    if (result.success) {
      showToast('Inquiry converted to a booking.')
      onChanged()
      onClose()
    } else showToast(result.message || 'Could not create the booking.', 'error')
  }

  return (
    <div className="space-y-7">
      <section className="border-b border-stone-200 pb-6">
        <div className="flex flex-wrap items-center gap-2"><StatusBadge status={inquiry.status} /><span className="rounded-full bg-sand-100 px-2.5 py-1 text-small font-semibold text-stone-700">{typeLabel(inquiry.type)}</span></div>
        <h3 className="mt-4 text-h4 font-sans text-stone-900">{inquiry.fullName}</h3>
        <p className="mt-1 text-small text-stone-600">Received {formatDate(inquiry.createdAt, { short: true })}</p>
      </section>

      <section className="space-y-3">
        <h3 className="font-sans text-small font-semibold uppercase tracking-wide text-stone-500">Submitted details</h3>
        <dl className="grid gap-x-6 gap-y-3 text-small sm:grid-cols-2">
          <div><dt className="text-stone-500">Email</dt><dd className="mt-0.5 font-medium text-stone-900">{inquiry.email || 'Not provided'}</dd></div>
          <div><dt className="text-stone-500">Phone</dt><dd className="mt-0.5 font-medium text-stone-900">{inquiry.phone || 'Not provided'}</dd></div>
          <div><dt className="text-stone-500">Country</dt><dd className="mt-0.5 font-medium text-stone-900">{inquiry.country || 'Not provided'}</dd></div>
          <div><dt className="text-stone-500">Group size</dt><dd className="mt-0.5 font-medium text-stone-900">{inquiry.groupSize || 'Not specified'}</dd></div>
          <div><dt className="text-stone-500">Preferred date</dt><dd className="mt-0.5 font-medium text-stone-900">{formatDate(inquiry.preferredDate, { short: true }) || 'Flexible'}</dd></div>
          <div><dt className="text-stone-500">Trip</dt><dd className="mt-0.5 font-medium text-stone-900">{packages.find((item) => item.id === inquiry.packageId)?.title || 'Not specified'}</dd></div>
        </dl>
        <div className="border-l-2 border-primary-300 bg-primary-50 px-4 py-3"><p className="font-semibold text-stone-900">{inquiry.subject || 'No subject'}</p><p className="mt-2 whitespace-pre-wrap text-small leading-6 text-stone-700">{inquiry.message || 'No message was provided.'}</p></div>
      </section>

      <section className="grid gap-4 border-y border-stone-200 py-6 sm:grid-cols-2">
        <FormField label="Assigned staff" as="select" value={assignedTo} onChange={(event) => setAssignedTo(event.target.value)} options={[{ value: '', label: 'Unassigned' }, ...staff.map((person) => ({ value: person.id, label: person.fullName }))]} />
        <FormField label="Follow-up date" type="date" value={followUpDate} onChange={(event) => setFollowUpDate(event.target.value)} />
        <div className="sm:col-span-2"><button type="button" onClick={saveDetails} disabled={busy} className="rounded-lg border border-stone-300 px-4 py-2 text-small font-semibold text-primary-800 hover:border-primary-600 disabled:opacity-60">Save assignment and follow-up</button></div>
      </section>

      <section>
        <h3 className="text-h4 font-sans text-stone-900">Status</h3>
        {nextOptions.length ? (
          <div className="mt-3 flex flex-wrap items-end gap-3"><div className="min-w-52 flex-1"><FormField label="Move to" as="select" value={nextStatus} onChange={(event) => setNextStatus(event.target.value)} options={nextOptions.map((status) => ({ value: status, label: inquiryStatusLabel(status) }))} /></div><button type="button" onClick={moveStatus} disabled={busy || !nextStatus} className="rounded-lg bg-primary-700 px-4 py-3 text-small font-semibold text-white hover:bg-primary-800 disabled:opacity-60">Update status</button></div>
        ) : <p className="mt-2 text-small text-stone-600">This inquiry is closed to further status changes.</p>}
      </section>

      {inquiry.status === 'quoted' && (
        <section className="border border-primary-200 bg-primary-50 p-5">
          <h3 className="text-h4 font-sans text-stone-900">Convert to booking</h3>
          <p className="mt-2 text-small text-stone-600">This creates a linked booking at the first lifecycle step. It never creates a payment record.</p>
          <div className="mt-4 grid gap-4"><FormField label="Trip" required as="select" value={conversionPackageId} onChange={(event) => { setConversionPackageId(event.target.value); setConversionDepartureId('') }} options={[{ value: '', label: 'Choose a trip' }, ...packages.map((item) => ({ value: item.id, label: item.title }))]} /><FormField label="Departure" as="select" value={conversionDepartureId} onChange={(event) => setConversionDepartureId(event.target.value)} options={[{ value: '', label: 'Dates to be planned' }, ...availableDepartures.map((item) => ({ value: item.id, label: `${formatDate(item.startDate, { short: true })} - ${item.status.replace(/_/g, ' ')}` }))]} /></div>
          <button type="button" onClick={convert} disabled={busy || !conversionPackageId} className="mt-4 rounded-lg bg-primary-700 px-4 py-2 text-small font-semibold text-white hover:bg-primary-800 disabled:opacity-60">Convert to booking</button>
        </section>
      )}

      {inquiry.status !== 'quoted' && !['converted', 'lost', 'closed'].includes(inquiry.status) && <section className="border border-stone-200 bg-sand-50 p-5"><h3 className="text-h4 font-sans text-stone-900">Convert to booking</h3><p className="mt-2 text-small text-stone-600">Move this inquiry to Quoted before converting it into a booking. That keeps the CRM history clear for the team and customer.</p></section>}

      <section>
        <h3 className="text-h4 font-sans text-stone-900">Internal notes</h3>
        <div className="mt-4 space-y-3">{notes.length ? notes.map((item, index) => <article key={`${item.createdAt}-${index}`} className="border-l-2 border-stone-300 pl-4"><p className="whitespace-pre-wrap text-small text-stone-800">{item.body}</p><p className="mt-1 text-small text-stone-500">{item.authorName || 'Team'} · {formatDate(item.createdAt, { short: true })}</p></article>) : <p className="text-small text-stone-600">No internal notes yet.</p>}</div>
        <div className="mt-4"><FormField label="Add a note" as="textarea" value={note} onChange={(event) => setNote(event.target.value)} /><button type="button" onClick={addNote} disabled={busy || !note.trim()} className="mt-3 rounded-lg border border-stone-300 px-4 py-2 text-small font-semibold text-primary-800 hover:border-primary-600 disabled:opacity-60">Add internal note</button></div>
      </section>
    </div>
  )
}

export default function Inquiries() {
  const inquiries = useCollection('inquiries', { pageSize: 0 })
  const packages = useCollection('packages', { pageSize: 0 })
  const departures = useCollection('fixedDepartures', { pageSize: 0 })
  const users = useCollection('users', { pageSize: 0 })
  const [type, setType] = useState('')
  const [status, setStatus] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const collectionStatus = [inquiries, packages, departures, users].some((collection) => collection.status === 'error') ? 'error' : [inquiries, packages, departures, users].some((collection) => collection.status === 'loading') ? 'loading' : 'ready'
  const selected = inquiries.items.find((item) => item.id === selectedId)
  const staff = users.items.filter((user) => ['admin', 'super_admin'].includes(user.role) && user.status === 'active')
  const rows = useMemo(() => inquiries.items.filter((inquiry) => {
    const date = String(inquiry.createdAt || '').slice(0, 10)
    return (!type || inquiry.type === type) && (!status || inquiry.status === status) && (!from || date >= from) && (!to || date <= to)
  }), [from, inquiries.items, status, to, type])

  const columns = [
    { key: 'fullName', label: 'Traveller', sortable: true, searchValue: (row) => [row.fullName, row.email, row.subject, row.message], render: (row) => <div><p className="font-semibold text-stone-900">{row.fullName}</p><p className="max-w-xs truncate text-stone-600">{row.subject || row.email || 'No subject'}</p></div> },
    { key: 'type', label: 'Type', sortable: true, render: (row) => <span className="rounded-full bg-sand-100 px-2 py-1 text-small font-semibold text-stone-700">{typeLabel(row.type)}</span> },
    { key: 'status', label: 'Status', sortable: true, render: (row) => <StatusBadge status={row.status} /> },
    { key: 'assignedTo', label: 'Assigned', searchValue: (row) => staff.find((person) => person.id === row.assignedTo)?.fullName || '', render: (row) => staff.find((person) => person.id === row.assignedTo)?.fullName || 'Unassigned' },
    { key: 'createdAt', label: 'Received', sortable: true, render: (row) => formatDate(row.createdAt, { short: true }) },
  ]

  const activeFilters = [
    type && `Type: ${typeLabel(type)}`,
    status && `Status: ${inquiryStatusLabel(status)}`,
    from && `From: ${from}`,
    to && `To: ${to}`,
  ].filter(Boolean)

  function clearFilters() {
    setType('')
    setStatus('')
    setFrom('')
    setTo('')
  }

  function retry() { inquiries.reload(); packages.reload(); departures.reload(); users.reload() }

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Inquiries" description="Every public request in one triage queue, ready for a human follow-up." />
      {collectionStatus === 'loading' ? <LoadingState label="Loading inquiries" rows={8} /> : collectionStatus === 'error' ? <ErrorState title="We could not load inquiries" description="Try again to refresh the CRM queue and its supporting records." action={<button type="button" onClick={retry} className="rounded-lg border border-stone-300 px-3 py-2 text-small font-semibold text-primary-800 hover:border-primary-600">Try again</button>} /> : <><section className="grid gap-4 border-y border-stone-200 py-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Inquiry filters"><FormField label="Type" as="select" value={type} onChange={(event) => setType(event.target.value)} options={TYPE_OPTIONS} /><FormField label="Status" as="select" value={status} onChange={(event) => setStatus(event.target.value)} options={STATUS_OPTIONS} /><FormField label="Received from" type="date" value={from} onChange={(event) => setFrom(event.target.value)} /><FormField label="Received to" type="date" value={to} onChange={(event) => setTo(event.target.value)} /></section>
      <AdminDataTable columns={columns} rows={rows} rowActions={(row) => [{ label: 'Open', onClick: () => setSelectedId(row.id) }]} searchPlaceholder="Search people, email, subject, or message" activeFilters={activeFilters} onClearFilters={clearFilters} emptyState={{ title: 'No inquiries match these filters', description: 'Try widening the date range or clearing a filter.' }} /></>}
      <DetailDrawer open={Boolean(selected)} onClose={() => setSelectedId(null)} title={selected ? `Inquiry from ${selected.fullName}` : 'Inquiry details'}>{selected && <Detail key={selected.id} inquiry={selected} packages={packages.items} departures={departures.items} staff={staff} onClose={() => setSelectedId(null)} onChanged={() => inquiries.reload()} />}</DetailDrawer>
    </div>
  )
}
