# Camp For Nepal

Camp For Nepal is a full-stack tourism discovery, inquiry, booking request,
customer-service, and content-management platform for travel in Nepal. The
frontend is a React/Vite application with public, customer, admin, and
super-admin areas. The backend is an Express/Mongoose API with public catalogue
reads, authentication, sessions, inquiry CRM, media/events/search/print
modules, and seed migration support. The frontend still uses its browser
`dataClient` facade for business data; backend integration is a planned
production step.

## Current Stack

- Monorepo managed with npm workspaces.
- Frontend: React 18, Vite, JavaScript, React Router, Tailwind CSS v4 through
  `@tailwindcss/vite`.
- Backend: Node.js, Express 5, Mongoose, MongoDB, Mongo-backed sessions,
  Argon2id passwords, Helmet, CORS, CSRF protection, and express-rate-limit.
- Tests: Node test runner, Supertest, frontend data validation, route checks,
  and Vite smoke rendering.

## Workspace Structure

```text
CampForNepal/
├── frontend/       # React/Vite public site, customer area, and admin UI
├── backend/        # Express/Mongoose API, seed scripts, and backend tests
├── docs/           # Product, architecture, data, API, QA, and handover docs
├── package.json    # Root workspace scripts
└── package-lock.json
```

## Prerequisites

- Node.js 20.19 or newer for root/frontend commands.
- Node.js 24 or newer for the backend workspace.
- npm.
- MongoDB for backend development, tests, and seed migration. A local MongoDB
  URI works; MongoDB Atlas also works through `MONGODB_URI`.

## Installation

```bash
npm install
```

## Environment Setup

The frontend has no required checked-in `.env` file for local demo usage.

For the backend:

```bash
cp backend/.env.example backend/.env
```

Set at minimum:

- `MONGODB_URI`
- `SESSION_SECRETS`
- `CORS_ORIGINS`
- `PRIVACY_POLICY_VERSION` before production use

Do not commit `backend/.env`. The backend validates configuration at startup
and does not log the MongoDB connection string.

## Local Development

```bash
npm run dev              # frontend Vite dev server
npm run dev:frontend     # frontend only
npm run dev:backend      # backend API with --watch and backend/.env
```

The frontend prints its Vite URL in the terminal. The backend default in
`backend/.env.example` is port `5000` with API prefix `/api/v1`.

## Backend Health Check

Start the backend, then open:

```text
http://localhost:5000/api/v1/health
```

The root backend URL also returns the configured API prefix and health path.

## Test Commands

```bash
npm run check            # frontend build, data validation, route check, smoke
npm run validate:data    # frontend seed and write-rule validation
npm run check:routes     # frontend route and internal-link check
npm run smoke            # frontend route render smoke test
npm run check:backend    # backend syntax check
npm run test:backend     # all backend node:test suites
npm run test:auth        # backend auth/session/CSRF/role tests
npm run test:inquiries   # backend inquiry API and CRM tests
npm run test:media-cms   # backend media/event model and service tests
npm run verify:b08       # media/events/search/print verifier
npm run verify:inquiries # inquiry runtime verifier, requires backend env
```

## Seed Commands

```bash
npm run seed:catalog        # import frontend catalogue seeds into MongoDB
npm run seed:catalog:reset  # guarded removal of migrated seed records
```

The reset command requires `ALLOW_DESTRUCTIVE_SEED=true` and deletes only
records that were migrated from source seeds.

## Build And Start

```bash
npm run build          # frontend production build
npm run preview        # local frontend preview server
npm run start:backend  # backend production-style start with env file if present
```

No root production process starts both workspaces together. Frontend deployment
metadata exists under `frontend/.vercel/`; backend deployment configuration is
not present in the current repository.

## Main Documentation

- [Engineering guidelines](ENGINEERING_GUIDELINES.md)
- [Project overview](docs/PROJECT_OVERVIEW.md)
- [System architecture](docs/SYSTEM_ARCHITECTURE.md)
- [Repository path map](docs/REPOSITORY_PATH_MAP.md)
- [Backend developer handover](docs/BACKEND_DEVELOPER_HANDOVER.md)
- [Frontend-backend contract](docs/FRONTEND_BACKEND_CONTRACT.md)
- [API route inventory](docs/API_ROUTE_INVENTORY.md)
- [Database schema](docs/DATABASE_SCHEMA.md)
- [Role permission matrix](docs/ROLE_PERMISSION_MATRIX.md)
- [Environment and local setup](docs/ENVIRONMENT_AND_LOCAL_SETUP.md)
- [Testing and verification](docs/TESTING_AND_VERIFICATION.md)
- [Deployment and operations](docs/DEPLOYMENT_AND_OPERATIONS.md)
- [Current status and next steps](docs/CURRENT_STATUS_AND_NEXT_STEPS.md)
- [Owner handover checklist](docs/OWNER_HANDOVER_CHECKLIST.md)
- [Security and privacy](docs/SECURITY_AND_PRIVACY.md)
- [Current business scope](docs/CURRENT_BUSINESS_SCOPE.md)
- [Data model](docs/DATA_MODEL.md)
- [API contract](backend/docs/API_CONTRACT.md)
- [Database schema](backend/docs/DATABASE_SCHEMA.md)
- [Public catalogue API](backend/docs/PUBLIC_CATALOG_API.md)
- [Inquiry API](backend/docs/INQUIRY_API.md)
- [Role matrix](docs/ROLE_MATRIX.md)
- [Communication channels](docs/COMMUNICATION_CHANNELS.md)
- [Media library](docs/MEDIA_LIBRARY.md)
- [Global search](docs/GLOBAL_SEARCH.md)
- [Printing and hard copy](docs/PRINTING_AND_HARDCOPY.md)
- [Manual QA checklist](docs/QA_CHECKLIST.md)
- [Release candidate report](docs/RELEASE_CANDIDATE_REPORT.md)

## Security Note

The backend is the security boundary for production behavior. It uses
server-side sessions, global CSRF protection, explicit role allowlists,
sanitized response envelopes, and Mongo-backed session storage. Frontend
role checks and the browser `dataClient` overlay are demo/client behavior and
must not be treated as production authorization.

The product remains payment-free. There is no payment gateway, payment proof,
invoice, refund, Gmail integration, SMTP integration, backend email delivery,
Meta/social API integration, or binary media upload pipeline in the active
implementation.

## Current Status

- Public frontend, customer demo area, admin UI, media galleries, events,
  in-page search, print controls, and localStorage-backed CMS editing are
  implemented on the frontend.
- Backend public catalogue reads, auth/session/CSRF, inquiry CRM, media/events,
  search, print-safe projections, and seed migration are implemented.
- Frontend-to-backend data wiring is not complete. The current frontend still
  reads and writes through `frontend/src/lib/dataClient.js`.
- Production launch still needs owner-approved content, real environment
  values, frontend-backend integration, backend deployment, privacy/retention
  decisions, and manual browser/print QA.

## Known Limitations

- Frontend auth, customer records, admin edits, audit entries, messages, and
  booking workflows are demo data stored in browser localStorage.
- Backend booking, customer dashboard, private conversation, and full admin
  catalogue write APIs are not present yet.
- Customer document rows are metadata only; no files are uploaded.
- Local media file selection stores or references paths only. Files must be
  shipped under `frontend/public/media/library/` or replaced by approved
  external URLs.
- The frontend is a client-rendered SPA. SEO metadata exists, but robust crawler
  previews require prerendering or SSR plus a production canonical domain.
- The frontend data bundle remains large while seed data is shipped in the app.

## Contribution Workflow

1. Work from a clean branch and keep changes scoped to the requested feature.
2. Preserve the existing React/Vite/Tailwind frontend and Express/Mongoose
   backend stack unless a documented architecture decision changes it.
3. Keep business data behind `dataClient` on the frontend and service/model
   boundaries on the backend.
4. Do not add new dependencies, providers, payment flows, email delivery, or
   upload systems without an approved scope change.
5. Run the focused checks for the area changed, then run broader checks before
   handoff.
6. Update neutral documentation when behavior, routes, data contracts, or
   operational responsibilities change.

## Backend Developer Starting Point

Start with:

- [backend/README.md](backend/README.md)
- [backend/docs/API_CONTRACT.md](backend/docs/API_CONTRACT.md)
- [backend/docs/DATABASE_SCHEMA.md](backend/docs/DATABASE_SCHEMA.md)
- [backend/docs/AUTHENTICATION.md](backend/docs/AUTHENTICATION.md)
- [backend/docs/INQUIRY_API.md](backend/docs/INQUIRY_API.md)
- [backend/docs/SEED_MIGRATION.md](backend/docs/SEED_MIGRATION.md)

Then run:

```bash
npm run check:backend
npm run test:auth
npm run test:inquiries
```
