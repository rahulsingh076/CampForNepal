// Builds the Express application. It never calls listen() — server.js owns the
// process lifecycle — which keeps the app importable by a test without opening
// a port.
import express from 'express'
import helmet from 'helmet'
import corsMiddleware from './config/cors.js'
import { buildSessionMiddleware } from './config/session.js'
import csrfProtection from './middleware/csrfProtection.js'
import errorHandler from './middleware/errorHandler.js'
import notFound from './middleware/notFound.js'
import requestContext from './middleware/requestContext.js'
import sessionTimeout from './middleware/sessionTimeout.js'
import createApiRouter from './routes/index.js'
import { sendSuccess } from './utils/response.js'

export default function createApp(config) {
  const app = express()

  // Do not advertise the framework.
  app.disable('x-powered-by')

  // A count of proxy hops, never `true`. Blanket-trusting the whole chain lets
  // any client spoof X-Forwarded-For, which would defeat IP rate limiting and
  // send a Secure cookie decision the wrong way.
  app.set('trust proxy', config.trustProxyHops ?? 0)

  // Controllers read pagination limits from here rather than importing config,
  // which keeps them free of module-level state and easy to call in a test.
  app.locals.config = config

  // First, so every later middleware and every error can quote the request id.
  app.use(requestContext)

  app.use(helmet())
  app.use(corsMiddleware(config.corsOrigins))

  app.use(express.json({ limit: config.requestBodyLimit }))
  app.use(express.urlencoded({ extended: true, limit: config.requestBodyLimit }))

  // Sessions come after body parsing and before anything that reads a user.
  // The store is kept so server.js can close it during shutdown — an open
  // handle there is what leaves a process hanging after the port is released.
  const { middleware: sessionMiddleware, store: sessionStore } = buildSessionMiddleware(config)
  app.locals.sessionStore = sessionStore
  app.use(sessionMiddleware)
  // Idle and absolute limits, enforced server-side on every request.
  app.use(sessionTimeout(config))
  // Global, so a state-changing route added later cannot forget it. Safe
  // methods pass straight through, which keeps the public catalogue open.
  app.use(csrfProtection)

  // A friendly root, so hitting the host directly explains where the API lives.
  app.get('/', (_req, res) =>
    sendSuccess(res, {
      message: 'Camp For Nepal API.',
      data: {
        name: 'camp-for-nepal-backend',
        apiPrefix: config.apiPrefix,
        health: `${config.apiPrefix}/health`,
      },
    })
  )

  app.use(config.apiPrefix, createApiRouter(config))

  // Order matters: unmatched requests become a 404 ApiError, and the error
  // handler is last so everything above it funnels into one response shape.
  app.use(notFound)
  app.use(errorHandler(config.isProduction))

  return app
}
