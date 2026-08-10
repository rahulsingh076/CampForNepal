# Engineering Guidelines

These guidelines describe how developers should work in the Camp For Nepal
repository. They are neutral project rules for preserving the current frontend,
backend, data contracts, and production safety boundaries.

## Stack

- Use JavaScript ES modules throughout the application.
- Frontend: React 18, Vite, React Router, and Tailwind CSS v4 through
  `@tailwindcss/vite`.
- Backend: Node.js 24 or newer for the backend workspace, Express 5, MongoDB,
  Mongoose, Mongo-backed sessions, Argon2id passwords, Helmet, CORS, CSRF, and
  express-rate-limit.
- Do not add TypeScript, replace the frontend framework, replace the backend
  framework, or change the database without an approved architecture decision.
- Add dependencies only when the need is documented and the package is reviewed
  for maintenance, security, and bundle/runtime impact.

## Folder Responsibilities

- `frontend/src/pages/` contains route pages.
- `frontend/src/components/` contains reusable UI components grouped by use.
- `frontend/src/config/` contains route, navigation, token, status, and site
  configuration.
- `frontend/src/data/` contains seed/demo data still used by the browser
  data layer.
- `frontend/src/lib/dataClient.js` is the frontend business-data facade.
- `backend/src/app.js` builds the Express app and middleware order.
- `backend/src/server.js` owns process startup, database connection, listening,
  and shutdown.
- `backend/src/modules/<feature>/` contains backend feature modules.
- `backend/src/config/`, `backend/src/middleware/`, `backend/src/database/`,
  `backend/src/constants/`, `backend/src/seeds/`, and `backend/src/utils/`
  contain shared backend infrastructure.
- `docs/` and `backend/docs/` contain professional handover and technical
  documentation.

## Coding Style

- Prefer readable, direct JavaScript over clever abstractions.
- Keep files and components focused. Extract helpers when repetition or
  complexity justifies it.
- Preserve route URLs, public function names, and data contracts unless a
  coordinated migration plan is documented.
- Keep business copy, prices, contact details, and media metadata in data/CMS
  records rather than hard-coded in JSX.
- Use existing shared components, hooks, and backend helpers before creating
  new patterns.
- Comments should explain non-obvious decisions, safety boundaries, and
  migration concerns. Avoid narrating what the code already says.

## API Envelope

Every backend response and every frontend `dataClient` result must use:

```json
{ "success": true, "message": "", "data": null, "meta": {} }
```

- `success` is boolean.
- `message` is human-readable.
- `data` is the record, list, or `null`.
- `meta` carries request metadata such as `requestId` and pagination.

Backend controllers should use `backend/src/utils/response.js` instead of
formatting `res.json()` manually.

## Frontend Data Boundary

- Frontend components should call `frontend/src/lib/dataClient.js` and related
  public helpers, not seed files directly.
- Preserve these public exports until a coordinated frontend-backend migration
  replaces their internals: `listItems`, `getItem`, `getSingleton`,
  `createItem`, `updateItem`, `deleteItem`, `updateSingleton`,
  `resetDemoData`, and `subscribeDataChanges`.
- Current browser writes go through frontend write validation and localStorage
  overlay storage. This is demo behavior, not production authorization.
- Future backend integration should keep frontend callers stable while moving
  persistence behind HTTP requests, credentials, and CSRF.

## Backend Module Boundaries

- Routes declare paths and middleware, then delegate.
- Controllers read HTTP request data, call services, and send envelope
  responses.
- Services own business logic and database access.
- Models own Mongoose schema, validation, indexes, and persistence concerns.
- Serializers and projection helpers must use allowlists for public/private
  output.
- Controllers must not bypass services to talk directly to models once a
  service exists for that feature.

## Roles And Permissions

- Active roles are `customer`, `admin`, and `super_admin`.
- `guide` is retained as a managed profile/data role, not a staff portal role.
- Backend authorization uses explicit allowlists per route. There is no numeric
  hierarchy, and `super_admin` is not automatically admitted unless named.
- `requireAuth` must run before `requireRole`.
- Frontend menu visibility and route guards are usability controls only. The
  backend is the production security boundary.

## Security Rules

- Passwords are Argon2id hashes. Do not add plaintext password storage or a
  weaker fallback.
- Sessions are server-side and MongoDB-backed. Do not move auth tokens to
  localStorage.
- Unsafe backend methods require CSRF protection.
- Public write endpoints still require CSRF/Origin checks and rate limits.
- Reject privileged or unknown public request fields rather than silently
  stripping them.
- Never expose password hashes, session fields, CSRF tokens, MongoDB ObjectIds
  where a public id is expected, connection strings, stack traces, or private
  operational fields.
- Do not add online payments, payment proof collection, Gmail/SMTP/backend
  email delivery, social messaging APIs, or binary upload/storage without a
  separate approved scope.

## Environment And Secrets

- Never commit `.env`, passwords, session secrets, MongoDB URIs, deployment
  tokens, recovery codes, database dumps, or private credentials.
- Use `backend/.env.example` only for safe example values and variable
  descriptions.
- Production environment values must be handed over through a password manager
  or secure one-time secret channel.
- Backend startup validation in `backend/src/config/env.js` is the source of
  truth for required environment variables.

## Testing Requirements

Run focused checks for the files changed. Before handoff or merge, run the
broad checks that are applicable to the change:

```bash
npm run check
npm run check:backend
npm run test:auth
npm run test:inquiries
npm run test:media-cms
npm run verify:b08
```

Database-backed tests must use configured test databases. Never test against a
production database and never run destructive seed reset unless explicitly
approved for a non-production environment.

## Git Workflow

- Work on a branch, keep diffs reviewable, and avoid unrelated rewrites.
- Do not rewrite history, amend shared commits, or squash automatically.
- Review `git status --short`, `git diff --stat`, and `git diff --check`
  before staging.
- Stage only intended files. Do not stage `.env`, build artifacts, database
  dumps, logs, or local dependency folders.

## Scope Control

- Make the smallest safe change that satisfies the approved task.
- Preserve existing routes, features, response contracts, and dataClient public
  signatures unless the task explicitly includes a migration.
- Separate implemented behavior from planned behavior in documentation.
- Do not start a new product feature during documentation or handover work.

## Documentation Updates

Update neutral project documentation when behavior changes:

- public or backend routes
- data models or field names
- role/permission rules
- environment variables
- testing commands
- deployment assumptions
- owner-only manual actions
- security/privacy boundaries
