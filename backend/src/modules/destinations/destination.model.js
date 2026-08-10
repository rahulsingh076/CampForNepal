// A place in Nepal a trip can visit. Field names match the frontend seed
// exactly, so the eventual dataClient swap needs no component change.
import mongoose, { Schema } from 'mongoose'
import { CONTENT_STATUSES, DEFAULT_CONTENT_STATUS } from '../../constants/contentStatuses.js'
import { galleryField, mapInfoSchema, mediaArrayField, mediaField, seoSchema } from '../../database/schemaHelpers.js'
import { baseSchemaOptions } from '../../database/schemaOptions.js'
import { nonEmptyTextValidator, slugValidator } from '../../database/validators.js'

const destinationSchema = new Schema(
  {
    // Internal migration key only: the id the record had in the frontend seed
    // (e.g. "pkg-001"). It makes seeding idempotent and lets the reset script
    // target migrated records without touching owner-created ones.
    //
    // select:false plus the JSON transform means it can never reach a public
    // response. It is NOT the public identifier — that is always `id`.
    // Sparse, so records created later by an admin need no sourceId at all.
    sourceId: { type: String, trim: true, unique: true, sparse: true, select: false },
    title: {
      type: String,
      required: [true, 'A destination needs a title.'],
      trim: true,
      validate: nonEmptyTextValidator,
      maxlength: 200,
    },
    slug: {
      type: String,
      required: [true, 'A destination needs a slug.'],
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
      validate: slugValidator,
    },
    // Required in the seed: every destination carries one, and the listing
    // page groups by it.
    region: {
      type: String,
      required: [true, 'A destination needs a region.'],
      trim: true,
      maxlength: 200,
    },
    shortDescription: { type: String, trim: true, maxlength: 600 },
    fullDescription: { type: String, trim: true, maxlength: 20000 },

    coverImage: mediaField(),
    heroMedia: mediaField(),
    gallery: galleryField(),
    videos: mediaArrayField(),
    seasonalMedia: mediaArrayField(),
    beforeAfterMedia: mediaArrayField(),
    bestSeason: { type: [String], default: () => [] },

    mapInfo: { type: mapInfoSchema, default: () => ({}) },

    // String model names avoid a circular import between the catalogue models.
    relatedPackageIds: { type: [{ type: Schema.Types.ObjectId, ref: 'Package' }], default: () => [] },
    relatedGuideIds: { type: [{ type: Schema.Types.ObjectId, ref: 'Guide' }], default: () => [] },

    seo: { type: seoSchema, default: () => ({}) },

    status: {
      type: String,
      enum: { values: CONTENT_STATUSES, message: '"{VALUE}" is not a valid content status.' },
      default: DEFAULT_CONTENT_STATUS,
      index: true,
    },
  },
  baseSchemaOptions
)

// Public listings read published destinations by region; the compound index
// covers the common filter without a second single-field index on region.
destinationSchema.index({ status: 1, region: 1 })

// The frontend seed has no `featured` flag on destinations — unlike packages —
// so none is invented here. Adding one later is additive and safe.

const Destination =
  mongoose.models.Destination || mongoose.model('Destination', destinationSchema, 'destinations')

export default Destination
