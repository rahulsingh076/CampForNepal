# Frontend To Backend Contract

The frontend currently calls `frontend/src/lib/dataClient.js` rather than
backend modules directly. Future integration should replace `dataClient`
internals with HTTP requests while preserving public function names and the
standard result shape:

```json
{ "success": true, "message": "", "data": null, "meta": {} }
```

## Core Function Map

| Function | Arguments | Current source | Target HTTP/API | Auth/role | Status | Migration note |
| --- | --- | --- | --- | --- | --- | --- |
| `listItems(entity, options)` | Collection name, query/sort/pagination options. | Seed data plus localStorage overlay. | `GET /api/v1/<entity>` for implemented public reads; admin variants for media/events/search; many entities missing. | Depends on entity. | Partial backend coverage. | Map entity names to concrete endpoints; preserve `meta` pagination. |
| `getItem(entity, idOrSlug)` | Collection name, id or slug. | Seed/overlay lookup by id or slug. | `GET /api/v1/<entity>/:slug` for public slug resources; admin id endpoints for media/events only. | Depends on entity. | Partial backend coverage. | Slug and id lookups must not be confused. |
| `getSingleton(name)` | Singleton key. | Frontend singleton seed/overlay. | Planned CMS/settings endpoint. | Admin for writes; public for published reads where applicable. | No backend endpoint. | Keep singleton schema stable before API design. |
| `createItem(entity, values, actor)` | Collection, values, actor. | Frontend write validation and overlay. | Existing backend create only for inquiries, admin media, admin events. | Public inquiry or admin/super_admin. | Partial backend coverage. | Generic function needs an entity endpoint map. |
| `updateItem(entity, id, changes, actor)` | Collection, id, patch, actor. | Overlay update plus mock audit. | Existing backend update only for inquiry CRM, admin media, admin events. | Admin/super_admin where present. | Partial backend coverage. | Backend must reject privileged fields and return envelope errors. |
| `deleteItem(entity, id, actor)` | Collection, id, actor. | Overlay delete plus mock audit. | Existing backend delete only for admin media/events. | Admin/super_admin. | Partial backend coverage. | Inquiries intentionally have no delete endpoint. |
| `updateSingleton(name, changes, actor)` | Singleton key, patch, actor. | Overlay singleton update. | Planned CMS/settings endpoint. | Admin/super_admin depending singleton. | No backend endpoint. | Do not expose secrets through settings APIs. |
| `resetDemoData()` | None. | Clears browser overlay. | No production target. | Demo-only. | Obsolete after API migration. | Keep only for demo/local builds if needed. |
| `subscribeDataChanges` | Listener callback. | Browser event emitter. | No direct backend target. | N/A. | Frontend-only. | Replace with refetch, cache invalidation, or realtime later if required. |
| `createInquiry(values)` | Public form values. | Calls frontend `createItem('inquiries')`. | `POST /api/v1/inquiries`. | Public + CSRF + rate limit. | Backend implemented; frontend not wired. | Backend returns reference/status/timestamp; frontend currently stores richer mock row. |
| `convertInquiryToBooking(...)` | Inquiry, package/departure ids, actor. | Frontend overlay. | Planned booking conversion endpoint. | Admin/super_admin. | No backend endpoint. | Backend must create booking atomically when implemented. |
| `moveBookingStatus(...)` | Booking, next status, note, actor. | Frontend overlay. | Planned booking status endpoint. | Admin/super_admin. | No backend endpoint. | Current product uses `booked` and `cancelled`. |

## Entity Coverage

| Entity | Public backend read | Backend write | Frontend status |
| --- | --- | --- | --- |
| `destinations` | Implemented | Not implemented | Frontend list/detail/admin CRUD use dataClient. |
| `activities` | Implemented | Not implemented | Frontend list/detail/admin CRUD use dataClient. |
| `packages` | Implemented | Not implemented | Frontend package/trek/expedition/admin CRUD use dataClient. |
| `fixedDepartures` | Implemented list | Not implemented | Frontend uses dataClient. |
| `guides` | Implemented | Not implemented | Frontend uses dataClient. |
| `reviews` | Implemented list | Not implemented | Frontend moderation uses dataClient. |
| `inquiries` | Public create implemented | CRM implemented | Frontend not connected. |
| `bookings` | Not implemented | Not implemented | Frontend-only. |
| `users` | Auth user model only | Auth endpoints only | Frontend user admin is demo-only. |
| `mediaAssets` | Public/admin implemented | Admin create/update/delete implemented | Frontend not connected. |
| `events` | Public/admin implemented | Admin create/update/delete implemented | Frontend not connected. |
| CMS singletons | Not implemented | Not implemented | Frontend-only. |

## Request And Session Rules

- Future API requests must send cookies with credentials enabled.
- Unsafe methods must include the CSRF token from `GET /api/v1/auth/csrf-token`.
- Login/register/password changes rotate session and CSRF state.
- Public reads need no authentication.
- Admin writes require backend role checks; frontend menus are not sufficient.

## Query Behavior

- Pagination should map to `page`, `pageSize`, `total`, `totalPages` in `meta`.
- Filters and sorting must be allowlisted per endpoint.
- Public search only returns public content.
- Admin search is role-filtered.
- Slug lookups are for public content; admin APIs generally use ids.
- Locale and currency in the frontend are display preferences. They do not
  convert stored prices or alter backend canonical values.

## Media And Print

- File/media fields store safe URLs or local build paths, not uploaded binary
  content.
- Local media references should point to shipped files under public media/image
  folders.
- Print data endpoints exist for public package/destination/event views and
  admin customer/inquiry/manifest projections.

## Contract Gaps

- No frontend API request helper exists yet.
- `dataClient` is generic by entity, while backend routes are concrete.
- Public inquiry backend response is intentionally smaller than the frontend
  demo inquiry record.
- Backend booking, customer dashboard, conversation, CMS singleton, audit, and
  most admin catalogue write endpoints are missing.
- Frontend localStorage audit records do not map to a production audit model.
- Some frontend fields use browser/demo shapes that require mapping before API
  integration; see `backend/docs/FRONTEND_FIELD_MAPPING.md` and
  `backend/docs/FRONTEND_INQUIRY_MAPPING.md`.
