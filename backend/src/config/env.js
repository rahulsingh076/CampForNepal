// Reads and validates every environment variable the server needs.
//
// This runs before anything else starts, so a misconfigured server fails at
// boot with a readable list of problems rather than throwing somewhere deep in
// a request months later. Values are read from process.env, which Node fills
// from --env-file; there is no dotenv package involved.

const VALID_NODE_ENVS = ['development', 'test', 'production']

function positiveInteger(raw, name, problems) {
  const value = Number(raw)
  if (!Number.isInteger(value) || value <= 0) {
    problems.push(`${name} must be a positive integer, received "${raw}"`)
    return null
  }
  return value
}

function parseOrigins(raw) {
  return String(raw || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
}

export function readEnv(source = process.env, { requireAuthConfig = true } = {}) {
  const problems = []

  const nodeEnv = source.NODE_ENV
  const isProductionEnv = nodeEnv === 'production'
  if (!nodeEnv) problems.push('NODE_ENV is required')
  else if (!VALID_NODE_ENVS.includes(nodeEnv)) {
    problems.push(`NODE_ENV must be one of ${VALID_NODE_ENVS.join(', ')}, received "${nodeEnv}"`)
  }

  const port = positiveInteger(source.PORT, 'PORT', problems)
  const shutdownTimeoutMs = positiveInteger(
    source.SHUTDOWN_TIMEOUT_MS,
    'SHUTDOWN_TIMEOUT_MS',
    problems
  )

  const apiPrefix = source.API_PREFIX
  if (!apiPrefix) problems.push('API_PREFIX is required')
  else if (!apiPrefix.startsWith('/')) {
    problems.push(`API_PREFIX must start with "/", received "${apiPrefix}"`)
  }

  // Deliberately never echoed back — not in an error, not in a log line.
  const mongodbUri = source.MONGODB_URI
  if (!mongodbUri) problems.push('MONGODB_URI is required')

  const corsOrigins = parseOrigins(source.CORS_ORIGINS)
  if (corsOrigins.length === 0) {
    problems.push('CORS_ORIGINS must list at least one origin, comma separated')
  }
  if (corsOrigins.includes('*')) {
    problems.push('CORS_ORIGINS must not contain "*". List each allowed origin explicitly.')
  }

  const requestBodyLimit = source.REQUEST_BODY_LIMIT
  if (!requestBodyLimit) problems.push('REQUEST_BODY_LIMIT is required, for example "1mb"')

  // Public list pagination.
  const publicDefaultPageSize = positiveInteger(
    source.PUBLIC_DEFAULT_PAGE_SIZE,
    'PUBLIC_DEFAULT_PAGE_SIZE',
    problems
  )
  const publicMaxPageSize = positiveInteger(
    source.PUBLIC_MAX_PAGE_SIZE,
    'PUBLIC_MAX_PAGE_SIZE',
    problems
  )
  if (
    publicDefaultPageSize !== null &&
    publicMaxPageSize !== null &&
    publicDefaultPageSize > publicMaxPageSize
  ) {
    problems.push(
      `PUBLIC_DEFAULT_PAGE_SIZE (${publicDefaultPageSize}) cannot exceed PUBLIC_MAX_PAGE_SIZE (${publicMaxPageSize})`
    )
  }

  // FRONTEND_ROOT is used only by the seed scripts. The server must start
  // without it, so a missing value is not a problem here — the seed script
  // checks for it separately and explains itself.
  const frontendRoot = source.FRONTEND_ROOT || null

  // Both guards are opt-in: anything other than the exact string "true" is off.
  const allowSeedInProduction = source.ALLOW_SEED_IN_PRODUCTION === 'true'
  const allowDestructiveSeed = source.ALLOW_DESTRUCTIVE_SEED === 'true'

  // ------------------------------------------------------------ session/auth
  //
  // These are needed by the Express app, not by the catalogue seed scripts, so
  // they are validated only when `requireAuthConfig` is set. That keeps
  // `npm run seed:catalog` working on a machine that has no session secret.
  const auth = {}
  if (requireAuthConfig) {
    // Comma-separated for rotation. The first entry signs new sessions; the
    // rest still verify existing ones, so a secret can be replaced without
    // logging everybody out.
    const secrets = String(source.SESSION_SECRETS || '')
      .split(',')
      .map((secret) => secret.trim())
      .filter(Boolean)

    if (secrets.length === 0) problems.push('SESSION_SECRETS is required')
    secrets.forEach((secret, index) => {
      if (secret.length < 32) {
        problems.push(`SESSION_SECRETS[${index}] must be at least 32 characters of random data`)
      }
      if (/replace-with|change-me|secret|password/i.test(secret)) {
        problems.push(`SESSION_SECRETS[${index}] still looks like a placeholder`)
      }
    })
    auth.sessionSecrets = secrets

    const cookieName = source.SESSION_COOKIE_NAME
    if (!cookieName || !cookieName.trim()) problems.push('SESSION_COOKIE_NAME is required')
    else if (cookieName.trim() === 'connect.sid') {
      problems.push('SESSION_COOKIE_NAME must not be the express-session default "connect.sid"')
    }
    auth.sessionCookieName = cookieName?.trim()

    const idle = positiveInteger(source.SESSION_IDLE_TIMEOUT_MS, 'SESSION_IDLE_TIMEOUT_MS', problems)
    const absolute = positiveInteger(source.SESSION_ABSOLUTE_TIMEOUT_MS, 'SESSION_ABSOLUTE_TIMEOUT_MS', problems)
    if (idle !== null && absolute !== null && absolute <= idle) {
      problems.push(
        `SESSION_ABSOLUTE_TIMEOUT_MS (${absolute}) must be greater than SESSION_IDLE_TIMEOUT_MS (${idle})`
      )
    }
    auth.sessionIdleTimeoutMs = idle
    auth.sessionAbsoluteTimeoutMs = absolute
    auth.sessionTouchAfterSeconds = positiveInteger(
      source.SESSION_TOUCH_AFTER_SECONDS, 'SESSION_TOUCH_AFTER_SECONDS', problems
    )

    auth.loginWindowMs = positiveInteger(source.AUTH_LOGIN_WINDOW_MS, 'AUTH_LOGIN_WINDOW_MS', problems)
    auth.loginMaxAttempts = positiveInteger(source.AUTH_LOGIN_MAX_ATTEMPTS, 'AUTH_LOGIN_MAX_ATTEMPTS', problems)
    auth.accountLockThreshold = positiveInteger(source.AUTH_ACCOUNT_LOCK_THRESHOLD, 'AUTH_ACCOUNT_LOCK_THRESHOLD', problems)
    auth.accountLockMs = positiveInteger(source.AUTH_ACCOUNT_LOCK_MS, 'AUTH_ACCOUNT_LOCK_MS', problems)

    // 0 means "no proxy in front of us". Blanket-trusting every hop lets a
    // client spoof X-Forwarded-For and defeat IP rate limiting.
    const hops = Number(source.TRUST_PROXY_HOPS ?? 0)
    if (!Number.isInteger(hops) || hops < 0) {
      problems.push(`TRUST_PROXY_HOPS must be a whole number of 0 or more, received "${source.TRUST_PROXY_HOPS}"`)
    }
    auth.trustProxyHops = Number.isInteger(hops) && hops >= 0 ? hops : 0

    // A production cookie must be Secure, which requires TLS in front. Over
    // plain http on localhost a Secure cookie is never stored, so development
    // opts out — but production may not.
    if (nodeEnv === 'production' && source.SESSION_COOKIE_SECURE === 'false') {
      problems.push('SESSION_COOKIE_SECURE cannot be false in production')
    }
    auth.sessionCookieSecure = nodeEnv === 'production' || source.SESSION_COOKIE_SECURE === 'true'

    // "lax" lets a normal top-level navigation carry the cookie while blocking
    // it on cross-site form posts, which is what stops CSRF at the cookie layer.
    const sameSite = (source.SESSION_COOKIE_SAMESITE || 'lax').trim().toLowerCase()
    if (!['lax', 'strict', 'none'].includes(sameSite)) {
      problems.push(`SESSION_COOKIE_SAMESITE must be lax, strict, or none, received "${sameSite}"`)
    }
    if (sameSite === 'none' && !auth.sessionCookieSecure) {
      problems.push('SESSION_COOKIE_SAMESITE=none requires SESSION_COOKIE_SECURE=true')
    }
    auth.sessionCookieSameSite = sameSite
  }

  const allowBootstrapSuperAdmin = source.ALLOW_BOOTSTRAP_SUPER_ADMIN === 'true'

  // Validated even when the auth block is skipped. These names are what the
  // integration tests delete records from, so a wrong value here is the one
  // configuration mistake that could destroy real data.
  const FORBIDDEN_TEST_DATABASES = ['camp_for_nepal', 'production', 'staging']

  function testDatabaseName(raw, name) {
    const value = (raw || '').trim() || null
    if (!value) return null
    if (!value.endsWith('_test')) problems.push(`${name} must end in "_test"`)
    if (FORBIDDEN_TEST_DATABASES.includes(value)) {
      problems.push(`${name} must not be "${value}"`)
    }
    return value
  }

  const authTestDatabaseName = testDatabaseName(
    source.AUTH_TEST_DATABASE_NAME,
    'AUTH_TEST_DATABASE_NAME'
  )
  const inquiryTestDatabaseName = testDatabaseName(
    source.INQUIRY_TEST_DATABASE_NAME,
    'INQUIRY_TEST_DATABASE_NAME'
  )

  // ------------------------------------------------------------- inquiries
  //
  // Validated for everyone, not only the Express app: the seed scripts never
  // read them, but a bad limit is worth catching at boot rather than on the
  // first public submission.
  const inquiry = {
    publicWindowMs: positiveInteger(
      source.INQUIRY_PUBLIC_WINDOW_MS, 'INQUIRY_PUBLIC_WINDOW_MS', problems
    ),
    publicMaxSubmissions: positiveInteger(
      source.INQUIRY_PUBLIC_MAX_SUBMISSIONS, 'INQUIRY_PUBLIC_MAX_SUBMISSIONS', problems
    ),
    maxMessageLength: positiveInteger(
      source.INQUIRY_MAX_MESSAGE_LENGTH, 'INQUIRY_MAX_MESSAGE_LENGTH', problems
    ),
    maxNoteLength: positiveInteger(
      source.INQUIRY_MAX_NOTE_LENGTH, 'INQUIRY_MAX_NOTE_LENGTH', problems
    ),
    maxPeople: positiveInteger(source.INQUIRY_MAX_PEOPLE, 'INQUIRY_MAX_PEOPLE', problems),
    minFillTimeMs: positiveInteger(
      source.INQUIRY_MIN_FILL_TIME_MS, 'INQUIRY_MIN_FILL_TIME_MS', problems
    ),
  }

  // Appears in every public reference code, so it must survive being read
  // aloud and written down: uppercase letters and digits only.
  const referencePrefix = (source.INQUIRY_REFERENCE_PREFIX || '').trim()
  if (!referencePrefix) problems.push('INQUIRY_REFERENCE_PREFIX is required')
  else if (!/^[A-Z0-9]{2,8}$/.test(referencePrefix)) {
    problems.push(
      'INQUIRY_REFERENCE_PREFIX must be 2-8 uppercase letters or digits, ' +
        `received "${referencePrefix}"`
    )
  }
  inquiry.referencePrefix = referencePrefix

  // Must match the hidden input the frontend renders, or the check never fires.
  const honeypotField = (source.INQUIRY_HONEYPOT_FIELD || '').trim()
  if (!honeypotField) problems.push('INQUIRY_HONEYPOT_FIELD is required')
  inquiry.honeypotField = honeypotField

  // A message of 1,000,000 characters is not a message; a message of 10 leaves
  // no room to describe a trip. Both ends are worth catching at boot.
  if (inquiry.maxMessageLength !== null && (inquiry.maxMessageLength < 200 || inquiry.maxMessageLength > 20000)) {
    problems.push('INQUIRY_MAX_MESSAGE_LENGTH must be between 200 and 20000')
  }
  if (inquiry.maxNoteLength !== null && (inquiry.maxNoteLength < 100 || inquiry.maxNoteLength > 20000)) {
    problems.push('INQUIRY_MAX_NOTE_LENGTH must be between 100 and 20000')
  }
  if (inquiry.maxPeople !== null && inquiry.maxPeople > 1000) {
    problems.push('INQUIRY_MAX_PEOPLE must be 1000 or fewer')
  }

  // Recorded against every consent record. The placeholder is allowed so
  // development runs, but it is not a published policy and production is not
  // ready until the owner replaces it.
  const privacyPolicyVersion = (source.PRIVACY_POLICY_VERSION || '').trim()
  if (!privacyPolicyVersion) problems.push('PRIVACY_POLICY_VERSION is required')
  if (isProductionEnv && privacyPolicyVersion === 'owner-required') {
    problems.push(
      'PRIVACY_POLICY_VERSION is still "owner-required". Production must record a real policy version.'
    )
  }

  return {
    problems,
    config: {
      nodeEnv,
      isProduction: nodeEnv === 'production',
      isDevelopment: nodeEnv === 'development',
      port,
      apiPrefix,
      mongodbUri,
      corsOrigins,
      requestBodyLimit,
      shutdownTimeoutMs,
      publicDefaultPageSize,
      publicMaxPageSize,
      frontendRoot,
      allowSeedInProduction,
      allowDestructiveSeed,
      allowBootstrapSuperAdmin,
      authTestDatabaseName,
      inquiryTestDatabaseName,
      privacyPolicyVersion,
      inquiry,
      ...auth,
    },
  }
}

// Throws with every problem at once, so one restart reveals the whole list
// rather than one variable per attempt.
export function loadEnv(source = process.env, options = {}) {
  const { problems, config } = readEnv(source, options)

  if (problems.length > 0) {
    const detail = problems.map((problem) => `  - ${problem}`).join('\n')
    throw new Error(
      `Invalid environment configuration:\n${detail}\n\nCopy .env.example to .env and fill in the values.`
    )
  }

  return config
}

export default loadEnv
