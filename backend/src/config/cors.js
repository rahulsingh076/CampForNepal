// CORS policy built from the configured allowlist.
//
// A browser sends an Origin header on cross-origin requests. Anything without
// one — curl, a health monitor, a mobile app, another server — is not subject
// to the same-origin policy in the first place, so it is allowed through. CORS
// is a browser protection, not an authorisation mechanism; route middleware
// owns access control.
import cors from 'cors'

export function buildCorsOptions(allowedOrigins) {
  return {
    origin(origin, callback) {
      if (!origin) return callback(null, true)
      if (allowedOrigins.includes(origin)) return callback(null, true)

      // The message reaches the server log, never the browser: a rejected
      // preflight simply arrives without the allow header.
      return callback(new Error(`Origin not allowed by CORS: ${origin}`))
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    // X-CSRF-Token must be listed, or the preflight refuses the header the
    // CSRF check depends on.
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id', 'X-CSRF-Token'],
    exposedHeaders: ['X-Request-Id'],
    maxAge: 600,
  }
}

export default function corsMiddleware(allowedOrigins) {
  return cors(buildCorsOptions(allowedOrigins))
}
