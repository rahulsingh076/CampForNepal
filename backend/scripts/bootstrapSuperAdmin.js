// Creates the first super_admin, once.
//
//   npm run bootstrap:super-admin
//
// There is no self-service route to a privileged role, so the very first
// administrator has to come from somewhere. This is that somewhere, and it is
// deliberately awkward: it needs an explicit opt-in flag, it refuses to run if
// a super_admin already exists, and it never prints or logs the password.
import { connectDatabase, disconnectDatabase } from '../src/config/database.js'
import loadEnv from '../src/config/env.js'
import User from '../src/modules/users/user.model.js'
import userService from '../src/modules/users/user.service.js'

function fail(message) {
  console.error(`\n${message}\n`)
  process.exit(1)
}

async function main() {
  // A one-off script, not the Express app: no session secret is needed.
  const config = loadEnv(process.env, { requireAuthConfig: false })

  if (!config.allowBootstrapSuperAdmin) {
    fail(
      'Refusing to run. ALLOW_BOOTSTRAP_SUPER_ADMIN is not "true".\n' +
        'Set it, run this once, then set it back to false.'
    )
  }

  const fullName = (process.env.BOOTSTRAP_SUPER_ADMIN_NAME || '').trim()
  const email = (process.env.BOOTSTRAP_SUPER_ADMIN_EMAIL || '').trim()
  const password = process.env.BOOTSTRAP_SUPER_ADMIN_PASSWORD || ''

  if (!fullName || !email || !password) {
    fail(
      'BOOTSTRAP_SUPER_ADMIN_NAME, BOOTSTRAP_SUPER_ADMIN_EMAIL, and\n' +
        'BOOTSTRAP_SUPER_ADMIN_PASSWORD must all be set.'
    )
  }

  await connectDatabase(config.mongodbUri)

  try {
    // Idempotent by refusal rather than by upsert: silently resetting an
    // existing administrator's password would be a back door.
    const existing = await User.findOne({ role: 'super_admin' })
    if (existing) {
      console.log('A super_admin already exists. Nothing was changed.')
      console.log('To add another one, promote an account from the admin panel.')
      return
    }

    const user = await userService.createUser({
      fullName,
      email,
      password,
      role: 'super_admin',
    })

    // The email identifies the account; the password is never echoed.
    console.log('\nSuper administrator created.')
    console.log(`  name:  ${user.fullName}`)
    console.log(`  email: ${user.email}`)
    console.log(`  role:  ${user.role}`)
    console.log('\nNow set ALLOW_BOOTSTRAP_SUPER_ADMIN=false and remove the')
    console.log('BOOTSTRAP_SUPER_ADMIN_* values from your .env.')
  } finally {
    await disconnectDatabase()
  }
}

main().catch((error) => {
  // The message may name a validation problem, never a credential.
  fail(`Bootstrap failed.\n${error.message}`)
})
