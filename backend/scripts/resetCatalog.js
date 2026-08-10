// Removes ONLY migrated records — documents that carry a sourceId.
//
//   npm run seed:catalog:reset
//
// Anything an admin created later has no sourceId and is left alone. This
// never drops a database or a collection.
import { connectDatabase, disconnectDatabase } from '../src/config/database.js'
import loadEnv from '../src/config/env.js'
import Activity from '../src/modules/activities/activity.model.js'
import Destination from '../src/modules/destinations/destination.model.js'
import FixedDeparture from '../src/modules/fixedDepartures/fixedDeparture.model.js'
import Guide from '../src/modules/guides/guide.model.js'
import Package from '../src/modules/packages/package.model.js'
import Review from '../src/modules/reviews/review.model.js'

// Reverse dependency order, so a referenced record outlives its referrer.
const MODELS = [
  ['reviews', Review],
  ['fixedDepartures', FixedDeparture],
  ['packages', Package],
  ['guides', Guide],
  ['activities', Activity],
  ['destinations', Destination],
]

// The only filter used anywhere in this script.
const MIGRATED_ONLY = { sourceId: { $exists: true, $ne: null } }

async function main() {
  // Seeding does not start the Express auth stack, so session and auth
  // variables are not required here.
  const config = loadEnv(process.env, { requireAuthConfig: false })

  if (!config.allowDestructiveSeed) {
    console.error('Refusing to reset the catalogue.')
    console.error('ALLOW_DESTRUCTIVE_SEED is not "true". Nothing was deleted.')
    process.exit(1)
  }
  // Production needs both switches, not one.
  if (config.isProduction && !config.allowSeedInProduction) {
    console.error('Refusing to reset a production catalogue.')
    console.error('NODE_ENV is "production" and ALLOW_SEED_IN_PRODUCTION is not "true".')
    console.error('Nothing was deleted.')
    process.exit(1)
  }

  await connectDatabase(config.mongodbUri)

  try {
    console.log('Records that will be removed (migrated only):\n')
    let total = 0
    for (const [name, Model] of MODELS) {
      const count = await Model.countDocuments(MIGRATED_ONLY)
      const kept = await Model.countDocuments({ sourceId: { $exists: false } })
      console.log(`  ${name.padEnd(18)} remove ${String(count).padStart(4)}   keep ${String(kept).padStart(4)} (no sourceId)`)
      total += count
    }

    if (total === 0) {
      console.log('\nNothing to remove.')
      return
    }

    console.log('')
    for (const [name, Model] of MODELS) {
      const result = await Model.deleteMany(MIGRATED_ONLY)
      console.log(`  removed ${String(result.deletedCount).padStart(4)} from ${name}`)
    }
    console.log(`\nRemoved ${total} migrated record(s). Owner-created records were not touched.`)
  } finally {
    await disconnectDatabase()
  }
}

main().catch((error) => {
  console.error('\nReset failed.\n')
  console.error(error.message)
  process.exit(1)
})
