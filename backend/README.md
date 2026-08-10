# Camp For Nepal — Backend

The API for the Camp For Nepal tourism platform.

Its purpose is narrow and specific: replace the internals of the frontend's mock
`dataClient` without the frontend needing a rewrite. Every response therefore
uses the same `{ success, message, data, meta }` envelope the mock already
returns.

The backend includes configuration validation, the Express application, error
handling, a health check, catalogue models, seed migration, public read APIs,
authentication, MongoDB-backed sessions, CSRF protection, role authorization,
public inquiry submission, and the staff inquiry CRM. It saves inquiries only:
no email, WhatsApp, SMS, Gmail integration, or message delivery.

The catalogue remains read-only, no booking or payment code exists, and **the
frontend is not connected to these endpoints** — it still runs on its mock
`dataClient`.

## Prerequisites

- **Node.js 24 LTS or newer.** `--env-file` and `--env-file-if-exists` are
  built-in from Node 24, which is why no dotenv package is used. `.nvmrc` pins
  24; run `nvm use` if you use nvm.
- **npm 10+**
- **MongoDB** running locally, or a MongoDB Atlas connection string.

## Installation

```bash
cd backend
npm install
cp .env.example .env
```

## Environment

Every variable is required, and all of them are validated at startup — a
missing or malformed value stops the server with a list of every problem at
once rather than one per restart.

| Variable | Example | Notes |
| --- | --- | --- |
| `NODE_ENV` | `development` | Only `development`, `test`, or `production` |
| `PORT` | `5000` | Positive integer |
| `API_PREFIX` | `/api/v1` | Must start with `/` |
| `MONGODB_URI` | see below | Never logged, never returned in a response |
| `CORS_ORIGINS` | `http://localhost:5173` | Comma-separated allowlist. `*` is rejected |
| `REQUEST_BODY_LIMIT` | `1mb` | Maximum accepted request body |
| `SHUTDOWN_TIMEOUT_MS` | `10000` | Positive integer, forced-exit deadline |
| `PUBLIC_DEFAULT_PAGE_SIZE` | `12` | Must not exceed the maximum |
| `PUBLIC_MAX_PAGE_SIZE` | `100` | Upper bound a caller may request |
| `FRONTEND_ROOT` | `../frontend` | **Seed scripts only.** The server runs without it |
| `ALLOW_SEED_IN_PRODUCTION` | `false` | Must be `true` to seed a production database |
| `ALLOW_DESTRUCTIVE_SEED` | `false` | Must be `true` to run the reset script |

Authentication adds the following. They are validated only when the Express app
starts, so the seed scripts keep working on a machine that has no session
secret. Full notes in [AUTHENTICATION.md](docs/AUTHENTICATION.md).

| Variable | Example | Notes |
| --- | --- | --- |
| `SESSION_SECRETS` | 32+ random characters | Comma-separated for rotation: the first signs, all verify |
| `SESSION_COOKIE_NAME` | `cfn.sid` | Rejected if it is `connect.sid` |
| `SESSION_COOKIE_SECURE` | `false` | Forced `true` in production |
| `SESSION_COOKIE_SAMESITE` | `lax` | `lax`, `strict`, or `none` |
| `SESSION_IDLE_TIMEOUT_MS` | `1800000` | 30 minutes. Slides forward on use |
| `SESSION_ABSOLUTE_TIMEOUT_MS` | `28800000` | 8 hours. Must exceed the idle timeout |
| `SESSION_TOUCH_AFTER_SECONDS` | `60` | How often a session document is rewritten |
| `AUTH_LOGIN_WINDOW_MS` | `900000` | Rate-limit window |
| `AUTH_LOGIN_MAX_ATTEMPTS` | `10` | Failed sign-ins per window, per address |
| `AUTH_ACCOUNT_LOCK_THRESHOLD` | `5` | Failures before an account locks |
| `AUTH_ACCOUNT_LOCK_MS` | `900000` | How long the lock lasts |
| `TRUST_PROXY_HOPS` | `0` | A **count**, never `true` — see below |
| `ALLOW_BOOTSTRAP_SUPER_ADMIN` | `false` | Guards the one-time bootstrap script |
| `AUTH_TEST_DATABASE_NAME` | `camp_for_nepal_auth_test` | Must end in `_test`. `camp_for_nepal`, `production`, and `staging` are rejected |

Inquiry settings are documented in [INQUIRY_API.md](docs/INQUIRY_API.md).

| Variable | Example | Notes |
| --- | --- | --- |
| `INQUIRY_PUBLIC_WINDOW_MS` | `900000` | Rate-limit window for public submissions |
| `INQUIRY_PUBLIC_MAX_SUBMISSIONS` | `10` | Submissions per window, per address |
| `INQUIRY_REFERENCE_PREFIX` | `CFN` | 2–8 uppercase letters or digits |
| `INQUIRY_MAX_MESSAGE_LENGTH` | `5000` | 200–20000 |
| `INQUIRY_MAX_NOTE_LENGTH` | `3000` | 100–20000 |
| `INQUIRY_MAX_PEOPLE` | `100` | 1000 or fewer |
| `INQUIRY_HONEYPOT_FIELD` | `company-website` | Must match the frontend's hidden input |
| `INQUIRY_MIN_FILL_TIME_MS` | `3000` | A weak signal only; never rejects on its own |
| `PRIVACY_POLICY_VERSION` | `owner-required` | **Production refuses to start on the placeholder** |
| `INQUIRY_TEST_DATABASE_NAME` | `camp_for_nepal_inquiry_test` | Must end in `_test` |

Generate a secret with:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
```

`TRUST_PROXY_HOPS` is a number rather than a boolean deliberately. Telling
Express to trust every proxy hop lets any client spoof `X-Forwarded-For`, which
would defeat the IP rate limit. Set it to the number of proxies actually in
front of the server: `0` locally, `1` behind a single load balancer.

`.env` is git-ignored. `.env.example` is committed and holds no real secret.

### MongoDB URI examples

Local:

```
MONGODB_URI=mongodb://127.0.0.1:27017/camp_for_nepal
```

Atlas:

```
MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster0.example.mongodb.net/camp_for_nepal?retryWrites=true&w=majority
```

The Atlas form embeds a password, which is exactly why the URI is never written
to a log or an API response. Connection errors report the host only.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | `node --watch --env-file=.env src/server.js` — reloads on change |
| `npm start` | `node --env-file-if-exists=.env src/server.js` — for deploys where the platform injects real environment variables |
| `npm run check` | Parses every file under `src/` and `scripts/` and fails on a syntax error |
| `npm test` | `node --test` — 405 tests. **No database needed** |
| `npm run test:auth` | Adds the HTTP authentication tests, against a `_test` database |
| `npm run verify:auth` | The whole authentication flow end to end, 16 checks |
| `npm run test:inquiries` | 195 tests for the inquiry pipeline, against a `_test` database |
| `npm run verify:inquiries` | The whole inquiry and CRM flow end to end, 31 checks |
| `npm run seed:catalog` | Import the frontend catalogue into MongoDB. Idempotent |
| `npm run seed:catalog:reset` | Remove migrated records. Needs `ALLOW_DESTRUCTIVE_SEED=true` |
| `npm run smoke:public` | Check every public endpoint against a running server |
| `npm run bootstrap:super-admin` | Create the first administrator, once. Needs `ALLOW_BOOTSTRAP_SUPER_ADMIN=true` |

`npm test` builds documents in memory and calls `validate()`, so it is fast and
deterministic and never touches MongoDB. Index behaviour and uniqueness are
therefore not covered by it.

`npm run test:auth` runs 143 tests that drive the real Express app over HTTP —
cookies, CSRF, sessions, idle and absolute expiry, lockout.

There is deliberately **no `.env.test`**. A second environment file is one more
thing to drift out of sync and one more place a credential gets pasted, so the
auth tests load the ordinary `.env`, reuse its host and credentials, and
**replace only the database name** with `AUTH_TEST_DATABASE_NAME`.

Four assertions run against the *live* connection before anything is deleted:
the name ends in `_test`, it is not `camp_for_nepal`/`production`/`staging`, it
matches `AUTH_TEST_DATABASE_NAME` exactly, and a connection is actually open.
Only `@authtest.invalid` accounts are removed, and `dropDatabase` appears
nowhere in the repository. The server refuses to boot on a bad value too, so
the guard is not test-only.

`npm run verify:auth` then drives the whole flow end to end — register, role,
`/me`, logout, login, two sessions, password change, old-session invalidation,
logout-all, CSRF refusal, public catalogue — as 16 pass/fail checks.

Without `MONGODB_URI` the HTTP suite skips with a reason rather than failing.

## Folder structure

```
backend/
├── src/
│   ├── app.js                 Express app; never calls listen()
│   ├── server.js              Lifecycle: validate, connect, listen, shut down
│   ├── config/
│   │   ├── env.js             Reads and validates every variable
│   │   ├── database.js        Mongoose connect, disconnect, state
│   │   └── cors.js            Allowlist policy
│   │   └── session.js         express-session over MongoDB
│   ├── middleware/
│   │   ├── requestContext.js  Assigns and echoes a request id
│   │   ├── asyncHandler.js    A rejected promise reaches the error handler
│   │   ├── sessionTimeout.js  Idle and absolute limits, server-side
│   │   ├── csrfProtection.js  Synchroniser token on every unsafe method
│   │   ├── requireAuth.js     Loads the user from the database each request
│   │   ├── requireRole.js     Explicit role allowlists
│   │   ├── authRateLimit.js   Per-address limits on login and register
│   │   ├── notFound.js        Unmatched routes become a structured 404
│   │   └── errorHandler.js    The one place an error becomes a response
│   ├── constants/             Frozen enums: statuses, types, roles
│   ├── database/              schemaOptions, validators, publicVisibility
│   ├── modules/
│   │   ├── health/            routes + controller
│   │   ├── auth/              validation, service, controller, routes
│   │   ├── users/             model + service
│   │   ├── inquiries/         model, validation, serializer, service,
│   │   │                        controller, routes
│   │   └── <feature>/         model, service, controller, routes
│   ├── routes/index.js        Mounts every module under API_PREFIX
│   └── utils/
│       ├── ApiError.js        Errors that are safe to show a client
│       ├── password.js        Argon2id policy, hashing, verification
│       ├── email.js           Normalisation and shape checking
│       ├── sessionPromises.js Promise wrappers for regenerate/save/destroy
│       └── response.js        The { success, message, data, meta } envelope
├── docs/
│   ├── API_CONTRACT.md        The contract the frontend depends on
│   ├── DATABASE_SCHEMA.md     Models, indexes, public/private fields
│   ├── AUTHENTICATION.md      Sessions, CSRF, passwords, the client flow
│   ├── ROLE_MATRIX.md         The eight roles and the allowlist rule
│   └── AUTH_SECURITY_CHECKLIST.md  Every control and what proves it
├── scripts/
│   ├── seedCatalog.js         Idempotent catalogue import
│   ├── resetCatalog.js        Removes migrated records only
│   ├── bootstrapSuperAdmin.js The first administrator, once
│   ├── verifyAuth.js          The whole auth flow, end to end
│   └── verifyInquiries.js     The whole inquiry and CRM flow, end to end
├── tests/
│   ├── helpers/               Fixtures, test database guard, HTTP agent
│   ├── models/                Validation tests, no database required
│   ├── auth/                  Password, model, CSRF, session, authz, HTTP
│   └── inquiries/             Model, validation, serialization, CRM, HTTP
└── .env.example
```

`app.js` deliberately does not call `listen()`, so a test can import the app
without opening a port.

## Health check

```bash
npm run dev
curl http://localhost:5000/api/v1/health
```

```json
{
  "success": true,
  "message": "Camp For Nepal API is healthy.",
  "data": {
    "status": "ok",
    "database": "connected",
    "uptimeSeconds": 1,
    "timestamp": "2026-08-04T14:45:05.865Z"
  },
  "meta": { "requestId": "fc134876-12f4-48c7-a062-b85abee9fac3" }
}
```

`data.database` reports the live Mongoose state — `connected`, `connecting`,
`disconnecting`, or `disconnected` — so the check is worth something rather
than always saying "ok".

Other things worth trying:

```bash
curl http://localhost:5000/                                    # root, points at the API
curl -i http://localhost:5000/api/v1/nope                       # structured 404
curl -i -H "Origin: https://evil.example.com" \
     http://localhost:5000/api/v1/health                        # rejected origin
```

## Documentation

- [Database schema](docs/DATABASE_SCHEMA.md) — models, indexes, public/private
  fields, derived data, seat-concurrency note
- [Frontend field mapping](docs/FRONTEND_FIELD_MAPPING.md) — every field and
  every transformation, including the two known mismatches
- [Seed migration](docs/SEED_MIGRATION.md) — source files, `sourceId`, the two
  passes, idempotency, and the production guards
- [Public catalogue API](docs/PUBLIC_CATALOG_API.md) — every endpoint, filter,
  sort value, and visibility rule
- [API contract](docs/API_CONTRACT.md) — the response envelope
- [Authentication](docs/AUTHENTICATION.md) — sessions, CSRF, passwords, the
  client flow, and every configuration variable
- [Role matrix](docs/ROLE_MATRIX.md) — the eight roles and why authorization is
  an allowlist rather than a hierarchy
- [Auth security checklist](docs/AUTH_SECURITY_CHECKLIST.md) — every control,
  where it lives, what proves it, and what is still open
- [Inquiry API](docs/INQUIRY_API.md) — the public submission endpoint and the
  staff CRM
- [CRM workflow](docs/CRM_WORKFLOW.md) — the status lifecycle, roles, and the
  append-only audit trail
- [Inquiry privacy](docs/INQUIRY_PRIVACY.md) — every personal field, why it is
  collected, and the owner decisions still outstanding
- [Frontend inquiry mapping](docs/FRONTEND_INQUIRY_MAPPING.md) — every form
  field and the four frontend/backend mismatches

## Known limitations

- **No write endpoints for the catalogue.** Inquiries are the only records the
  API creates or updates. The catalogue is still read-only.
- **Inquiries have no retention policy, no export route, and no erasure
  route**, and the frontend collects no consent — see
  [INQUIRY_PRIVACY.md](docs/INQUIRY_PRIVACY.md).
- **No booking, no conversion, no notification delivery, no Gmail integration,
  no SMTP, and no message delivery.** An inquiry is recorded and nothing is sent
  to anybody. Future email contact uses external compose links only.
- **No email verification and no password reset.** `emailVerifiedAt` exists and
  is always `null`; somebody who forgets their password has no route back in.
- **The login rate limiter counts in memory**, so it is per process. Running
  more than one instance multiplies the effective budget. The per-account
  lockout lives in MongoDB and is unaffected.
- **The frontend is not connected to this API.** It still runs entirely on its
  mock `dataClient` and localStorage overlay.
- **No Booking model.** `review.bookingId` is a reserved ObjectId with no `ref`,
  and the seed records it as deferred rather than inventing records.
- **Seat numbers are display-only.** Reservation and its concurrency handling
  are deliberately deferred; see [DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md).
- **No uploads, notifications, or payment.** Payment is deferred by design.
- **`npm test` never touches MongoDB**, so slug uniqueness and write
  concurrency are not covered by it. `npm run test:auth` does use a database,
  but only for the authentication routes.
- **No request logging or audit trail.** Failed sign-ins are counted but not
  recorded with a time and an address.
- The database connection is required at boot: if MongoDB is unreachable the
  server refuses to start rather than serving requests it cannot fulfil.
