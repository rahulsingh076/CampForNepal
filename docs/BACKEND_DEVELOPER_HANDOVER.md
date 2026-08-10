# Backend Developer Handover

## A. Project Context

Camp For Nepal is a tourism discovery, inquiry, booking request,
customer-service, and content-management platform for travel in Nepal.

Active scope:

- Public discovery for destinations, activities, packages, treks, expeditions,
  fixed departures, guides, media, events, reviews, search, and print.
- Public inquiry submission.
- Frontend customer dashboard and admin UI using browser demo data.
- Backend public catalogue reads, authentication, inquiry CRM, media/events,
  search, print-safe projections, and seed migration.

Excluded scope:

- Online payments, payment proofs, invoices, refunds, and payment statuses.
- Backend email delivery, Gmail/SMTP integration, and social messaging APIs.
- Binary media/document uploads.
- Guide self-service portal.

Current frontend/backend relationship:

- Frontend components call `frontend/src/lib/dataClient.js`.
- The frontend is not broadly wired to backend HTTP APIs yet.
- The backend should replace `dataClient` internals in a future integration
  without changing frontend public function names.

Deployment state:

- Frontend Vercel project metadata exists under `frontend/.vercel/`.
- Backend deployment configuration is not present in the repository.

## B. Backend Stack

Versions from current package manifests:

| Tool/package | Version |
| --- | --- |
| Backend Node engine | `>=24.0.0` |
| Express | `5.2.1` |
| Mongoose | `8.24.2` |
| connect-mongo | `6.0.0` |
| express-session | `1.19.0` |
| argon2 | `0.45.1` |
| express-rate-limit | `8.6.2` |
| helmet | `8.3.0` |
| cors | `2.8.6` |
| supertest | `7.2.2` |

Runtime uses JavaScript ES modules and Node's built-in `--env-file` loading.

## C. Starting Paths

| Area | Path |
| --- | --- |
| App entry | `backend/src/app.js` |
| Server entry | `backend/src/server.js` |
| Environment validation | `backend/src/config/env.js` |
| Database connection | `backend/src/config/database.js` |
| Session config | `backend/src/config/session.js` |
| CORS config | `backend/src/config/cors.js` |
| Route registration | `backend/src/routes/index.js` |
| Response helpers | `backend/src/utils/response.js` |
| Error handling | `backend/src/middleware/errorHandler.js` |
| Models | `backend/src/modules/*/*.model.js`, `backend/src/modules/users/user.model.js` |
| Services | `backend/src/modules/*/*.service.js` |
| Controllers | `backend/src/modules/*/*.controller.js` |
| Serializers | `backend/src/modules/inquiries`, `media`, `events` serializer files |
| Validators | `backend/src/modules/*/*.validation.js`, `backend/src/database/validators.js` |
| Constants | `backend/src/constants/` |
| Scripts | `backend/scripts/` |
| Tests | `backend/tests/` |
| Documentation | `backend/docs/`, `docs/` |

## D. API Contract

Every response uses:

```json
{ "success": true, "message": "", "data": null, "meta": {} }
```

| Case | Shape |
| --- | --- |
| List response | `data` array plus pagination/filter metadata in `meta`. |
| Detail response | `data` object. |
| Validation error | `success:false`, human message, `data:null`, `meta.requestId`. |
| Authentication error | 401, generic message, no private auth detail. |
| Authorization error | 403, message does not reveal allowed roles. |
| Not found | 404, does not reveal hidden draft/private existence. |
| Conflict | 409 for stale concurrent updates/idempotency conflicts. |
| Rate limit | 429 with standard envelope and generic message. |

## E. Frontend Integration Contract

Frontend components call dataClient methods. See
`docs/FRONTEND_BACKEND_CONTRACT.md` for the full mapping.

Smallest useful migration path:

1. Add a frontend API request helper that includes credentials.
2. Add CSRF token acquisition and unsafe-method header handling.
3. Wire one read-only public entity behind `listItems`/`getItem`.
4. Preserve returned envelope shape and loading/error behavior.
5. Expand entity by entity.

## F. Authentication

Implemented flow:

- `GET /api/v1/auth/csrf-token` creates or returns a CSRF token.
- `POST /api/v1/auth/register` creates a customer and signs in.
- `POST /api/v1/auth/login` signs in with a regenerated session id.
- `POST /api/v1/auth/logout` ends the current session.
- `POST /api/v1/auth/logout-all` invalidates every session for the user.
- `POST /api/v1/auth/change-password` checks current password, updates hash,
  and invalidates other sessions.
- `GET /api/v1/auth/me` returns the current signed-in user.

Security behavior:

- Sessions are stored in MongoDB.
- Session stores user id/version, not role or password data.
- Roles/status are loaded from `User` on protected requests.
- Account lockout and suspended-account refusal are implemented.
- Auth and inquiry tests use configured `_test` databases.

## G. Role Model

Actual roles:

- `customer`: default registered user.
- `guide`: retained profile/data role; no staff access.
- `admin`: active admin/operations role.
- `super_admin`: active protected admin role where explicitly allowed.

Old specialized staff roles are not active. Keep compatibility migrations only
where existing browser data or stored records require them.

## H. Data Models

Backend models:

- Destination
- Activity
- Package
- FixedDeparture
- Guide
- Review
- User
- Inquiry
- MediaAsset
- Event

Detailed schema summary: `docs/DATABASE_SCHEMA.md`. Full backend reference:
`backend/docs/DATABASE_SCHEMA.md`.

Important private fields include user password hashes/session counters, guide
rates/verification/notes, fixed-departure notes, inquiry internal notes/history,
idempotency hashes, spam signals, submission metadata, media creator/updater
ids, and all `sourceId` migration fields.

## I. Existing Modules

| Module | Behavior | Permissions | Tests/verification | Limitations |
| --- | --- | --- | --- | --- |
| Health | Public health response. | Public | Smoke/auth checks | None material. |
| Auth | Register/login/logout/me/password/session security. | Public/authenticated | `test:auth`, `verify:auth` | No password reset/email verification. |
| Catalogue | Public reads for destinations, activities, packages, departures, guides, reviews. | Public | Model tests, public smoke | Admin writes not implemented for most catalogue entities. |
| Inquiries | Public submission and staff CRM. | Public submit; admin/super_admin CRM | `test:inquiries`, `verify:inquiries` | Frontend not wired; no booking conversion endpoint. |
| Media | Public media list, admin CRUD references. | Public/admin/super_admin | `test:media-cms`, `verify:b08` | No binary uploads. |
| Events | Public event reads, admin CRUD. | Public/admin/super_admin | `test:media-cms`, `verify:b08` | Production event content needs owner approval. |
| Search | Public and admin global search. | Public/admin/super_admin | `verify:b08` | Frontend search is browser-side overlay today. |
| Print | Public/admin print-safe projections. | Public/admin/super_admin | `verify:b08` | Browser print output needs manual QA. |

## J. Current Work Remaining

- Add frontend API request helper and connect `dataClient` gradually.
- Add backend booking/customer/conversation APIs.
- Add production admin write APIs for catalogue/CMS/reviews where needed.
- Decide whether customer document metadata remains in simplified scope.
- Deploy backend and configure production environment.
- Finalize production content, media sources/licences, privacy policy version,
  retention policy, backups, and owner access.

## K. First Recommended Developer Task

Task: connect one read-only public resource through `dataClient`, starting with
destinations.

Why:

- Public destination list/detail backend endpoints already exist.
- It tests API helper, envelope preservation, pagination, loading/error states,
  CORS/credentials assumptions, and route behavior without touching protected
  writes.

Starting paths:

- `frontend/src/lib/dataClient.js`
- new frontend API request helper path to be chosen under `frontend/src/lib/`
- `backend/src/modules/destinations/`
- `backend/docs/API_CONTRACT.md`
- `docs/FRONTEND_BACKEND_CONTRACT.md`

Tests:

- `npm run check:routes --workspace=@camp-for-nepal/frontend`
- `npm run validate:data --workspace=@camp-for-nepal/frontend`
- `npm run build --workspace=@camp-for-nepal/frontend`
- `npm run check:backend`
- backend public smoke if a backend database is available

Owner input:

- Confirm backend base URL/origin for local and staging.
- Confirm whether frontend should keep browser fallback data during migration.

Done criteria:

- Destination list/detail pages render from backend data in the target
  environment.
- `dataClient` callers and envelope shape remain unchanged.
- Public route behavior, loading, empty, and error states remain intact.

## L. Change Safety

- Never run destructive seed reset without explicit owner approval.
- Never test against production databases.
- Never commit `.env`.
- Never expose private fields or secrets.
- Never bypass `dataClient` without coordinated frontend changes.
- Never add payment, removed integrations, or binary uploads without an
  approved scope change.
