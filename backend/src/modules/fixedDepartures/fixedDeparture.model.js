// A scheduled group departure of a trip, with seats.
import mongoose, { Schema } from 'mongoose'
import {
  DEFAULT_DEPARTURE_STATUS,
  DEPARTURE_STATUSES,
} from '../../constants/departureStatuses.js'
import { baseSchemaOptions } from '../../database/schemaOptions.js'
import {
  nonNegativeIntegerValidator,
  nonNegativeValidator,
} from '../../database/validators.js'

const fixedDepartureSchema = new Schema(
  {
    // Internal migration key only: the id the record had in the frontend seed
    // (e.g. "pkg-001"). It makes seeding idempotent and lets the reset script
    // target migrated records without touching owner-created ones.
    //
    // select:false plus the JSON transform means it can never reach a public
    // response. It is NOT the public identifier — that is always `id`.
    // Sparse, so records created later by an admin need no sourceId at all.
    sourceId: { type: String, trim: true, unique: true, sparse: true, select: false },
    packageId: {
      type: Schema.Types.ObjectId,
      ref: 'Package',
      required: [true, 'A departure must belong to a trip.'],
    },
    title: { type: String, trim: true, maxlength: 300 },

    startDate: { type: Date, required: [true, 'A departure needs a start date.'] },
    endDate: { type: Date, required: [true, 'A departure needs an end date.'] },
    // The frontend field is durationDays, not duration.
    durationDays: { type: Number, validate: nonNegativeIntegerValidator },

    totalSeats: {
      type: Number,
      required: [true, 'A departure needs a total seat count.'],
      validate: nonNegativeIntegerValidator,
    },
    bookedSeats: { type: Number, default: 0, validate: nonNegativeIntegerValidator },

    price: { type: Number, validate: nonNegativeValidator },
    // Additive, matching Package. The frontend treats stored prices as USD.
    currency: { type: String, trim: true, uppercase: true, default: 'USD', maxlength: 3 },

    status: {
      type: String,
      enum: { values: DEPARTURE_STATUSES, message: '"{VALUE}" is not a valid departure status.' },
      default: DEFAULT_DEPARTURE_STATUS,
      index: true,
    },
    guaranteed: { type: Boolean, default: false },

    assignedGuideIds: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Guide' }],
      default: () => [],
    },

    // Operational notes for staff. Never loaded unless a query asks for it, so
    // it cannot reach a public response by accident.
    internalNotes: { type: String, trim: true, maxlength: 5000, select: false },
  },
  baseSchemaOptions
)

// A trip cannot end before it starts.
fixedDepartureSchema.pre('validate', function checkDateOrder(next) {
  if (this.startDate && this.endDate && this.endDate < this.startDate) {
    this.invalidate('endDate', 'endDate cannot be earlier than startDate.')
  }
  next()
})

// Seats sold cannot exceed seats that exist.
fixedDepartureSchema.pre('validate', function checkSeats(next) {
  const { totalSeats, bookedSeats } = this
  if (
    typeof totalSeats === 'number' &&
    typeof bookedSeats === 'number' &&
    bookedSeats > totalSeats
  ) {
    this.invalidate(
      'bookedSeats',
      `bookedSeats (${bookedSeats}) cannot exceed totalSeats (${totalSeats}).`
    )
  }
  next()
})

// Derived, never stored — one number cannot drift from the other two.
// Clamped at zero so a bad write can never surface a negative seat count to a
// visitor.
fixedDepartureSchema.virtual('seatsLeft').get(function seatsLeft() {
  const total = typeof this.totalSeats === 'number' ? this.totalSeats : 0
  const booked = typeof this.bookedSeats === 'number' ? this.bookedSeats : 0
  return Math.max(0, total - booked)
})

// Departure lists are read per trip in date order, and the public list reads
// bookable statuses in date order.
fixedDepartureSchema.index({ packageId: 1, startDate: 1 })
fixedDepartureSchema.index({ status: 1, startDate: 1 })

// SEAT CONCURRENCY, deferred by design.
//
// Two people reserving the last seat at the same moment is a real race, and
// read-then-write in application code cannot fix it. When reservation is built
// it must be a single atomic update guarded by the seat count, e.g.
//
//   updateOne(
//     { _id, $expr: { $lte: [{ $add: ['$bookedSeats', n] }, '$totalSeats'] } },
//     { $inc: { bookedSeats: n } }
//   )
//
// with a transaction where a booking is written in the same step. This model
// intentionally contains no reservation-write logic.

const FixedDeparture =
  mongoose.models.FixedDeparture ||
  mongoose.model('FixedDeparture', fixedDepartureSchema, 'fixeddepartures')

export default FixedDeparture
