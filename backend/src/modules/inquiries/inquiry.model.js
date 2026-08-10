// One collection behind every public form on the site.
//
// The frontend already funnels package inquiries, custom trips, contact
// messages, callback requests, and guide requests through a single
// `createInquiry` call with a `type` field. This mirrors that: one record
// shape, one CRM queue, one place to get privacy right — instead of five
// near-identical collections that drift apart.
//
// Flat frontend fields are grouped into typed subdocuments here. Nothing uses
// Mongoose `Mixed`: a public endpoint writing into an untyped object is how a
// request body ends up storing whatever it likes.
import mongoose, { Schema } from 'mongoose'
import { DEFAULT_INQUIRY_PRIORITY, INQUIRY_PRIORITIES } from '../../constants/inquiryPriorities.js'
import { DEFAULT_INQUIRY_SOURCE, INQUIRY_SOURCES } from '../../constants/inquirySources.js'
import { DEFAULT_INQUIRY_STATUS, INQUIRY_STATUSES } from '../../constants/inquiryStatuses.js'
import { INQUIRY_TYPES } from '../../constants/inquiryTypes.js'
import { baseSchemaOptions, embeddedSchemaOptions } from '../../database/schemaOptions.js'

// Who is asking, and how to reach them.
//
// Every contact route is optional individually — the callback form collects a
// phone and no email, the contact form the reverse. That "at least one of
// them" rule is enforced in validation, where it can produce a readable error,
// rather than here where it would only produce a schema failure.
const contactSchema = new Schema(
  {
    fullName: { type: String, required: true, trim: true, maxlength: 200 },
    email: { type: String, trim: true, lowercase: true, maxlength: 254, default: '' },
    phone: { type: String, trim: true, maxlength: 40, default: '' },
    whatsapp: { type: String, trim: true, maxlength: 40, default: '' },
    country: { type: String, trim: true, maxlength: 100, default: '' },
    language: { type: String, trim: true, maxlength: 40, default: '' },
    nationality: { type: String, trim: true, maxlength: 100, default: '' },
    preferredContactMethod: {
      type: String,
      enum: { values: ['email', 'phone', 'whatsapp', ''], message: '"{VALUE}" is not a contact method.' },
      default: '',
    },
  },
  embeddedSchemaOptions
)

// What they want to do. All optional: a contact message has none of it, a
// package inquiry has most of it.
const tripSchema = new Schema(
  {
    packageId: { type: Schema.Types.ObjectId, ref: 'Package', default: null },
    fixedDepartureId: { type: Schema.Types.ObjectId, ref: 'FixedDeparture', default: null },
    guideId: { type: Schema.Types.ObjectId, ref: 'Guide', default: null },
    destinationInterest: { type: String, trim: true, maxlength: 200, default: '' },
    travelDate: { type: Date, default: null },
    flexibleDates: { type: String, trim: true, maxlength: 40, default: '' },
    numberOfPeople: { type: Number, min: 1, default: null },
    budgetRange: { type: String, trim: true, maxlength: 60, default: '' },
    tripType: { type: String, trim: true, maxlength: 60, default: '' },
    guideLanguage: { type: String, trim: true, maxlength: 60, default: '' },
    hotelNeeded: { type: String, trim: true, maxlength: 20, default: '' },
    transportNeeded: { type: String, trim: true, maxlength: 20, default: '' },
  },
  embeddedSchemaOptions
)

// Copied from the database at submission time, never from the browser.
//
// A staff member reading a six-month-old inquiry needs to know which trip was
// being discussed even if it has since been renamed or unpublished. Trusting a
// browser-supplied title would let anyone write "Everest Expedition — $50" into
// the CRM.
const snapshotSchema = new Schema(
  {
    packageTitle: { type: String, trim: true, maxlength: 200, default: '' },
    packageSlug: { type: String, trim: true, maxlength: 200, default: '' },
    departureDate: { type: Date, default: null },
    guideName: { type: String, trim: true, maxlength: 200, default: '' },
  },
  embeddedSchemaOptions
)

// Callback requests only. Stored as typed text rather than a parsed time,
// because "any afternoon" is a legitimate answer and a Date cannot hold it.
const callbackSchema = new Schema(
  {
    preferredDate: { type: Date, default: null },
    preferredTime: { type: String, trim: true, maxlength: 60, default: '' },
    timezone: { type: String, trim: true, maxlength: 60, default: '' },
  },
  embeddedSchemaOptions
)

// Recorded at submission. The time and the policy version come from the
// server: a consent record the client could backdate or misattribute is not a
// consent record.
const consentSchema = new Schema(
  {
    accepted: { type: Boolean, required: true },
    acceptedAt: { type: Date, required: true },
    privacyPolicyVersion: { type: String, required: true, trim: true, maxlength: 60 },
  },
  embeddedSchemaOptions
)

// Append-only. There is no edit or delete endpoint, so a note is a permanent
// record of what somebody knew and when.
const internalNoteSchema = new Schema(
  {
    authorUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true, trim: true, maxlength: 20000 },
    createdAt: { type: Date, required: true },
  },
  embeddedSchemaOptions
)

// Append-only too, and for a stronger reason: this is the audit trail. If it
// could be rewritten it would prove nothing.
const statusChangeSchema = new Schema(
  {
    fromStatus: { type: String, enum: INQUIRY_STATUSES, default: null },
    toStatus: { type: String, enum: INQUIRY_STATUSES, required: true },
    // Null for the initial record: the public submission had no staff actor.
    changedByUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    changedAt: { type: Date, required: true },
    reason: { type: String, trim: true, maxlength: 500, default: '' },
  },
  embeddedSchemaOptions
)

// Machine-readable flags only. Deliberately not a copy of the submission:
// storing the payload again "for spam analysis" doubles the personal data at
// rest and doubles what a breach would expose.
const spamSignalsSchema = new Schema(
  {
    honeypotTriggered: { type: Boolean, default: false },
    fastSubmission: { type: Boolean, default: false },
    discarded: { type: Boolean, default: false },
  },
  embeddedSchemaOptions
)

// What little is worth keeping about how a submission arrived.
//
// No IP address: it is personal data under GDPR, it identifies a household,
// and the current inquiry scope does not need it. No session id, no cookie, no CSRF token —
// storing an authentication artefact next to the data it protects turns one
// leak into two.
const submissionMetadataSchema = new Schema(
  {
    // Coarse only: the locale the browser asked for, capped hard.
    acceptLanguage: { type: String, trim: true, maxlength: 60, default: '' },
    submittedAt: { type: Date, default: null },
  },
  embeddedSchemaOptions
)

const inquirySchema = new Schema(
  {
    // The only identifier a person ever sees. Generated server-side; a request
    // body supplying one is ignored, never trusted.
    referenceCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      uppercase: true,
      maxlength: 40,
    },

    type: {
      type: String,
      required: true,
      enum: { values: INQUIRY_TYPES, message: '"{VALUE}" is not a valid inquiry type.' },
      index: true,
    },

    status: {
      type: String,
      required: true,
      enum: { values: INQUIRY_STATUSES, message: '"{VALUE}" is not a valid status.' },
      default: DEFAULT_INQUIRY_STATUS,
      index: true,
    },

    priority: {
      type: String,
      required: true,
      enum: { values: INQUIRY_PRIORITIES, message: '"{VALUE}" is not a valid priority.' },
      default: DEFAULT_INQUIRY_PRIORITY,
      index: true,
    },

    source: {
      type: String,
      required: true,
      enum: { values: INQUIRY_SOURCES, message: '"{VALUE}" is not a valid source.' },
      default: DEFAULT_INQUIRY_SOURCE,
    },

    // Set only from an authenticated session, never from the request body —
    // otherwise anyone could file an inquiry against somebody else's account.
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },

    contact: { type: contactSchema, required: true },
    trip: { type: tripSchema, default: () => ({}) },
    snapshot: { type: snapshotSchema, default: () => ({}) },

    subject: { type: String, trim: true, maxlength: 300, default: '' },
    message: { type: String, trim: true, maxlength: 20000, default: '' },
    specialRequest: { type: String, trim: true, maxlength: 20000, default: '' },

    callback: { type: callbackSchema, default: () => ({}) },
    consent: { type: consentSchema, required: true },

    // ------------------------------------------------------------------ CRM
    assignedToUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    followUpAt: { type: Date, default: null, index: true },

    // Private: staff-only, and never sent to the person who submitted.
    internalNotes: { type: [internalNoteSchema], default: undefined, select: false },
    statusHistory: { type: [statusChangeSchema], default: undefined, select: false },

    // Written by booking conversion. No CRM route sets it.
    convertedBookingId: { type: Schema.Types.ObjectId, default: null },

    // ------------------------------------------------------------- internal
    // A hash, never the raw key. Sparse so the unique index ignores the many
    // submissions that carry no key at all.
    idempotencyKeyHash: {
      type: String,
      default: undefined,
      select: false,
      unique: true,
      sparse: true,
    },
    spamSignals: { type: spamSignalsSchema, default: undefined, select: false },
    submissionMetadata: { type: submissionMetadataSchema, default: undefined, select: false },
  },
  baseSchemaOptions
)

// The CRM's default view is "newest first, filtered by status", and the
// follow-up queue is "what is due". Both deserve an index.
inquirySchema.index({ status: 1, createdAt: -1 })
inquirySchema.index({ assignedToUserId: 1, followUpAt: 1 })

const Inquiry = mongoose.models.Inquiry || mongoose.model('Inquiry', inquirySchema, 'inquiries')

export default Inquiry
