// Imports the frontend catalogue into MongoDB. Idempotent: safe to re-run.
//
//   npm run seed:catalog
import { connectDatabase, disconnectDatabase } from '../src/config/database.js'
import loadEnv from '../src/config/env.js'
import seedCatalog from '../src/seeds/seedCatalog.js'

async function main() {
  // Seeding does not start the Express auth stack, so session and auth
  // variables are not required here.
  const config = loadEnv(process.env, { requireAuthConfig: false })

  console.log('Camp For Nepal — catalogue migration')
  console.log(`  environment: ${config.nodeEnv}`)
  console.log(`  frontend:    ${config.frontendRoot || '(not set)'}\n`)

  await connectDatabase(config.mongodbUri)

  try {
    const result = await seedCatalog(config)

    console.log('\nSummary')
    console.log('  entity            source   database')
    for (const entity of Object.keys(result.sourceCounts)) {
      console.log(
        `  ${entity.padEnd(18)}${String(result.sourceCounts[entity]).padStart(6)}${String(result.databaseCounts[entity]).padStart(11)}`
      )
    }
    console.log('')
    console.log(`  created:   ${result.stats.created}`)
    console.log(`  updated:   ${result.stats.updated}`)
    console.log(`  unchanged: ${result.stats.unchanged}`)
    console.log(`  skipped:   ${result.stats.skipped}`)

    if (result.deferred.length > 0) {
      console.log(`\n  ${result.deferred.length} deferred relation(s) — no Booking or User model yet:`)
      for (const item of result.deferred.slice(0, 5)) {
        console.log(`    ${item.entity}[${item.sourceId}].${item.field} = ${item.value}`)
      }
      if (result.deferred.length > 5) console.log(`    …and ${result.deferred.length - 5} more`)
    }

    console.log('\nMigration complete.')
  } finally {
    await disconnectDatabase()
  }
}

main().catch((error) => {
  console.error('\nMigration failed. Nothing was left half-written.\n')
  console.error(error.message)
  process.exit(1)
})
