// A guide. Public profile fields and private staff fields in one document,
// separated by `select: false`.
//
// The frontend already enforces this split in
// frontend/src/lib/publicGuide.js, which projects a raw guide down to an
// allowlist before rendering. This schema mirrors that allowlist so the two
// cannot drift: anything private there is `select: false` here.
import mongoose, { Schema } from 'mongoose'
import { CONTENT_STATUSES, DEFAULT_CONTENT_STATUS } from '../../constants/contentStatuses.js'
import { GUIDE_TYPES } from '../../constants/packageTypes.js'
import {
  AVAILABILITY_STATUSES,
  DEFAULT_AVAILABILITY_STATUS,
  DEFAULT_VERIFICATION_STATUS,
  VERIFICATION_STATUSES,
} from '../../constants/verificationStatuses.js'
import { baseSchemaOptions } from '../../database/schemaOptions.js'
import {
  nonEmptyTextValidator,
  nonNegativeIntegerValidator,
  nonNegativeValidator,
  optionalUrlValidator,
  ratingValidator,
  slugValidator,
} from '../../database/validators.js'

const guideSchema = new Schema(
  {
    // Internal migration key. Private, like every other select:false field
    // below — grouped here at the top only because it identifies the record.
    sourceId: { type: String, trim: true, unique: true, sparse: true, select: false },

    // ---------------------------------------------------------------- public
    fullName: {
      type: String,
      required: [true, 'A guide needs a full name.'],
      trim: true,
      validate: nonEmptyTextValidator,
      maxlength: 200,
    },
    slug: {
      type: String,
      required: [true, 'A guide needs a slug.'],
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
      validate: slugValidator,
    },
    photo: { type: String, trim: true, validate: optionalUrlValidator },
    bio: { type: String, trim: true, maxlength: 5000 },
    guideType: {
      type: String,
      enum: { values: GUIDE_TYPES, message: '"{VALUE}" is not a valid guide type.' },
    },
    languages: { type: [String], default: () => [] },
    regions: { type: [String], default: () => [] },
    experienceYears: { type: Number, validate: nonNegativeIntegerValidator },
    // Aggregate over published reviews. Like package.reviewsSummary this is
    // cached display data, recomputed server-side — never client-supplied.
    rating: { type: Number, default: 0, validate: ratingValidator },
    totalReviews: { type: Number, default: 0, validate: nonNegativeIntegerValidator },
    summitsOrTrips: { type: String, trim: true, maxlength: 300 },

    // --------------------------------------------------------------- private
    // Every field below is select:false, so an ordinary find() cannot return
    // it and the JSON transform never sees it.

    // A day rate is commercially sensitive and is not shown on a public profile.
    pricePerDay: { type: Number, select: false, validate: nonNegativeValidator },
    currency: { type: String, trim: true, uppercase: true, maxlength: 3, select: false },
    priceBasis: { type: String, trim: true, maxlength: 60, select: false },

    // Licence and certification names. docs/DATA_MODEL.md records the decision
    // to keep these private; the public profile shows only a verified badge.
    //
    // Deliberately no default. A `select: false` field with a default still
    // materialises on a newly constructed document, so it would appear as an
    // empty array in JSON before the document had ever been saved. Leaving it
    // undefined keeps "private means absent" true in both directions.
    certifications: { type: [String], select: false },

    // The raw value is private. Public output exposes a derived boolean only,
    // matching toPublicGuide()'s `isVerified`.
    verificationStatus: {
      type: String,
      enum: { values: VERIFICATION_STATUSES, message: '"{VALUE}" is not a valid verification status.' },
      default: DEFAULT_VERIFICATION_STATUS,
      select: false,
    },
    availabilityStatus: {
      type: String,
      enum: { values: AVAILABILITY_STATUSES, message: '"{VALUE}" is not a valid availability status.' },
      default: DEFAULT_AVAILABILITY_STATUS,
      select: false,
    },
    internalNotes: { type: String, trim: true, maxlength: 5000, select: false },

    // ------------------------------------------------------------ visibility
    // A guide is publicly listed only when publicProfile is true AND status is
    // published — both, as the frontend requires.
    publicProfile: { type: Boolean, default: false, select: false },
    status: {
      type: String,
      enum: { values: CONTENT_STATUSES, message: '"{VALUE}" is not a valid content status.' },
      default: DEFAULT_CONTENT_STATUS,
      select: false,
      index: true,
    },
  },
  baseSchemaOptions
)

guideSchema.index({ status: 1, publicProfile: 1 })

// NOT STORED HERE, and must never be: passport or identity documents, licence
// scans, bank details, or any payment information. Verification document
// metadata belongs in a separate private collection with its own access rules
// when guide verification storage is implemented.

const Guide = mongoose.models.Guide || mongoose.model('Guide', guideSchema, 'guides')

export default Guide
