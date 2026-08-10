# API Contract

The agreement between this API and any client. It exists because the frontend
was built against a mock `dataClient` that already returns this exact shape —
so honouring it is what makes the eventual swap a change of internals rather
than a rewrite.

## Base path

```
/api/v1
```

Configured by `API_PREFIX`, must begin with `/`, and is mounted once in
`src/app.js`. Version by adding `/api/v2` alongside; never by changing the
meaning of a `v1` response.

## The envelope

**Every** response uses the same four keys. Success, expected failure, and
unexpected failure all parse identically, so a client needs one code path.

```json
{
  "success": true,
  "message": "",
  "data": null,
  "meta": {}
}
```

| Key | Type | Rule |
| --- | --- | --- |
| `success` | boolean | Always a real boolean. Never a string, never a status code. |
| `message` | string | Written for a person. Empty string on an unremarkable success. |
| `data` | object, array, or null | Object for one record, array for a list, **always `null` on failure**. |
| `meta` | object | Never null. Always carries `requestId`. |

### Success

```json
{
  "success": true,
  "message": "Camp For Nepal API is healthy.",
  "data": { "status": "ok", "database": "connected" },
  "meta": { "requestId": "fc134876-12f4-48c7-a062-b85abee9fac3" }
}
```

HTTP status carries the same meaning as `success`: `2xx` with `success: true`.

### Error

```json
{
  "success": false,
  "message": "No route matches GET /api/v1/nope.",
  "data": null,
  "meta": { "requestId": "fc134876-12f4-48c7-a062-b85abee9fac3" }
}
```

| Status | When |
| --- | --- |
| 400 | Malformed request or failed validation |
| 401 | Not signed in |
| 403 | Signed in but not allowed; also a rejected CORS origin |
| 404 | No such route or record |
| 409 | Conflicts with existing state |
| 413 | Request body over `REQUEST_BODY_LIMIT` |
| 500 | Unexpected server fault |

**In development** an unexpected error may include `meta.stack` to aid
debugging. **In production it never does** — the message is replaced with a
generic sentence and the real error is logged server-side with its request id.
A stack trace, a driver message, or a connection string must never reach a
client.

## meta

`meta` is where everything that is *about* the response lives, so `data` stays
purely the payload.

| Field | Present on | Meaning |
| --- | --- | --- |
| `requestId` | every response | Correlates a response with a server log line |
| `stack` | development, unexpected errors only | Node stack trace |
| `total`, `page`, `pageSize`, `totalPages` | list reads (future) | Pagination |

## Request IDs

Every request is assigned a UUID by `src/middleware/requestContext.js`. It is:

- returned in `meta.requestId`,
- returned in the `X-Request-Id` response header,
- included in the server log for any unexpected error.

A client may send its own `X-Request-Id` and it will be reused, which lets a
call be traced end to end. Supplied values are length-capped and restricted to
safe characters before being echoed.

## Pagination (future shape)

List endpoints use this pagination shape when they support collection reads:

```
?search=&filters=&sort=&direction=&page=1&pageSize=20
```

and return the rows in `data` with counts in `meta`:

```json
{
  "success": true,
  "message": "",
  "data": [ { "id": "pkg-001" } ],
  "meta": {
    "requestId": "…",
    "total": 13,
    "page": 1,
    "pageSize": 20,
    "totalPages": 1
  }
}
```

`pageSize: 0` means "every record", which the frontend's admin screens already
rely on.

## Frontend dataClient compatibility

`frontend/src/lib/dataClient.js` is the only place the frontend touches
business data, and it already resolves to this envelope. Migration replaces its
internals with `fetch` calls and nothing else:

```js
listItems(entity, options)
getItem(entity, idOrSlug)
getSingleton(name)
createItem(entity, values, actor)
updateItem(entity, id, changes, actor)
deleteItem(entity, id, actor)
updateSingleton(name, changes, actor)
resetDemoData()
subscribeDataChanges(listener)
```

Rules that keep that swap cheap:

1. **Do not change these signatures**, and do not change the envelope.
2. Translate HTTP failures into `{ success: false, message, data: null, meta }`.
   Never throw an expected API failure into a component.
3. Keep `subscribeDataChanges` as the cache-invalidation seam.
4. Return the authoritative saved record from create and update calls.
5. Ids are strings. Slugs are unique per collection, and both `getItem(entity, id)`
   and `getItem(entity, slug)` must resolve.

The fuller migration guide lives in the repository's `docs/BACKEND_HANDOFF.md`.

## Current Endpoint Inventory

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/` | Service root; names the API prefix and health path |
| GET | `/api/v1/health` | Liveness plus live database state |

Routes not listed in this contract or the feature-specific API docs return a
structured 404.

## Authentication

Full detail in [AUTHENTICATION.md](AUTHENTICATION.md). What the contract adds:

| Method | Path | Auth |
| --- | --- | --- |
| GET | `/api/v1/auth/csrf-token` | public |
| POST | `/api/v1/auth/register` | public, rate limited |
| POST | `/api/v1/auth/login` | public, rate limited |
| GET | `/api/v1/auth/me` | session |
| POST | `/api/v1/auth/logout` | public, CSRF only |
| POST | `/api/v1/auth/logout-all` | session |
| POST | `/api/v1/auth/change-password` | session |

### Two rules for every client

1. **Send cookies.** `fetch(url, { credentials: 'include' })`. The session
   lives in an `HttpOnly` cookie the browser will not attach otherwise.
2. **Send a CSRF token on every unsafe method.** `GET /auth/csrf-token` returns
   one; put it in an `X-CSRF-Token` header on every `POST`, `PUT`, `PATCH`, and
   `DELETE`. `GET`, `HEAD`, and `OPTIONS` need nothing, so the public catalogue
   is unaffected.

Signing in regenerates the session, which discards the old CSRF token on
purpose. The login and register responses carry the replacement in
`data.csrfToken` — use it from then on.

### The user object

`data.user` on register, login, and `/auth/me`:

```json
{
  "id": "…", "fullName": "…", "email": "…",
  "role": "customer", "status": "active",
  "emailVerifiedAt": null, "lastLoginAt": null, "passwordChangedAt": "…",
  "preferences": {}, "createdAt": "…", "updatedAt": "…"
}
```

`passwordHash`, `failedLoginAttempts`, `lockUntil`, and `sessionVersion` are
never present, on any endpoint, in any environment.

### Status codes

| Code | When |
| --- | --- |
| 400 | Malformed body, or a new password below the policy |
| 401 | Not signed in, wrong credentials, unknown email, or an invalidated session |
| 403 | Missing or invalid CSRF token, a disallowed `Origin`, or a role check refusing |
| 409 | That email is already registered |
| 429 | Rate limited |

**Every sign-in failure returns the same 401 body:**

```json
{ "success": false, "message": "Invalid email or password.", "data": null, "meta": { "requestId": "…" } }
```

A wrong password, an unknown email, a locked account, and a suspended account
are indistinguishable from outside — otherwise the login form becomes a tool for
discovering which addresses have accounts and which are worth attacking.

### Registration body

```json
{
  "fullName": "Example User",
  "email": "user@example.com",
  "password": "long secure password",
  "preferences": { "country": "South Korea", "language": "English", "currency": "USD" }
}
```

`preferences` is optional, and only those three keys are read. `role`,
`status`, and `passwordHash` in the body are **not read at all** — the validator
returns four fields and nothing else, so a request asking for `super_admin`
creates a `customer`.

## Inquiries

Full detail in [INQUIRY_API.md](INQUIRY_API.md).

| Method | Path | Auth |
| --- | --- | --- |
| POST | `/api/v1/inquiries` | public, CSRF, rate limited |
| GET | `/api/v1/inquiries` | admin, super_admin |
| GET | `/api/v1/inquiries/:id` | same |
| PATCH | `/api/v1/inquiries/:id/status` | same |
| PATCH | `/api/v1/inquiries/:id/follow-up` | same |
| POST | `/api/v1/inquiries/:id/notes` | same |
| PATCH | `/api/v1/inquiries/:id/assignment` | admin, super_admin |
| PATCH | `/api/v1/inquiries/:id/priority` | admin, super_admin |

No `DELETE` and no `/convert` exist. Conversion creates a booking, which
belongs to the future booking workflow.

The public response carries three fields and no MongoDB id:

```json
{ "referenceCode": "CFN-2026-7K9Q2M", "status": "new", "submittedAt": "…" }
```

Validation failures put a field map in `meta.errors`:

```json
{ "success": false, "message": "Please correct the highlighted inquiry fields.",
  "data": null, "meta": { "requestId": "…", "errors": { "email": "Enter a valid email address." } } }
```

## Media, Events, Search, And Print (B08)

These routes keep the same envelope and the same auth/session/CSRF model.

| Method | Path | Auth |
| --- | --- | --- |
| GET | `/api/v1/media` | public, published only |
| GET | `/api/v1/admin/media` | admin, super_admin |
| GET | `/api/v1/admin/media/:id` | same |
| POST | `/api/v1/admin/media` | same, CSRF |
| PATCH | `/api/v1/admin/media/:id` | same, CSRF |
| DELETE | `/api/v1/admin/media/:id` | same, CSRF; blocked when used unless an explicit future destructive policy says otherwise |
| GET | `/api/v1/events` | public statuses only |
| GET | `/api/v1/events/:slug` | public statuses only |
| GET | `/api/v1/admin/events` | admin, super_admin |
| GET | `/api/v1/admin/events/:id` | same |
| POST | `/api/v1/admin/events` | same, CSRF |
| PATCH | `/api/v1/admin/events/:id` | same, CSRF |
| DELETE | `/api/v1/admin/events/:id` | same, CSRF |
| GET | `/api/v1/search` | public, published/public content only |
| GET | `/api/v1/admin/global-search` | admin, super_admin; user results limited to super_admin |
| GET | `/api/v1/print/packages/:slug` | public, print-safe projection |
| GET | `/api/v1/print/packages/:slug/itinerary` | public, print-safe projection |
| GET | `/api/v1/print/destinations/:slug` | public, print-safe projection |
| GET | `/api/v1/print/events/:slug` | public, print-safe projection |
| GET | `/api/v1/admin/print/customers/:id` | admin, super_admin |
| GET | `/api/v1/admin/print/inquiries/:id` | admin, super_admin |
| GET | `/api/v1/admin/print/departures/:id/manifest` | admin, super_admin |

Media records store metadata and safe references only. Local video/reel
references are allowed only when the production build includes the file at the
referenced public path. Event routes add no ticketing or payment workflow.

Print responses include `meta.printAuditAction: "print_view_opened"` and
`meta.physicalPrintCompleted: false`. A browser print dialog cannot prove that
paper was printed.
