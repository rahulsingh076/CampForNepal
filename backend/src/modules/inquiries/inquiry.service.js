// Everything that reads or writes an inquiry. The only layer touching the
// model, so the rules about who may do what live in exactly one place.
import mongoose from 'mongoose'
import { STAFF_ROLES } from '../../constants/roles.js'
import { DEFAULT_INQUIRY_PRIORITY, URGENT_INQUIRY_PRIORITY, isInquiryPriority } from '../../constants/inquiryPriorities.js'
import { DEFAULT_INQUIRY_SOURCE } from '../../constants/inquirySources.js'
import { CONVERTED_STATUS, DEFAULT_INQUIRY_STATUS, canTransition, isInquiryStatus } from '../../constants/inquiryStatuses.js'
import { EMERGENCY_INQUIRY_TYPE } from '../../constants/inquiryTypes.js'
import { ACTIVE_USER_STATUS } from '../../constants/userStatuses.js'
import { publicGuidesOnly, publishedOnly } from '../../database/publicVisibility.js'
import ApiError from '../../utils/ApiError.js'
import { withUniqueReference } from '../../utils/inquiryReference.js'
import { toPlainText } from '../../utils/plainText.js'
import FixedDeparture from '../fixedDepartures/fixedDeparture.model.js'
import Guide from '../guides/guide.model.js'
import Package from '../packages/package.model.js'
import User from '../users/user.model.js'
import Inquiry from './inquiry.model.js'

// Roles that may be handed an inquiry. A customer or a guide cannot be
// assigned one, and retired manager/support roles are not valid in this scope.
export const ASSIGNABLE_ROLES = Object.freeze(['admin', 'super_admin'])

// Loaded only for the detail view, and only for staff. Everything else runs
// without them, so a list query cannot accidentally return every note.
const PRIVATE_CRM_FIELDS = '+internalNotes +statusHistory'

function asObjectId(value) {
  return mongoose.isValidObjectId(value) ? new mongoose.Types.ObjectId(String(value)) : null
}

// Resolves a catalogue reference by id, falling back to slug.
//
// The fallback exists because the frontend's seed ids are slugs today; both
// are accepted so the contract survives the migration. A `sourceId` is never
// matched — that is the internal migration key and must not be addressable.
async function resolveByIdOrSlug(Model, reference, visibilityFilter) {
  const objectId = asObjectId(reference)
  const filter = objectId
    ? { _id: objectId, ...visibilityFilter }
    : { slug: String(reference), ...visibilityFilter }
  return Model.findOne(filter)
}

// Turns the three optional catalogue references into real records, and refuses
// anything the public cannot see.
//
// The error message is the same whether a package is missing or merely
// unpublished. Saying "that package exists but is a draft" would let anybody
// enumerate unreleased trips by watching which references change the wording.
async function resolveCatalogReferences(trip) {
  const resolved = { packageDoc: null, departureDoc: null, guideDoc: null }

  if (trip.packageId) {
    resolved.packageDoc = await resolveByIdOrSlug(Package, trip.packageId, publishedOnly())
    if (!resolved.packageDoc) {
      throw ApiError.badRequest('We could not find that trip.', {
        meta: { errors: { packageId: 'We could not find that trip.' } },
      })
    }
  }

  if (trip.guideId) {
    resolved.guideDoc = await resolveByIdOrSlug(Guide, trip.guideId, publicGuidesOnly())
    if (!resolved.guideDoc) {
      throw ApiError.badRequest('We could not find that guide.', {
        meta: { errors: { guideId: 'We could not find that guide.' } },
      })
    }
  }

  if (trip.fixedDepartureId) {
    const objectId = asObjectId(trip.fixedDepartureId)
    resolved.departureDoc = objectId ? await FixedDeparture.findById(objectId) : null

    // A draft departure is not offered to anyone, so it cannot receive a
    // public request.
    if (!resolved.departureDoc || resolved.departureDoc.status === 'draft') {
      throw ApiError.badRequest('We could not find that departure.', {
        meta: { errors: { fixedDepartureId: 'We could not find that departure.' } },
      })
    }
    // A departure belonging to a different trip is a mismatched form, not a
    // valid request — accepting it would file the inquiry against the wrong
    // package.
    if (
      resolved.packageDoc &&
      String(resolved.departureDoc.packageId) !== String(resolved.packageDoc._id)
    ) {
      throw ApiError.badRequest('That departure does not belong to that trip.', {
        meta: { errors: { fixedDepartureId: 'That departure does not belong to that trip.' } },
      })
    }
  }

  return resolved
}

// Copied from the database, never from the browser. A staff member reading
// this in six months needs the title the trip actually had.
function buildSnapshot({ packageDoc, departureDoc, guideDoc }) {
  return {
    packageTitle: packageDoc?.title || '',
    packageSlug: packageDoc?.slug || '',
    departureDate: departureDoc?.startDate || null,
    guideName: guideDoc?.fullName || '',
  }
}

export async function findByIdempotencyHash(hash) {
  if (!hash) return null
  return Inquiry.findOne({ idempotencyKeyHash: hash })
}

// Creates the inquiry. Every privileged field is set here, from server state —
// none of them can arrive in a request body, and validation has already
// rejected any attempt.
export async function createInquiry(clean, context) {
  const { config, userId = null, spamSignals = null, idempotencyKeyHash = null, acceptLanguage = '' } = context

  const resolved = await resolveCatalogReferences(clean.trip)
  const now = new Date()

  // Emergency requests start urgent because the type says so — never because
  // of who sent it. Nothing derives priority from country, budget, or name.
  const priority =
    clean.type === EMERGENCY_INQUIRY_TYPE ? URGENT_INQUIRY_PRIORITY : DEFAULT_INQUIRY_PRIORITY

  const document = {
    type: clean.type,
    // Forced, not defaulted: a default could be overridden by a spread.
    status: DEFAULT_INQUIRY_STATUS,
    priority,
    source: DEFAULT_INQUIRY_SOURCE,
    // Only from a verified session. A body-supplied userId was rejected in
    // validation, so this is the sole path.
    userId,

    contact: clean.contact,
    trip: {
      ...clean.trip,
      packageId: resolved.packageDoc?._id || null,
      fixedDepartureId: resolved.departureDoc?._id || null,
      guideId: resolved.guideDoc?._id || null,
    },
    snapshot: buildSnapshot(resolved),

    subject: clean.subject,
    message: clean.message,
    specialRequest: clean.specialRequest,
    callback: clean.callback,

    // Server time and server policy version. A browser-supplied consent
    // timestamp proves nothing.
    consent: {
      accepted: true,
      acceptedAt: now,
      privacyPolicyVersion: config.privacyPolicyVersion,
    },

    statusHistory: [{ fromStatus: null, toStatus: DEFAULT_INQUIRY_STATUS, changedByUserId: null, changedAt: now }],
    submissionMetadata: { acceptLanguage: String(acceptLanguage || '').slice(0, 60), submittedAt: now },
  }

  if (spamSignals) document.spamSignals = spamSignals
  if (idempotencyKeyHash) document.idempotencyKeyHash = idempotencyKeyHash

  // The unique index on referenceCode is the arbiter; a check-then-insert
  // would race.
  return withUniqueReference(
    (referenceCode) => Inquiry.create({ ...document, referenceCode }),
    { prefix: config.inquiry.referencePrefix, year: now.getFullYear() }
  )
}

export async function listInquiries({ filter, sort, page, limit }) {
  const skip = (page - 1) * limit

  // No `.select('+internalNotes')` anywhere near a list query, and `.lean()`
  // is safe here only because the serializer is an explicit allowlist.
  const [items, total] = await Promise.all([
    Inquiry.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('assignedToUserId', 'fullName role')
      .lean(),
    Inquiry.countDocuments(filter),
  ])

  return { items, total }
}

export async function findInquiryForStaff(id) {
  const objectId = asObjectId(id)
  if (!objectId) throw ApiError.notFound('That inquiry does not exist.')

  const inquiry = await Inquiry.findById(objectId)
    .select(PRIVATE_CRM_FIELDS)
    .populate('assignedToUserId', 'fullName role')
    .populate('userId', 'fullName role')
    .populate('internalNotes.authorUserId', 'fullName role')
    .populate('statusHistory.changedByUserId', 'fullName role')
    .populate('trip.packageId', 'title slug')
    .populate('trip.guideId', 'fullName slug')
    .populate('trip.fixedDepartureId', 'startDate status')
    .lean()

  if (!inquiry) throw ApiError.notFound('That inquiry does not exist.')
  return inquiry
}

// Moves the status, atomically.
//
// The filter includes the status the caller believed was current. If somebody
// else changed it first, the update matches nothing and this reports a
// conflict rather than silently overwriting their transition and losing the
// history entry they just wrote.
export async function changeStatus(id, { fromStatus, toStatus, actorUserId, reason }) {
  const objectId = asObjectId(id)
  if (!objectId) throw ApiError.notFound('That inquiry does not exist.')

  if (!isInquiryStatus(toStatus)) throw ApiError.badRequest('That is not a valid status.')
  // Reserved for booking conversion. No human picks it.
  if (toStatus === CONVERTED_STATUS) {
    throw ApiError.badRequest('An inquiry becomes converted when a booking is created, not by hand.')
  }

  const current = await Inquiry.findById(objectId).select('status')
  if (!current) throw ApiError.notFound('That inquiry does not exist.')

  const expected = fromStatus || current.status
  if (!canTransition(expected, toStatus)) {
    throw ApiError.conflict(`An inquiry cannot move from "${expected}" to "${toStatus}".`)
  }

  const changedAt = new Date()
  const updated = await Inquiry.findOneAndUpdate(
    { _id: objectId, status: expected },
    {
      $set: { status: toStatus },
      $push: {
        statusHistory: {
          fromStatus: expected,
          toStatus,
          changedByUserId: actorUserId,
          changedAt,
          reason: reason ? toPlainText(reason).slice(0, 500) : '',
        },
      },
    },
    { new: true }
  ).select('status')

  if (!updated) {
    throw ApiError.conflict(
      'Somebody else changed this inquiry while you were working on it. Reload it and try again.'
    )
  }
  return updated
}

// The target's role is read from the database. A request body naming a role is
// irrelevant — and validation rejects it anyway.
export async function assignInquiry(id, assignedToUserId) {
  const objectId = asObjectId(id)
  if (!objectId) throw ApiError.notFound('That inquiry does not exist.')

  let target = null
  if (assignedToUserId !== null) {
    const targetId = asObjectId(assignedToUserId)
    if (!targetId) throw ApiError.badRequest('That is not a person we can assign.')

    target = await User.findById(targetId)
    if (!target) throw ApiError.badRequest('That is not a person we can assign.')
    if (target.status !== ACTIVE_USER_STATUS) {
      throw ApiError.badRequest('That account is suspended and cannot take new work.')
    }
    if (!ASSIGNABLE_ROLES.includes(target.role)) {
      throw ApiError.badRequest('That person does not work on inquiries.')
    }
  }

  const updated = await Inquiry.findByIdAndUpdate(
    objectId,
    { $set: { assignedToUserId: target?._id || null } },
    { new: true }
  ).select('assignedToUserId')

  if (!updated) throw ApiError.notFound('That inquiry does not exist.')
  return updated
}

export async function setFollowUp(id, followUpAt) {
  const objectId = asObjectId(id)
  if (!objectId) throw ApiError.notFound('That inquiry does not exist.')

  const updated = await Inquiry.findByIdAndUpdate(
    objectId,
    { $set: { followUpAt } },
    { new: true }
  ).select('followUpAt')

  if (!updated) throw ApiError.notFound('That inquiry does not exist.')
  return updated
}

export async function setPriority(id, priority) {
  if (!isInquiryPriority(priority)) throw ApiError.badRequest('That is not a valid priority.')

  const objectId = asObjectId(id)
  if (!objectId) throw ApiError.notFound('That inquiry does not exist.')

  const updated = await Inquiry.findByIdAndUpdate(
    objectId,
    { $set: { priority } },
    { new: true }
  ).select('priority')

  if (!updated) throw ApiError.notFound('That inquiry does not exist.')
  return updated
}

// Append only. There is no edit and no delete, so a note is a permanent record
// of what somebody knew at the time.
export async function addNote(id, { authorUserId, text }) {
  const objectId = asObjectId(id)
  if (!objectId) throw ApiError.notFound('That inquiry does not exist.')

  const updated = await Inquiry.findByIdAndUpdate(
    objectId,
    { $push: { internalNotes: { authorUserId, text, createdAt: new Date() } } },
    { new: true }
  ).select('_id')

  if (!updated) throw ApiError.notFound('That inquiry does not exist.')
  return updated
}

export { STAFF_ROLES }
export default {
  createInquiry,
  listInquiries,
  findInquiryForStaff,
  changeStatus,
  assignInquiry,
  setFollowUp,
  setPriority,
  addNote,
  findByIdempotencyHash,
}
