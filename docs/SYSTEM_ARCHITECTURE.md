# System Architecture

## Overview

Camp For Nepal is a monorepo with a React/Vite frontend and an Express/Mongoose
backend. The frontend and backend share the same product contracts, especially
the response envelope:

```json
{ "success": true, "message": "", "data": null, "meta": {} }
```

The frontend still uses a browser `dataClient` over seed data and localStorage
for most business operations. The backend exposes real API foundations for
public catalogue reads, authentication, inquiries, media/events, search, and
print-safe projections. A later integration step is expected to replace
`dataClient` internals with backend API calls without changing its public
function signatures.

## Browser And Frontend

- Browser loads the Vite-built single-page application from `frontend/`.
- `frontend/src/main.jsx` mounts React.
- `frontend/src/app/providers.jsx` wraps app context providers.
- `frontend/src/app/router.jsx` declares lazy public, customer, and admin route
  trees using React Router.
- Public layout, customer layout, and admin layout own shared shells.
- Frontend route data lives in `frontend/src/config/routes.js`.
- Admin/customer navigation lives in `frontend/src/config/navigation.js`.
- Design tokens live in CSS under `frontend/src/styles/` and mirrored JS config
  under `frontend/src/config/designTokens.js` where needed.

## Current Frontend Data Flow

The active frontend data path is browser-local:

```text
Browser
-> React page/component
-> frontend/src/lib/dataClient.js
-> frontend/src/lib/entities.js
-> frontend/src/data/*.js seed records
-> frontend/src/lib/overlay.js localStorage overlay
-> { success, message, data, meta }
-> UI
```

There is no dedicated frontend API request helper in the current repository.
`dataClient` is the facade that future API wiring should preserve.

## Backend API

The backend starts from `backend/src/server.js`:

```text
server.js
-> loadEnv()
-> connectDatabase(MONGODB_URI)
-> createApp(config)
-> listen(PORT)
```

`backend/src/app.js` builds the Express application. Middleware order is:

1. `requestContext`
2. `helmet`
3. CORS allowlist middleware
4. JSON and URL-encoded body parsers with configured body limit
5. Mongo-backed session middleware
6. `sessionTimeout`
7. global `csrfProtection`
8. root API information route
9. API router under `API_PREFIX`
10. `notFound`
11. central `errorHandler`

Every controller should send responses through `backend/src/utils/response.js`
so the envelope remains consistent.

## Backend Modules

Mounted API modules:

- `health`
- `auth`
- `destinations`
- `activities`
- `packages`, `trekking`, and `expeditions`
- `events`
- `media`
- `search`
- `print`
- `inquiries`
- `fixedDepartures`
- `guides`
- `reviews`
- `users` model/service support

The backend uses feature folders under `backend/src/modules/<feature>/`.
Common layers are routes, controller, service, model, serializer, and
validation, although not every module needs every layer.

## Public API

Public read endpoints are mounted below `API_PREFIX`, usually `/api/v1`:

- `/health`
- `/destinations`
- `/activities`
- `/packages`
- `/trekking`
- `/expeditions`
- `/fixed-departures`
- `/guides`
- `/reviews`
- `/events`
- `/media`
- `/search`
- `/print`

Public inquiry submission also lives under `/inquiries`, with validation,
CSRF, Origin checks, honeypot handling, idempotency, and rate limiting.

## Authenticated Customer API

A dedicated backend customer dashboard API is not present in the current
repository. Backend authentication exists, and the frontend customer area
exists, but connecting the two is planned. Current customer dashboard data is
frontend seed/overlay data.

## Staff/Admin API

Staff/admin backend routes exist for:

- `/admin/events`
- `/admin/media`
- `/admin/global-search`
- `/admin/print`
- inquiry CRM routes under `/inquiries`

Route authorization uses explicit role allowlists. `super_admin` is not
implicitly admitted unless a route names it.

## Session Store

Backend sessions are server-side and stored in MongoDB through
`connect-mongo`. The browser receives only a signed session cookie. The session
does not store user role, email, name, or password hash. User role and status
are read from the database for protected requests.

## MongoDB Atlas

The backend connects to whatever MongoDB deployment is configured by
`MONGODB_URI`. The checked-in example supports local MongoDB and Atlas SRV
URIs. The URI is validated as present, but it is never logged or returned in a
response. Test database names are separately validated and must end in `_test`.

## Media URL Storage

Media is reference-based:

- shipped local build paths under `frontend/public/images/` or
  `frontend/public/media/library/`
- safe external image/video URLs
- supported provider links for videos and reels
- metadata such as alt text, captions, focal position, source, licence, and
  photographer/source details

Binary uploads and MongoDB video storage are not implemented.

## Direct External Contact Links

Public contact actions open external systems:

- `mailto:` or local email application
- Gmail compose in a browser tab
- phone links
- WhatsApp links
- configured external social links

Opening an external composer or link is not treated as a sent or delivered
message. Backend Gmail, SMTP, OAuth, and social messaging integrations are not
implemented.

## Print Views

Frontend print buttons use browser-native print behavior. Backend print
services provide print-safe projections for public and admin use. There is no
server-side PDF generator. Manual print preview remains required before launch.

## Current Public Read Flow

Current frontend demo read:

```text
Browser
-> React page
-> dataClient
-> seed data and localStorage overlay
-> standard response envelope
-> UI
```

Backend public API read when called directly:

```text
Browser or API caller
-> Express route
-> controller
-> service
-> Mongoose model
-> MongoDB
-> serializer or selected projection
-> standard response envelope
-> client
```

Future frontend-backend integration target:

```text
Browser
-> React page
-> dataClient
-> API request helper
-> Express route
-> controller
-> service
-> Mongoose model
-> MongoDB
-> serializer
-> standard response envelope
-> UI
```

The API request helper in that target flow is not present yet.

## Authentication Flow

```text
Browser
-> CSRF token
-> session cookie
-> authentication route
-> MongoDB-backed session
-> User model
-> protected request
```

Unsafe methods require a CSRF token. Login rotates the session id and CSRF
token. Passwords are Argon2id hashes.

## Write Operation Flow

Current frontend demo write:

```text
Browser form
-> dataClient
-> frontend write validation
-> localStorage overlay
-> mock audit log when applicable
-> standard response envelope
-> UI update
```

Backend protected write:

```text
Browser or API caller
-> CSRF
-> validation
-> role check when protected
-> service
-> database
-> serializer
-> audit/history when implemented
-> response
```

Public inquiry writes also run CSRF, Origin validation, unknown/privileged-field
rejection, honeypot handling, idempotency, and rate limiting.

## Same-Origin And Split-Origin Behavior

Local development is split-origin by default:

- frontend Vite server on its printed dev URL, commonly `http://localhost:5173`
- backend API on `http://localhost:5000` with prefix `/api/v1`
- backend CORS allowlist configured by `CORS_ORIGINS`

The current frontend does not call the backend API, so CORS is mainly relevant
for direct backend/API testing and future frontend integration.

Production deployment is not fully configured in this repository. Frontend
Vercel project metadata exists under `frontend/.vercel/`; no backend deployment
definition or root orchestration file is present.
