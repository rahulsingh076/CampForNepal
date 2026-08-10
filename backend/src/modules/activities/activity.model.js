// Something a visitor can do — trekking, rafting, a wildlife safari.
import mongoose, { Schema } from 'mongoose'
import { CONTENT_STATUSES, DEFAULT_CONTENT_STATUS } from '../../constants/contentStatuses.js'
import { DIFFICULTY_LEVELS, normaliseDifficulty } from '../../constants/difficultyLevels.js'
import { galleryField, mediaArrayField, mediaField, seoSchema } from '../../database/schemaHelpers.js'
import { baseSchemaOptions } from '../../database/schemaOptions.js'
import { nonEmptyTextValidator, slugValidator } from '../../database/validators.js'

const activitySchema = new Schema(
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
      required: [true, 'An activity needs a title.'],
      trim: true,
      validate: nonEmptyTextValidator,
      maxlength: 200,
    },
    slug: {
      type: String,
      required: [true, 'An activity needs a slug.'],
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
      validate: slugValidator,
    },

    // Free text on purpose. The seed uses seven values (trekking, climbing,
    // wildlife, adventure, culture, wellness, scenic) but nothing in the
    // frontend treats them as a closed set, and an enum here would block an
    // editor from adding a category without a code change. Recorded in
    // docs/FRONTEND_FIELD_MAPPING.md.
    category: { type: String, trim: true, maxlength: 100, index: true },

    difficulty: {
      type: String,
      // Activities already store lowercase; packages do not. Normalising both
      // on write keeps one vocabulary in the database.
      set: normaliseDifficulty,
      enum: { values: DIFFICULTY_LEVELS, message: '"{VALUE}" is not a valid difficulty.' },
    },

    shortDescription: { type: String, trim: true, maxlength: 600 },
    fullDescription: { type: String, trim: true, maxlength: 20000 },

    bestSeason: { type: [String], default: () => [] },
    safetyNotes: { type: [String], default: () => [] },
    requiredPermits: { type: [String], default: () => [] },

    relatedDestinationIds: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Destination' }],
      default: () => [],
    },
    relatedPackageIds: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Package' }],
      default: () => [],
    },

    coverImage: mediaField(),
    heroMedia: mediaField(),
    gallery: galleryField(),
    videos: mediaArrayField(),
    seasonalMedia: mediaArrayField(),
    beforeAfterMedia: mediaArrayField(),
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

activitySchema.index({ status: 1, category: 1 })

const Activity =
  mongoose.models.Activity || mongoose.model('Activity', activitySchema, 'activities')

export default Activity
