// A customer review of a trip or a guide.
//
// Nothing here is public until an admin sets status to `published`. A future
// read service must filter on that — the schema stores state, it does not
// enforce visibility.
import mongoose, { Schema } from 'mongoose'
import {
  DEFAULT_REVIEW_STATUS,
  REVIEW_STATUSES,
} from '../../constants/verificationStatuses.js'
import { baseSchemaOptions } from '../../database/schemaOptions.js'
import { nonEmptyTextValidator } from '../../database/validators.js'

const reviewSchema = new Schema(
  {
    // Internal migration key only: the id the record had in the frontend seed
    // (e.g. "pkg-001"). It makes seeding idempotent and lets the reset script
    // target migrated records without touching owner-created ones.
    //
    // select:false plus the JSON transform means it can never reach a public
    // response. It is NOT the public identifier — that is always `id`.
    // Sparse, so records created later by an admin need no sourceId at all.
    sourceId: { type: String, trim: true, unique: true, sparse: true, select: false },
    customerName: {
      type: String,
      required: [true, 'A review needs the reviewer name.'],
      trim: true,
      validate: nonEmptyTextValidator,
      maxlength: 200,
    },
    // ISO country code, as in the seed.
    country: { type: String, trim: true, maxlength: 2, uppercase: true },

    rating: {
      type: Number,
      required: [true, 'A review needs a rating.'],
      // An individual review is 1-5. Only an aggregate may be 0.
      min: [1, 'A review rating cannot be below 1.'],
      max: [5, 'A review rating cannot be above 5.'],
    },
    title: { type: String, trim: true, maxlength: 300 },
    reviewText: {
      type: String,
      required: [true, 'A review needs its text.'],
      trim: true,
      validate: nonEmptyTextValidator,
      maxlength: 5000,
    },

    // Exactly one of these is set in the seed; the pre-validate hook below
    // enforces that a review points at something.
    packageId: { type: Schema.Types.ObjectId, ref: 'Package', default: null },
    guideId: { type: Schema.Types.ObjectId, ref: 'Guide', default: null },

    // Reserved for the Booking model, which does not exist yet. Deliberately
    // declared WITHOUT a `ref`: pointing at an unregistered model would make
    // any future populate() throw a MissingSchemaError. The ref belongs with
    // the future Booking model work. Recorded in docs/DATABASE_SCHEMA.md.
    bookingId: { type: Schema.Types.ObjectId, default: null },
    // Likewise reserved for the User model.
    userId: { type: Schema.Types.ObjectId, default: null },

    verifiedBooking: { type: Boolean, default: false },

    status: {
      type: String,
      enum: { values: REVIEW_STATUSES, message: '"{VALUE}" is not a valid review status.' },
      default: DEFAULT_REVIEW_STATUS,
      index: true,
    },
    featured: { type: Boolean, default: false },
    publishedAt: { type: Date, default: null },

    // A public reply from the company. Public when the review is published.
    adminReply: { type: String, trim: true, maxlength: 5000, default: null },
  },
  baseSchemaOptions
)

// A review of nothing cannot be displayed anywhere.
reviewSchema.pre('validate', function checkTarget(next) {
  if (!this.packageId && !this.guideId) {
    this.invalidate('packageId', 'A review must reference either a package or a guide.')
  }
  next()
})

// Public reads are "published reviews for this trip, newest first".
reviewSchema.index({ status: 1, packageId: 1, createdAt: -1 })
reviewSchema.index({ status: 1, guideId: 1, createdAt: -1 })

const Review = mongoose.models.Review || mongoose.model('Review', reviewSchema, 'reviews')

export default Review
