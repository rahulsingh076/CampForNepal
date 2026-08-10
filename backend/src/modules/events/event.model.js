import mongoose, { Schema } from 'mongoose'
import {
  DEFAULT_EVENT_STATUS,
  EVENT_STATUSES,
} from '../../constants/eventStatuses.js'
import { mediaArrayField, mediaField, seoSchema } from '../../database/schemaHelpers.js'
import { baseSchemaOptions } from '../../database/schemaOptions.js'
import {
  isExternalHttpUrl,
  isSafeInternalPath,
  nonEmptyTextValidator,
  slugValidator,
} from '../../database/validators.js'

const eventSchema = new Schema(
  {
    sourceId: { type: String, trim: true, unique: true, sparse: true, select: false },
    title: {
      type: String,
      required: [true, 'An event needs a title.'],
      trim: true,
      validate: nonEmptyTextValidator,
      maxlength: 200,
    },
    slug: {
      type: String,
      required: [true, 'An event needs a slug.'],
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
      validate: slugValidator,
    },
    eventType: { type: String, trim: true, maxlength: 120, index: true },
    shortDescription: { type: String, trim: true, maxlength: 600 },
    fullDescription: { type: String, trim: true, maxlength: 20000 },
    startDateTime: { type: Date, required: [true, 'An event needs a start date and time.'], index: true },
    endDateTime: { type: Date, default: null },
    timezone: { type: String, trim: true, maxlength: 80, default: 'Asia/Kathmandu' },
    venueName: { type: String, trim: true, maxlength: 200 },
    address: { type: String, trim: true, maxlength: 500 },
    mapLink: {
      type: String,
      trim: true,
      maxlength: 1000,
      validate: { validator: (value) => !value || isExternalHttpUrl(value), message: 'Map link must be a safe external URL.' },
    },
    organizer: { type: String, trim: true, maxlength: 200 },
    coverMedia: mediaField(),
    gallery: mediaArrayField(),
    videos: mediaArrayField(),
    relatedPackageIds: { type: [{ type: Schema.Types.ObjectId, ref: 'Package' }], default: () => [] },
    relatedDestinationIds: { type: [{ type: Schema.Types.ObjectId, ref: 'Destination' }], default: () => [] },
    ctaLabel: { type: String, trim: true, maxlength: 100 },
    ctaLink: {
      type: String,
      trim: true,
      maxlength: 500,
      validate: {
        validator: (value) => !value || isSafeInternalPath(value) || isExternalHttpUrl(value),
        message: 'Event CTA link must be a safe site path or external URL.',
      },
    },
    status: {
      type: String,
      enum: { values: EVENT_STATUSES, message: '"{VALUE}" is not a valid event status.' },
      default: DEFAULT_EVENT_STATUS,
      index: true,
    },
    featured: { type: Boolean, default: false, index: true },
    seo: { type: seoSchema, default: () => ({}) },
  },
  baseSchemaOptions
)

eventSchema.pre('validate', function checkDates(next) {
  if (this.endDateTime && this.startDateTime && this.endDateTime < this.startDateTime) {
    this.invalidate('endDateTime', 'Event end cannot be before the start.')
  }
  next()
})

eventSchema.index({ status: 1, startDateTime: 1 })
eventSchema.index({ status: 1, featured: -1, startDateTime: 1 })

const Event = mongoose.models.Event || mongoose.model('Event', eventSchema, 'events')

export default Event
