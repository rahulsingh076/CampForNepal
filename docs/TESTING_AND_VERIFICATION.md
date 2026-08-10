# Testing And Verification

This guide lists actual scripts from the current package manifests. Commands
are run from the repository root unless noted.

## Frontend Commands

| Command | Directory | Purpose | Writes data | Expected pass condition | Common failure |
| --- | --- | --- | --- | --- | --- |
| `npm run build --workspace=@camp-for-nepal/frontend` | Root | Vite production build. | Writes `frontend/dist`. | Build completes. | Large chunk warning is known while seed data ships in bundle. |
| `npm run validate:data --workspace=@camp-for-nepal/frontend` | Root | Validate seed records, routes, safety rules, SEO fields. | No | `DATA VALIDATION PASSED`. | Existing SEO length warnings may remain. |
| `npm run check:routes --workspace=@camp-for-nepal/frontend` | Root | Route modules and internal links. | No | `ROUTE AND LINK CHECK PASSED`. | Missing page export or broken CMS/internal link. |
| `npm run smoke --workspace=@camp-for-nepal/frontend` | Root | Render route modules through harness. | No | Smoke render passes. | React runtime/render warnings or missing module. |
| `npm run check --workspace=@camp-for-nepal/frontend` | Root | Frontend build + data + routes + smoke. | Writes build output | All subcommands pass. | Any of the above. |

No frontend lint or unit-test script is defined in `frontend/package.json`.

## Backend Commands

| Command | Directory | Purpose | Database | Writes data | Pass condition | Safety note |
| --- | --- | --- | --- | --- | --- | --- |
| `npm run check:backend` | Root | Syntax-check backend source/scripts. | None | No | `syntax OK`. | Safe. |
| `npm run test:backend` | Root | All backend `node --test` suites. | Test DB where integration tests require it. | Test fixtures only | All tests pass. | Ensure test DB env values end in `_test`. |
| `npm run test:auth` | Root | Auth/session/CSRF/role integration and unit tests. | `AUTH_TEST_DATABASE_NAME` | Test fixtures only | 141 tests pass currently. | Never point test DB at production. |
| `npm run test:inquiries` | Root | Inquiry public/CRM/validation tests. | `INQUIRY_TEST_DATABASE_NAME` | Test fixtures only | 187 tests pass currently. | Runs longer than unit tests. |
| `npm run test:media-cms` | Root | Media/event model and service tests. | In-memory/model validation | No persistent app data | 16 tests pass currently. | Safe. |
| `npm run verify:b08` | Root | Media/events/search/print verifier. | None | No | Verification passed. | Safe. |
| `npm run verify:auth` | Root | Runtime auth verifier. | Auth test database | Test fixtures only | Script reports pass. | Requires valid backend env. |
| `npm run verify:inquiries` | Root | Runtime inquiry verifier. | Inquiry test database | Test fixtures only | Script reports pass. | Requires valid backend env. |
| `npm run smoke:public` | Root | Public API smoke. | Configured backend DB | Reads only | Smoke passes. | Requires MongoDB with seeded catalogue. |
| `npm run seed:catalog` | Root | Import/update catalogue seed records. | Configured backend DB | Yes | Completes without orphan/validation errors. | Confirm target DB before running. |
| `npm run seed:catalog:reset` | Root | Remove migrated seed records. | Configured backend DB | Deletes migrated records | Completes only with guard enabled. | Destructive; owner approval required. |

No backend booking test script exists. No npm audit wrapper script exists; use
`npm audit` manually if requested.

## Controlled Server Startup

Backend:

```bash
npm run dev:backend
```

Health check:

```text
GET http://localhost:5000/api/v1/health
```

Shutdown:

- Use `Ctrl-C`.
- Server closes HTTP server, session store, and MongoDB connection.

## Verification Coverage

| Area | Automated coverage | Manual coverage still needed |
| --- | --- | --- |
| Health endpoint | Public smoke/auth tests. | Check deployed URL. |
| Public catalogue | Model tests, smoke, route docs. | Production content review. |
| Authentication | Auth tests and verifier. | Production cookie/CORS environment. |
| Inquiry submission/CRM | Inquiry tests and verifier. | Real form integration once frontend is wired. |
| Direct booking | Frontend checks only. | Backend implementation needed. |
| Reference tracking | Inquiry reference tests. | Customer tracking API/UI not complete. |
| Customer/admin/super-admin access | Frontend route checks and backend role tests. | Manual direct URL role QA. |
| Galleries/media/events/videos/reels | Media tests, verifier, frontend build. | Real assets and browser QA. |
| Global search | Verifier/source review. | Manual role/search QA. |
| Print | Verifier/build. | Browser print preview and Save as PDF. |
| External contact links | Frontend source/data checks. | Manual link checks. |
| 404/error handling | Route checks and backend error tests. | Deployed error page/API check. |
