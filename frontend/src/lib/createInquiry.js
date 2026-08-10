// Creates an inquiry from a public form, with the shape already filled in.
import { createItem } from './dataClient.js'
import { inquiryStatusLabel } from '../config/inquiryStatuses.js'
import { notifyUsers, staffUserIds } from './notifications.js'

const REFERENCE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'

function randomReferenceSuffix(length = 6) {
  const values = new Uint8Array(length)
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(values)
  } else {
    for (let index = 0; index < length; index += 1) {
      values[index] = Math.floor(Math.random() * 256)
    }
  }
  return Array.from(values, (value) => REFERENCE_ALPHABET[value % REFERENCE_ALPHABET.length]).join('')
}

function createReferenceCode(now) {
  return `CFN-${new Date(now).getUTCFullYear()}-${randomReferenceSuffix()}`
}

export async function createInquiry(values) {
  const now = new Date().toISOString()
  const referenceCode = values.referenceCode || createReferenceCode(now)

  const result = await createItem(
    'inquiries',
    {
      referenceCode,
      type: values.type || 'contact',
      status: 'new',
      fullName: values.fullName,
      email: values.email,
      phone: values.phone || null,
      country: values.country || null,
      subject: values.subject || '',
      message: values.message || '',
      packageId: values.packageId || null,
      guideId: values.guideId || null,
      preferredDate: values.preferredDate || null,
      groupSize: values.groupSize || null,
      userId: values.userId || null,
      assignedTo: null,
      followUpDate: null,
      internalNotes: [],
      statusHistory: [{ status: 'new', changedAt: now, note: 'Inquiry received from the public site.' }],
      updatedAt: now,
    },
    { id: 'public', fullName: values.fullName || 'Website visitor' }
  )

  if (result.success) {
    const recipients = await staffUserIds(['admin', 'super_admin'])
    await notifyUsers(recipients, 'new_inquiry', {
      typeLabel: inquiryStatusLabel(values.type || 'inquiry').replace(/^./, (letter) => letter.toUpperCase()),
      fullName: result.data.fullName || 'A visitor',
      subject: result.data.subject || 'a new trip request',
      link: '/admin/inquiries',
    }, { id: 'public', fullName: values.fullName || 'Website visitor' })
  }

  return result
}
