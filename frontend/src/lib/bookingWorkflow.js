import { BOOKING_PIPELINE, BOOKING_SIDE_STATES, BOOKING_STATUS_OPTIONS, bookingStatusLabel, normalizeBookingStatus } from '../config/bookingStatuses.js'
import { createItem, getItem, listItems, updateItem } from './dataClient.js'
import { notifyUsers } from './notifications.js'

export function nextBookingStatuses(status) {
  const current = normalizeBookingStatus(status)
  return BOOKING_STATUS_OPTIONS.map((item) => item.status).filter((next) => next !== current)
}

export function isAllowedBookingTransition(current, next) {
  return nextBookingStatuses(current).includes(normalizeBookingStatus(next))
}

function bookingReference() {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  return `CFN-${stamp}-${Math.floor(100 + Math.random() * 900)}`
}

function defaultChecklist() {
  return [
    { label: 'Passport copy for each traveller', done: false },
    { label: 'Travel insurance details', done: false },
    { label: 'Passport photos for permits', done: false },
  ]
}

export async function convertInquiryToBooking({ inquiry, packageId, departureId = null, actor }) {
  if (!packageId) return { success: false, message: 'Choose a trip before converting this inquiry.' }
  if (inquiry.status === 'converted') return { success: false, message: 'This inquiry is already linked to a booking.' }
  if (inquiry.status !== 'quoted') return { success: false, message: 'Move this inquiry to Quoted before converting it to a booking.' }

  const [packages, users] = await Promise.all([
    getItem('packages', packageId),
    listItems('users', { pageSize: 0 }),
  ])
  if (!packages.success) return { success: false, message: 'The selected trip could not be found.' }
  const account = users.success
    ? users.data.find((user) => user.role === 'customer' && user.status === 'active' && user.email.toLowerCase() === String(inquiry.email || '').toLowerCase())
    : null

  const now = new Date().toISOString()
  const booking = await createItem('bookings', {
    reference: bookingReference(),
    inquiryId: inquiry.id,
    userId: inquiry.userId || account?.id || null,
    packageId,
    departureId: departureId || null,
    travellers: { adults: Number(inquiry.groupSize) || 1, children: 0 },
    leadTraveller: {
      fullName: inquiry.fullName,
      email: inquiry.email || '',
      phone: inquiry.phone || '',
      country: inquiry.country || 'XX',
      passportProvided: false,
    },
    specialRequests: inquiry.message || '',
    status: 'booked',
    statusHistory: [{
      status: 'booked',
      changedAt: now,
      note: `Booked from inquiry ${inquiry.id}. Further details can be discussed in private chat.`,
    }],
    documents: [],
    documentsChecklist: defaultChecklist(),
    internalNotes: [],
    assignedGuideId: null,
  }, actor)
  if (!booking.success) return booking

  const inquiryUpdate = await updateItem('inquiries', inquiry.id, {
    status: 'converted',
    bookingId: booking.data.id,
    statusHistory: [...(inquiry.statusHistory || []), { status: 'converted', changedAt: now, by: actor.fullName }],
  }, actor)
  if (!inquiryUpdate.success) return inquiryUpdate

  await notifyUsers([booking.data.userId || actor.id], 'booking_status', {
    reference: booking.data.reference,
    statusLabel: bookingStatusLabel('booked'),
    packageTitle: packages.data.title,
    link: `/customer/bookings/${booking.data.id}`,
  }, actor)

  return { success: true, message: 'Inquiry converted to a booking.', data: booking.data }
}

export async function moveBookingStatus({ booking, nextStatus, note, packageTitle, actor }) {
  const normalizedNext = normalizeBookingStatus(nextStatus)
  if (!isAllowedBookingTransition(booking.status, normalizedNext)) {
    return { success: false, message: 'That status is not available from the current booking state.' }
  }
  const now = new Date().toISOString()
  const result = await updateItem('bookings', booking.id, {
    status: normalizedNext,
    statusHistory: [...(booking.statusHistory || []), {
      status: normalizedNext,
      changedAt: now,
      note: String(note || '').trim() || `Status changed to ${bookingStatusLabel(normalizedNext)}.`,
      by: actor.fullName,
    }],
  }, actor)
  if (!result.success) return result

  await notifyUsers([result.data.userId || actor.id], 'booking_status', {
    reference: result.data.reference,
    statusLabel: bookingStatusLabel(normalizedNext),
    packageTitle: packageTitle || 'Your trip',
    link: `/customer/bookings/${result.data.id}`,
  }, actor)
  return result
}

export { BOOKING_PIPELINE, BOOKING_SIDE_STATES }
