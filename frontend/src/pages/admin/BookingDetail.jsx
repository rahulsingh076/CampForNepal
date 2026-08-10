import { useMemo, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import AdminPageHeader from '../../components/admin/AdminPageHeader.jsx'
import StatusBadge from '../../components/admin/StatusBadge.jsx'
import BookingStatusTimeline from '../../components/customer/BookingStatusTimeline.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import FormField from '../../components/common/FormField.jsx'
import { useToast } from '../../components/admin/Toast.jsx'
import { bookingStatusLabel, normalizeBookingStatus } from '../../config/bookingStatuses.js'
import { useAuth } from '../../contexts/AuthContext.jsx'
import useCollection from '../../hooks/useCollection.js'
import { moveBookingStatus, nextBookingStatuses } from '../../lib/bookingWorkflow.js'
import { formatDate, formatDateRange } from '../../lib/formatters.js'
import { updateItem } from '../../lib/dataClient.js'
import ErrorState from '../../components/common/ErrorState.jsx'
import LoadingState from '../../components/common/LoadingState.jsx'

function notesFor(booking) {
  if (Array.isArray(booking.internalNotes)) return booking.internalNotes
  if (!booking.internalNotes) return []
  return [{ body: booking.internalNotes, authorName: 'Existing team note', createdAt: booking.updatedAt || booking.createdAt }]
}

export default function BookingDetail() {
  const { id } = useParams()
  const location = useLocation()
  const { user } = useAuth()
  const { showToast } = useToast()
  const bookings = useCollection('bookings', { pageSize: 0 })
  const packages = useCollection('packages', { pageSize: 0 })
  const departures = useCollection('fixedDepartures', { pageSize: 0 })
  const guides = useCollection('guides', { pageSize: 0 })
  const booking = bookings.items.find((item) => item.id === id)
  const packageItem = packages.items.find((item) => item.id === booking?.packageId)
  const departure = departures.items.find((item) => item.id === booking?.departureId)
  const [nextStatus, setNextStatus] = useState('')
  const [statusNote, setStatusNote] = useState('')
  const [assignedGuideId, setAssignedGuideId] = useState('')
  const [newNote, setNewNote] = useState('')
  const [busy, setBusy] = useState(false)
  const allowed = booking ? nextBookingStatuses(booking.status) : []
  const notes = booking ? notesFor(booking) : []
  const activeGuideId = assignedGuideId || booking?.assignedGuideId || ''
  const activeGuide = guides.items.find((guide) => guide.id === activeGuideId)

  const documents = useMemo(() => booking?.documentsChecklist || [], [booking])
  const collectionStatus = [bookings, packages, departures, guides].some((collection) => collection.status === 'error') ? 'error' : [bookings, packages, departures, guides].some((collection) => collection.status === 'loading') ? 'loading' : 'ready'
  function retry() { bookings.reload(); packages.reload(); departures.reload(); guides.reload() }
  if (collectionStatus === 'loading') return <LoadingState label="Loading booking" rows={8} />
  if (collectionStatus === 'error') return <ErrorState title="We could not load this booking" description="Try again to refresh the trip, guide, and document information." action={<button type="button" onClick={retry} className="rounded-lg border border-stone-300 px-3 py-2 text-small font-semibold text-primary-800 hover:border-primary-600">Try again</button>} />
  if (!booking) return <EmptyState title="Booking not found" description="This record may have been removed from the local demo." action={<Link to={`/admin/bookings${location.search}`} className="mt-5 inline-block text-small font-semibold text-primary-700">Back to bookings</Link>} />

  async function updateStatus() {
    if (!nextStatus) return
    setBusy(true)
    const result = await moveBookingStatus({ booking, nextStatus, note: statusNote, packageTitle: packageItem?.title, actor: user })
    setBusy(false)
    if (result.success) { setNextStatus(''); setStatusNote(''); bookings.reload(); showToast(`Booking moved to ${bookingStatusLabel(result.data.status)}.`) } else showToast(result.message || 'Could not update this booking.', 'error')
  }

  async function saveGuide() {
    setBusy(true)
    const result = await updateItem('bookings', booking.id, { status: normalizeBookingStatus(booking.status), assignedGuideId: assignedGuideId || null }, user)
    setBusy(false)
    if (result.success) { bookings.reload(); showToast('Assigned guide updated.') } else showToast(result.message || 'Could not assign a guide.', 'error')
  }

  async function toggleDocument(index) {
    const next = documents.map((item, itemIndex) => itemIndex === index ? { ...item, done: !item.done } : item)
    const result = await updateItem('bookings', booking.id, { status: normalizeBookingStatus(booking.status), documentsChecklist: next }, user)
    if (result.success) { bookings.reload(); showToast('Document checklist updated.') } else showToast(result.message || 'Could not update documents.', 'error')
  }

  async function addNote() {
    if (!newNote.trim()) return
    setBusy(true)
    const result = await updateItem('bookings', booking.id, { status: normalizeBookingStatus(booking.status), internalNotes: [...notes, { body: newNote.trim(), authorName: user.fullName, createdAt: new Date().toISOString() }] }, user)
    setBusy(false)
    if (result.success) { setNewNote(''); bookings.reload(); showToast('Internal note added.') } else showToast(result.message || 'Could not add this note.', 'error')
  }

  return <div className="space-y-7"><Link to={`/admin/bookings${location.search}`} className="text-small font-semibold text-primary-700 hover:text-primary-800">Back to bookings</Link><AdminPageHeader title={booking.reference} description={`${booking.leadTraveller.fullName} · ${packageItem?.title || 'Trip being planned'}`} actions={<StatusBadge status={normalizeBookingStatus(booking.status)} label={bookingStatusLabel(booking.status)} />} /><section className="grid gap-6 xl:grid-cols-3"><div className="space-y-6 xl:col-span-2"><section className="border border-stone-200 bg-white p-6"><h2 className="text-h4 font-sans text-stone-900">Trip summary</h2><dl className="mt-5 grid gap-4 text-small sm:grid-cols-2"><div><dt className="text-stone-500">Trip</dt><dd className="mt-1 font-semibold text-stone-900">{packageItem?.title || 'Trip being planned'}</dd></div><div><dt className="text-stone-500">Dates</dt><dd className="mt-1 font-semibold text-stone-900">{departure ? formatDateRange(departure.startDate, departure.endDate) : 'Dates being planned'}</dd></div><div><dt className="text-stone-500">Travellers</dt><dd className="mt-1 font-semibold text-stone-900">{(booking.travellers?.adults || 0) + (booking.travellers?.children || 0)}</dd></div><div><dt className="text-stone-500">Lead traveller</dt><dd className="mt-1 font-semibold text-stone-900">{booking.leadTraveller.email || 'No email'} · {booking.leadTraveller.phone || 'No phone'}</dd></div></dl>{booking.specialRequests && <p className="mt-5 border-l-2 border-primary-300 pl-4 text-small leading-6 text-stone-700">{booking.specialRequests}</p>}</section><section className="border border-stone-200 bg-white p-6"><h2 className="text-h4 font-sans text-stone-900">Booking status</h2><div className="mt-5"><BookingStatusTimeline status={booking.status} history={booking.statusHistory} /></div></section><section className="border border-stone-200 bg-white p-6"><h2 className="text-h4 font-sans text-stone-900">Internal notes</h2><div className="mt-4 space-y-3">{notes.length ? notes.map((item, index) => <article key={`${item.createdAt}-${index}`} className="border-l-2 border-stone-300 pl-4"><p className="whitespace-pre-wrap text-small text-stone-800">{item.body}</p><p className="mt-1 text-small text-stone-500">{item.authorName || 'Team'} · {formatDate(item.createdAt, { short: true })}</p></article>) : <p className="text-small text-stone-600">No internal notes yet.</p>}</div><div className="mt-5"><FormField label="Add a note" as="textarea" value={newNote} onChange={(event) => setNewNote(event.target.value)} /><button type="button" disabled={busy || !newNote.trim()} onClick={addNote} className="mt-3 rounded-lg border border-stone-300 px-4 py-2 text-small font-semibold text-primary-800 hover:border-primary-600 disabled:opacity-60">Add internal note</button></div></section></div><aside className="space-y-6"><section className="border border-stone-200 bg-white p-5"><h2 className="text-h4 font-sans text-stone-900">Booking status</h2>{allowed.length ? <><div className="mt-4"><FormField label="Set status" as="select" value={nextStatus} onChange={(event) => setNextStatus(event.target.value)} options={[{ value: '', label: 'Choose status' }, ...allowed.map((status) => ({ value: status, label: bookingStatusLabel(status) }))]} /></div><div className="mt-4"><FormField label="Status note" as="textarea" value={statusNote} onChange={(event) => setStatusNote(event.target.value)} hint="Optional short note. Use private chat for detailed planning." /></div><button type="button" onClick={updateStatus} disabled={busy || !nextStatus} className="mt-4 w-full rounded-lg bg-primary-700 px-4 py-2 text-small font-semibold text-white hover:bg-primary-800 disabled:opacity-60">Save status</button></> : <p className="mt-3 text-small text-stone-600">Only booked and cancelled statuses are available.</p>}</section><section className="border border-stone-200 bg-white p-5"><h2 className="text-h4 font-sans text-stone-900">Assigned guide</h2><div className="mt-4"><FormField label="Guide" as="select" value={activeGuideId} onChange={(event) => setAssignedGuideId(event.target.value)} options={[{ value: '', label: 'No guide assigned' }, ...guides.items.filter((guide) => guide.status !== 'suspended').map((guide) => ({ value: guide.id, label: guide.fullName }))]} /></div>{activeGuide && <p className="mt-3 text-small text-stone-600">{activeGuide.guideType} · {activeGuide.experienceYears} years experience</p>}<button type="button" onClick={saveGuide} disabled={busy} className="mt-4 rounded-lg border border-stone-300 px-4 py-2 text-small font-semibold text-primary-800 hover:border-primary-600 disabled:opacity-60">Save guide</button></section><section className="border border-stone-200 bg-white p-5"><h2 className="text-h4 font-sans text-stone-900">Documents checklist</h2><p className="mt-2 text-small text-stone-600">Internal metadata only. Confirm files and document details in private chat.</p><ul className="mt-4 space-y-3">{documents.map((item, index) => <li key={item.label}><label className="flex cursor-pointer items-start gap-3 text-small text-stone-800"><input type="checkbox" checked={item.done} onChange={() => toggleDocument(index)} className="mt-0.5 h-4 w-4 rounded border-stone-400 text-primary-700" /><span>{item.label}</span></label></li>)}</ul></section></aside></section></div>
}
