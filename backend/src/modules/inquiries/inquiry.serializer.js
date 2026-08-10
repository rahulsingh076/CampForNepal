// Turns an inquiry into JSON. Explicitly, field by field.
//
// `.lean()` returns a plain object, which bypasses the schema's `toJSON`
// transform entirely. These serializers keep privacy guarantees explicit even
// when controllers use lean queries.
//
// These serializers are allowlists. They name the fields that go out, so a
// field added to the schema later is invisible until somebody deliberately adds
// it here. That is the opposite of a denylist, which is only ever as good as
// the last person's memory.
//
// Nothing here reads `internalNotes`, `statusHistory`, `idempotencyKeyHash`,
// `spamSignals`, or `submissionMetadata` unless a caller explicitly asks for
// the staff detail view.

// Dates go out as ISO strings, consistently, whether the document came from
// `.lean()` (a Date) or from JSON (already a string).
function isoDate(value) {
  if (!value) return null
  if (value instanceof Date) return value.toISOString()
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
}

// `_id` may be an ObjectId, a string, or a populated document.
function idOf(value) {
  if (!value) return null
  if (typeof value === 'string') return value
  if (value._id) return String(value._id)
  return String(value)
}

// A populated User, reduced to what a CRM screen needs. Never the password
// hash, the session version, or the lockout counters — those are `select:
// false` on the model, but a serializer that named them would defeat that.
function staffSummary(user) {
  if (!user || typeof user !== 'object' || !user.fullName) {
    return user ? { id: idOf(user) } : null
  }
  return { id: idOf(user), fullName: user.fullName, role: user.role || null }
}

// A populated Package. `sourceId` is deliberately absent: it is the frontend
// migration key and has no business leaving the server.
function packageSummary(record) {
  if (!record || typeof record !== 'object' || !record.title) return null
  return { id: idOf(record), title: record.title, slug: record.slug || null }
}

// A populated Guide. Only the fields already public on a guide profile —
// never `pricePerDay`, `certifications`, `verificationStatus`, or
// `internalNotes`.
function guideSummary(record) {
  if (!record || typeof record !== 'object' || !record.fullName) return null
  return { id: idOf(record), fullName: record.fullName, slug: record.slug || null }
}

function departureSummary(record) {
  if (!record || typeof record !== 'object' || !record.startDate) return null
  return { id: idOf(record), startDate: isoDate(record.startDate), status: record.status || null }
}

function contactOf(inquiry) {
  const contact = inquiry.contact || {}
  return {
    fullName: contact.fullName || '',
    email: contact.email || '',
    phone: contact.phone || '',
    whatsapp: contact.whatsapp || '',
    country: contact.country || '',
    language: contact.language || '',
    nationality: contact.nationality || '',
    preferredContactMethod: contact.preferredContactMethod || '',
  }
}

// The list view shows enough to triage without showing enough to be a privacy
// problem on a shared screen: a name and a country, not a full message.
function contactPreview(inquiry) {
  const contact = inquiry.contact || {}
  return {
    fullName: contact.fullName || '',
    email: contact.email || '',
    phone: contact.phone || '',
    country: contact.country || '',
  }
}

function tripOf(inquiry) {
  const trip = inquiry.trip || {}
  return {
    packageId: idOf(trip.packageId),
    fixedDepartureId: idOf(trip.fixedDepartureId),
    guideId: idOf(trip.guideId),
    destinationInterest: trip.destinationInterest || '',
    travelDate: isoDate(trip.travelDate),
    flexibleDates: trip.flexibleDates || '',
    numberOfPeople: trip.numberOfPeople ?? null,
    budgetRange: trip.budgetRange || '',
    tripType: trip.tripType || '',
    guideLanguage: trip.guideLanguage || '',
    hotelNeeded: trip.hotelNeeded || '',
    transportNeeded: trip.transportNeeded || '',
  }
}

function snapshotOf(inquiry) {
  const snapshot = inquiry.snapshot || {}
  return {
    packageTitle: snapshot.packageTitle || '',
    packageSlug: snapshot.packageSlug || '',
    departureDate: isoDate(snapshot.departureDate),
    guideName: snapshot.guideName || '',
  }
}

// What the person who submitted the form gets back. Deliberately three fields.
//
// No MongoDB id, no priority, no assignment, no internal anything — a public
// response is the easiest place in the system to leak something, so it carries
// the minimum that lets somebody quote their inquiry back to us.
export function serializePublicInquiry(inquiry) {
  return {
    referenceCode: inquiry.referenceCode,
    status: inquiry.status,
    submittedAt: isoDate(inquiry.createdAt),
  }
}

// One row in the staff CRM list. No message body, no notes, no history: a list
// endpoint that returned those would ship every note in the database to anyone
// who could reach page 1.
export function serializeInquiryListItem(inquiry) {
  return {
    id: idOf(inquiry._id || inquiry.id),
    referenceCode: inquiry.referenceCode,
    type: inquiry.type,
    status: inquiry.status,
    priority: inquiry.priority,
    contact: contactPreview(inquiry),
    trip: {
      packageTitle: (inquiry.snapshot || {}).packageTitle || '',
      guideName: (inquiry.snapshot || {}).guideName || '',
      travelDate: isoDate((inquiry.trip || {}).travelDate),
      numberOfPeople: (inquiry.trip || {}).numberOfPeople ?? null,
    },
    assignedTo: staffSummary(inquiry.assignedToUserId),
    followUpAt: isoDate(inquiry.followUpAt),
    createdAt: isoDate(inquiry.createdAt),
    updatedAt: isoDate(inquiry.updatedAt),
  }
}

function serializeNote(note) {
  return {
    author: staffSummary(note.authorUserId),
    text: note.text,
    createdAt: isoDate(note.createdAt),
  }
}

function serializeStatusChange(change) {
  return {
    fromStatus: change.fromStatus || null,
    toStatus: change.toStatus,
    changedBy: staffSummary(change.changedByUserId),
    changedAt: isoDate(change.changedAt),
    reason: change.reason || '',
  }
}

// The staff detail view. Notes and history appear only when the service loaded
// them deliberately — they are `select: false`, so an ordinary query returns a
// document without them and this returns empty arrays rather than inventing
// data.
//
// `idempotencyKeyHash`, `spamSignals`, and `submissionMetadata` are never
// serialised at all, for anybody.
export function serializeInquiryDetail(inquiry) {
  return {
    id: idOf(inquiry._id || inquiry.id),
    referenceCode: inquiry.referenceCode,
    type: inquiry.type,
    status: inquiry.status,
    priority: inquiry.priority,
    source: inquiry.source,

    contact: contactOf(inquiry),
    trip: tripOf(inquiry),
    snapshot: snapshotOf(inquiry),

    package: packageSummary((inquiry.trip || {}).packageId),
    departure: departureSummary((inquiry.trip || {}).fixedDepartureId),
    guide: guideSummary((inquiry.trip || {}).guideId),

    subject: inquiry.subject || '',
    message: inquiry.message || '',
    specialRequest: inquiry.specialRequest || '',

    callback: {
      preferredDate: isoDate((inquiry.callback || {}).preferredDate),
      preferredTime: (inquiry.callback || {}).preferredTime || '',
      timezone: (inquiry.callback || {}).timezone || '',
    },

    // The fact and the version, not a re-statement of the policy text.
    consent: {
      accepted: Boolean((inquiry.consent || {}).accepted),
      acceptedAt: isoDate((inquiry.consent || {}).acceptedAt),
      privacyPolicyVersion: (inquiry.consent || {}).privacyPolicyVersion || '',
    },

    customer: staffSummary(inquiry.userId),
    assignedTo: staffSummary(inquiry.assignedToUserId),
    followUpAt: isoDate(inquiry.followUpAt),

    internalNotes: (inquiry.internalNotes || []).map(serializeNote),
    statusHistory: (inquiry.statusHistory || []).map(serializeStatusChange),

    createdAt: isoDate(inquiry.createdAt),
    updatedAt: isoDate(inquiry.updatedAt),
  }
}

export default { serializePublicInquiry, serializeInquiryListItem, serializeInquiryDetail }
