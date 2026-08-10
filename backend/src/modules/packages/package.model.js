// A trip: tour, trek, or expedition. The largest model in the catalogue.
//
// Field names and nesting mirror the frontend seed exactly — duration.days,
// groupSize.min/max, maxElevationMetres — so a card that reads
// `item.duration.days` today keeps working against a real API.
import mongoose, { Schema } from 'mongoose'
import { CONTENT_STATUSES, DEFAULT_CONTENT_STATUS } from '../../constants/contentStatuses.js'
import { DIFFICULTY_LEVELS, normaliseDifficulty } from '../../constants/difficultyLevels.js'
import { PACKAGE_TYPES } from '../../constants/packageTypes.js'
import {
  faqSchema,
  galleryField,
  itineraryDaySchema,
  mediaArrayField,
  mediaField,
  seoSchema,
} from '../../database/schemaHelpers.js'
import { baseSchemaOptions, embeddedSchemaOptions } from '../../database/schemaOptions.js'
import {
  nonEmptyTextValidator,
  nonNegativeIntegerValidator,
  nonNegativeValidator,
  optionalNonNegativeValidator,
  optionalUrlValidator,
  ratingValidator,
  slugValidator,
} from '../../database/validators.js'

const durationSchema = new Schema(
  {
    days: { type: Number, validate: nonNegativeIntegerValidator },
    nights: { type: Number, validate: nonNegativeIntegerValidator },
  },
  embeddedSchemaOptions
)

const groupSizeSchema = new Schema(
  {
    min: { type: Number, validate: nonNegativeIntegerValidator },
    max: { type: Number, validate: nonNegativeIntegerValidator },
  },
  embeddedSchemaOptions
)

// Denormalised display aggregate, exactly as the frontend stores it.
//
// This is a CACHE, not the source of truth. docs/DATA_MODEL.md is explicit that
// it counts the whole review corpus, not the rows present in `reviews`. Once
// the Review model is live the authoritative figure is recomputed from
// published reviews — a future service must never accept these numbers from a
// client.
const reviewsSummarySchema = new Schema(
  {
    averageRating: { type: Number, validate: ratingValidator },
    totalReviews: { type: Number, validate: nonNegativeIntegerValidator },
  },
  embeddedSchemaOptions
)

const packageSchema = new Schema(
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
      required: [true, 'A trip needs a title.'],
      trim: true,
      validate: nonEmptyTextValidator,
      maxlength: 200,
    },
    slug: {
      type: String,
      required: [true, 'A trip needs a slug.'],
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
      validate: slugValidator,
    },

    type: {
      type: String,
      required: [true, 'A trip needs a type.'],
      enum: { values: PACKAGE_TYPES, message: '"{VALUE}" is not a valid trip type.' },
      index: true,
    },
    // Free text, like activity.category. The seed uses eleven values and
    // nothing treats them as a closed set.
    category: { type: String, trim: true, maxlength: 100 },
    region: { type: String, trim: true, maxlength: 200, index: true },

    destinationIds: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Destination' }],
      default: () => [],
    },
    activityIds: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Activity' }],
      default: () => [],
    },

    shortDescription: { type: String, trim: true, maxlength: 600 },
    overview: { type: String, trim: true, maxlength: 20000 },

    // A plain USD number, matching the frontend. Deliberately NOT restructured
    // into a money object: every price component reads `item.price` today.
    price: {
      type: Number,
      required: [true, 'A trip needs a price.'],
      validate: nonNegativeValidator,
    },
    discountPrice: { type: Number, default: null, validate: optionalNonNegativeValidator },

    // Additive forward-compatible fields. The frontend already reads an
    // optional `priceBasis` through priceBasisLabel() and falls back to
    // "per person", and formatPrice() treats stored prices as USD.
    currency: { type: String, trim: true, uppercase: true, default: 'USD', maxlength: 3 },
    priceBasis: { type: String, trim: true, maxlength: 60 },

    duration: { type: durationSchema, default: () => ({}) },
    difficulty: {
      type: String,
      set: normaliseDifficulty,
      enum: { values: DIFFICULTY_LEVELS, message: '"{VALUE}" is not a valid difficulty.' },
    },
    maxElevationMetres: { type: Number, validate: nonNegativeValidator },
    walkingPerDay: { type: String, trim: true, maxlength: 200 },
    accommodation: { type: String, trim: true, maxlength: 500 },
    meals: { type: String, trim: true, maxlength: 500 },
    bestSeason: { type: [String], default: () => [] },
    groupSize: { type: groupSizeSchema, default: () => ({}) },

    highlights: { type: [String], default: () => [] },
    itinerary: { type: [itineraryDaySchema], default: () => [] },
    costIncludes: { type: [String], default: () => [] },
    costExcludes: { type: [String], default: () => [] },
    gearList: { type: [String], default: () => [] },
    permits: { type: [String], default: () => [] },

    routeMap: { type: String, trim: true, validate: optionalUrlValidator },
    coverImage: mediaField(),
    heroMedia: mediaField(),
    gallery: galleryField(),
    videos: mediaArrayField(),
    seasonalMedia: mediaArrayField(),
    beforeAfterMedia: mediaArrayField(),
    faq: { type: [faqSchema], default: () => [] },

    reviewsSummary: { type: reviewsSummarySchema, default: () => ({}) },
    seo: { type: seoSchema, default: () => ({}) },

    status: {
      type: String,
      enum: { values: CONTENT_STATUSES, message: '"{VALUE}" is not a valid content status.' },
      default: DEFAULT_CONTENT_STATUS,
      index: true,
    },
    featured: { type: Boolean, default: false },
  },
  baseSchemaOptions
)

// A discount above the price is not a discount. Checked as a whole-document
// rule because it compares two fields.
packageSchema.pre('validate', function checkDiscount(next) {
  const hasDiscount = typeof this.discountPrice === 'number'
  if (hasDiscount && typeof this.price === 'number' && this.discountPrice > this.price) {
    this.invalidate(
      'discountPrice',
      `discountPrice (${this.discountPrice}) cannot be greater than price (${this.price}).`
    )
  }
  next()
})

// Numbered itinerary days must ascend. pkg-009 uses range labels such as
// '12-18' for grouped phases, so only entries that are genuinely numeric are
// compared — a mixed itinerary is valid, an out-of-order numeric one is not.
packageSchema.pre('validate', function checkItineraryOrder(next) {
  const numbered = (this.itinerary || [])
    .map((entry) => entry?.day)
    .filter((day) => typeof day === 'number' && Number.isFinite(day))

  for (let index = 1; index < numbered.length; index += 1) {
    if (numbered[index] <= numbered[index - 1]) {
      this.invalidate(
        'itinerary',
        `Itinerary days must increase. Day ${numbered[index]} follows day ${numbered[index - 1]}.`
      )
      break
    }
  }
  next()
})

// The homepage reads featured published trips; listings filter by type.
packageSchema.index({ status: 1, featured: -1 })
packageSchema.index({ status: 1, type: 1 })

const Package = mongoose.models.Package || mongoose.model('Package', packageSchema, 'packages')

export default Package
