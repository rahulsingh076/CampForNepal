// A user account.
//
// Every security-sensitive field is `select: false`, and the shared JSON
// transform strips those paths regardless of how the document was loaded — so
// a hash or a lockout counter cannot reach a response even by mistake.
import mongoose, { Schema } from 'mongoose'
import { DEFAULT_ROLE, ROLES } from '../../constants/roles.js'
import { DEFAULT_USER_STATUS, USER_STATUSES } from '../../constants/userStatuses.js'
import { baseSchemaOptions, embeddedSchemaOptions } from '../../database/schemaOptions.js'
import { isValidEmail, normalizeEmail } from '../../utils/email.js'

// Locale choices, matching the frontend's concepts. Never required for auth.
const preferencesSchema = new Schema(
  {
    country: { type: String, trim: true, maxlength: 100 },
    language: { type: String, trim: true, maxlength: 20 },
    currency: { type: String, trim: true, maxlength: 10 },
  },
  embeddedSchemaOptions
)

const userSchema = new Schema(
  {
    fullName: {
      type: String,
      required: [true, 'A name is required.'],
      trim: true,
      minlength: [2, 'A name must be at least 2 characters.'],
      maxlength: [200, 'A name cannot be longer than 200 characters.'],
    },

    email: {
      type: String,
      required: [true, 'An email address is required.'],
      trim: true,
      // Only the normalised form is ever stored, so a lookup cannot miss an
      // account because of casing.
      set: normalizeEmail,
      unique: true,
      index: true,
      validate: {
        validator: isValidEmail,
        message: 'That does not look like an email address.',
      },
    },

    // Never accepted from a request body — the service hashes a password and
    // sets this itself.
    passwordHash: {
      type: String,
      required: [true, 'A password hash is required.'],
      select: false,
    },

    role: {
      type: String,
      required: true,
      enum: { values: ROLES, message: '"{VALUE}" is not a valid role.' },
      default: DEFAULT_ROLE,
      index: true,
    },

    status: {
      type: String,
      required: true,
      enum: { values: USER_STATUSES, message: '"{VALUE}" is not a valid account status.' },
      default: DEFAULT_USER_STATUS,
      index: true,
    },

    preferences: { type: preferencesSchema, default: () => ({}) },

    // Email delivery is intentionally external to the current auth flow; the
    // column exists so enforcement can be switched on without a migration.
    emailVerifiedAt: { type: Date, default: null },
    lastLoginAt: { type: Date, default: null },
    passwordChangedAt: { type: Date, default: null },

    // ------------------------------------------------- security counters
    // All private. These tell an attacker how close an account is to lockout.
    failedLoginAttempts: { type: Number, default: 0, min: 0, select: false },
    lockUntil: { type: Date, default: null, select: false },

    // Bumped on password change and logout-all. A session carrying an older
    // value is rejected, which is how "sign out everywhere" works without
    // enumerating sessions in the store.
    sessionVersion: { type: Number, default: 0, min: 0, select: false },
  },
  baseSchemaOptions
)

// True while a temporary lock is still in force. Expired locks simply stop
// matching, so no cleanup job is needed.
userSchema.methods.isLocked = function isLocked() {
  return Boolean(this.lockUntil && this.lockUntil.getTime() > Date.now())
}

const User = mongoose.models.User || mongoose.model('User', userSchema, 'users')

export default User
