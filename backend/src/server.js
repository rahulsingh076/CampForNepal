// Process lifecycle: validate configuration, connect the database, listen, and
// shut down cleanly. Nothing starts serving until the database is reachable, so
// the API never answers requests it cannot fulfil.
import { createServer } from 'node:http'
import createApp from './app.js'
import { connectDatabase, disconnectDatabase } from './config/database.js'
import loadEnv from './config/env.js'

async function start() {
  // Throws with the full list of problems if anything is missing or malformed.
  const config = loadEnv()

  // Before listen, deliberately: a server that accepts traffic without a
  // database just turns every request into a 500.
  await connectDatabase(config.mongodbUri)
  console.log('MongoDB connected.')

  const app = createApp(config)
  const server = createServer(app)

  await new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(config.port, () => {
      server.removeListener('error', reject)
      resolve()
    })
  })

  const base = `http://localhost:${config.port}`
  console.log(`Camp For Nepal API listening in ${config.nodeEnv} mode`)
  console.log(`  Root:   ${base}/`)
  console.log(`  API:    ${base}${config.apiPrefix}`)
  console.log(`  Health: ${base}${config.apiPrefix}/health`)

  let shuttingDown = false

  async function shutdown(signal) {
    // A second Ctrl-C should not start a second teardown.
    if (shuttingDown) return
    shuttingDown = true
    console.log(`\n${signal} received, shutting down.`)

    // A connection that never finishes must not hold the process open forever.
    const forced = setTimeout(() => {
      console.error('Shutdown timed out. Forcing exit.')
      process.exit(1)
    }, config.shutdownTimeoutMs)
    forced.unref()

    try {
      await new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()))
      })
      // Before the database connection, since the store rides on it.
      await app.locals.sessionStore?.close()
      await disconnectDatabase()
      console.log('Closed cleanly.')
      process.exit(0)
    } catch (error) {
      console.error('Error while shutting down:', error.message)
      process.exit(1)
    }
  }

  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('SIGTERM', () => shutdown('SIGTERM'))
}

start().catch((error) => {
  // The one place a boot failure is reported. The message is written to be
  // actionable on its own; it never contains the MongoDB URI.
  console.error('\nCamp For Nepal API failed to start.')
  console.error(error.message)
  process.exit(1)
})
