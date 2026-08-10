// MongoDB connection lifecycle.
//
// The URI carries credentials, so it is never logged and never included in an
// error that could reach a client. Connection failures surface as a plain
// sentence plus the host, which is enough to debug without leaking a password.
import mongoose from 'mongoose'

// Mongoose 7+ already ignores unknown fields; keeping strict query behaviour
// explicit means a later upgrade cannot silently change how filters behave.
mongoose.set('strictQuery', true)

const STATES = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
}

export function databaseState() {
  return STATES[mongoose.connection.readyState] || 'unknown'
}

export function isDatabaseConnected() {
  return mongoose.connection.readyState === 1
}

// Strips credentials so a connection problem can be reported without exposing
// the password embedded in the URI.
function safeTarget(uri) {
  try {
    const parsed = new URL(uri)
    return `${parsed.protocol}//${parsed.host}${parsed.pathname}`
  } catch {
    return 'the configured MongoDB host'
  }
}

export async function connectDatabase(uri) {
  try {
    await mongoose.connect(uri, {
      // Fail fast at boot rather than hanging for the 30s default.
      serverSelectionTimeoutMS: 8000,
    })
    return mongoose.connection
  } catch (error) {
    throw new Error(
      `Could not connect to MongoDB at ${safeTarget(uri)}. ` +
        `Check that the server is running and MONGODB_URI is correct. (${error.message})`
    )
  }
}

export async function disconnectDatabase() {
  if (mongoose.connection.readyState === 0) return
  await mongoose.disconnect()
}

export default connectDatabase
