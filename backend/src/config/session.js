// Server-side sessions, stored in MongoDB.
//
// The store is the important part. express-session's default MemoryStore leaks
// memory, cannot be shared between processes, and loses every session on
// restart — it prints a warning in production for good reason. Sessions live in
// the same MongoDB the rest of the app already uses, so no new service and no
// new credential is introduced.
//
// No user data is kept in the cookie. The cookie carries a signed session id
// and nothing else, so a stolen cookie cannot be decoded and a role cannot be
// edited client-side.
import MongoStore from 'connect-mongo'
import session from 'express-session'
import mongoose from 'mongoose'

export const SESSION_COLLECTION = 'sessions'

export function buildSessionStore(config) {
  return MongoStore.create({
    // Reuse the connection Mongoose already opened rather than dialling a
    // second one, which would double the connection count against Atlas.
    client: mongoose.connection.getClient(),
    collectionName: SESSION_COLLECTION,
    // The idle limit, enforced by MongoDB itself: a session nobody touches is
    // deleted even while the process is down. `rolling` pushes this forward on
    // every response, so an active session is not cut off mid-use. The
    // absolute limit is separate and lives in the session data.
    ttl: Math.floor(config.sessionIdleTimeoutMs / 1000),
    // Without this, every single request rewrites the session document.
    touchAfter: config.sessionTouchAfterSeconds,
    autoRemove: 'native',
    // Store the session as a real document, not a JSON string, so it can be
    // inspected and indexed.
    stringify: false,
  })
}

// Returns both the middleware and the store. The caller keeps the store so it
// can be closed during shutdown — an open change stream or timer there is
// exactly what leaves a process hanging after `server.close()`.
export function buildSessionMiddleware(config) {
  const store = buildSessionStore(config)

  const middleware = session({
    // Not "connect.sid": the default name advertises the framework.
    name: config.sessionCookieName,
    // An array rotates secrets. The first signs new cookies; the rest still
    // verify old ones, so a secret can be replaced without ending every
    // session at once.
    secret: config.sessionSecrets,
    store,
    // Only write when something actually changed.
    resave: false,
    // Do not create a session — or send a cookie — for an anonymous visitor
    // browsing the public catalogue. The CSRF endpoint saves its session
    // explicitly, which is the one intentional exception.
    saveUninitialized: false,
    // Refresh the cookie's expiry on each response, which is what makes the
    // idle timeout slide forward while someone is active.
    rolling: true,
    proxy: config.trustProxyHops > 0,
    cookie: {
      // Unreadable to JavaScript, so an XSS bug cannot exfiltrate the session.
      httpOnly: true,
      secure: config.sessionCookieSecure,
      sameSite: config.sessionCookieSameSite,
      path: '/',
      // The browser-side half of the idle timeout.
      maxAge: config.sessionIdleTimeoutMs,
    },
  })

  return { middleware, store }
}

// The attributes a cookie must be cleared with. `clearCookie` only removes a
// cookie when path, sameSite, and secure match the ones it was set with —
// otherwise the browser keeps the old one and the user stays "signed in".
export function sessionCookieOptions(config) {
  return {
    path: '/',
    httpOnly: true,
    secure: config.sessionCookieSecure,
    sameSite: config.sessionCookieSameSite,
  }
}

export default buildSessionMiddleware
