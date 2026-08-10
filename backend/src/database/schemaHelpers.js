// Schema fragments that genuinely repeat across models.
//
// Deliberately small. A helper for every field would hide ordinary Mongoose
// behaviour behind indirection and make each model harder to read, not easier.
import { Schema } from 'mongoose'
import { embeddedSchemaOptions } from './schemaOptions.js'
import {
  latitudeValidator,
  longitudeValidator,
  mediaArrayValidator,
  mediaItemValidator,
  nonEmptyTextValidator,
  nonNegativeValidator,
} from './validators.js'

// Shape matches the frontend's `seo` object exactly: metaTitle,
// metaDescription, keywords[].
export const seoSchema = new Schema(
  {
    metaTitle: { type: String, trim: true, maxlength: 200 },
    metaDescription: { type: String, trim: true, maxlength: 400 },
    keywords: { type: [String], default: () => [] },
  },
  embeddedSchemaOptions
)

export const mediaField = () => ({
  type: Schema.Types.Mixed,
  default: undefined,
  validate: mediaItemValidator,
})

// Legacy seed galleries are URL strings. New owner-entered media may be
// structured objects carrying captions, alt text, focal position, and credits.
// Mixed preserves both shapes while validation keeps unsafe URLs out.
export const mediaArrayField = () => ({
  type: [Schema.Types.Mixed],
  default: () => [],
  validate: mediaArrayValidator,
})

export const galleryField = mediaArrayField

// destinations.mapInfo
export const mapInfoSchema = new Schema(
  {
    latitude: { type: Number, validate: latitudeValidator },
    longitude: { type: Number, validate: longitudeValidator },
    elevationMetres: { type: Number, validate: nonNegativeValidator },
    nearestAirport: { type: String, trim: true, maxlength: 200 },
  },
  embeddedSchemaOptions
)

// packages.faq[]. Both halves are required: a question with no answer is worse
// than no FAQ entry at all.
export const faqSchema = new Schema(
  {
    question: {
      type: String,
      required: [true, 'An FAQ entry needs a question.'],
      trim: true,
      validate: nonEmptyTextValidator,
      maxlength: 500,
    },
    answer: {
      type: String,
      required: [true, 'An FAQ entry needs an answer.'],
      trim: true,
      validate: nonEmptyTextValidator,
      maxlength: 5000,
    },
  },
  embeddedSchemaOptions
)

// packages.itinerary[].
//
// `day` is deliberately Mixed. Twelve packages number their days, but pkg-009
// (the 60-day Everest expedition) groups phases and stores a range label such
// as '12-18'. docs/DATA_MODEL.md calls this out and instructs the UI to render
// it as a label and never do arithmetic on it. Forcing Number here would make
// that record unstorable.
export const itineraryDaySchema = new Schema(
  {
    day: { type: Schema.Types.Mixed, required: [true, 'An itinerary entry needs a day.'] },
    title: {
      type: String,
      required: [true, 'An itinerary entry needs a title.'],
      trim: true,
      validate: nonEmptyTextValidator,
      maxlength: 300,
    },
    description: { type: String, trim: true, maxlength: 5000 },
    elevationMetres: { type: Number, validate: nonNegativeValidator },
    walkingHours: { type: String, trim: true, maxlength: 100 },
    accommodation: { type: String, trim: true, maxlength: 300 },
    meals: { type: String, trim: true, maxlength: 300 },
    media: mediaArrayField(),
  },
  embeddedSchemaOptions
)
