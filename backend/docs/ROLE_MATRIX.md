# Role matrix

The Camp For Nepal roles and what each one may do on the server.

These are the same names the frontend uses, so a role means one thing across
the whole product.

---

## The roles

| Role | Who they are |
| --- | --- |
| `customer` | A traveller. Everyone who registers is this |
| `guide` | A guide with a profile on the site; no self-service portal in this scope |
| `admin` | Runs the operations panel: content, inquiries, bookings, media, events, search, and print |
| `super_admin` | Everything, including managing administrators |

`STAFF_ROLES` is `admin` and `super_admin` — the operations panel as a whole.

---

## There is no hierarchy

Roles are a **flat list checked against an explicit allowlist**, not levels.

```js
router.patch('/packages/:id', requireAuth, requireRole('admin'), handler)
```

`super_admin` is not on that list, so `super_admin` cannot reach that route
until somebody adds it. That is deliberate.

With numeric levels — `if (user.level >= 3)` — inserting a new role in the
middle silently grants it everything above that number, and nobody notices
until it is a problem. An allowlist can only ever be wrong in the safe
direction: a role that should have access does not have it yet, which shows up
immediately as a support ticket rather than as a breach.

The cost is that every privileged route has to name its roles. That is the
point.

---

## What exists today

Authentication and authorization primitives are live. Public catalogue, inquiry
CRM, media/event CMS, global search, and print-safe projection routes now use
those primitives where they are not public.

| Route | Requirement |
| --- | --- |
| `GET /auth/csrf-token` | public |
| `POST /auth/register` | public, rate limited |
| `POST /auth/login` | public, rate limited |
| `GET /auth/me` | `requireAuth` |
| `POST /auth/logout` | public, CSRF only — see below |
| `POST /auth/logout-all` | `requireAuth` |
| `POST /auth/change-password` | `requireAuth` |
| `GET /health`, `GET /destinations`, `/activities`, `/packages`, `/trekking`, `/expeditions`, `/fixed-departures`, `/guides`, `/reviews`, `/events`, `/media`, `/search`, `/print/...` | public, read only |

`POST /auth/logout` is public on purpose. Signing out has no side effect worth
guarding with a 401, and refusing it because the session already lapsed makes
the button fail for exactly the person who wanted it. CSRF still applies.

Inquiry routes use `requireRole`:

| Route | Roles |
| --- | --- |
| `POST /inquiries` | public |
| `GET /inquiries`, `GET /inquiries/:id` | admin, super_admin |
| `PATCH /inquiries/:id/status`, `/follow-up`, `POST /:id/notes` | same two |
| `PATCH /inquiries/:id/assignment`, `/priority` | admin, super_admin |

`customer` and `guide` have no inquiry access at all. See
[CRM_WORKFLOW.md](CRM_WORKFLOW.md).

B08 adds media, event, global search, and print routes:

| Route | Roles |
| --- | --- |
| `/admin/media`, `/admin/events` | admin, super_admin |
| `/admin/global-search` | admin, super_admin; user results limited to super_admin |
| `/admin/print/customers/:id` | admin, super_admin |
| `/admin/print/inquiries/:id` | admin, super_admin |
| `/admin/print/departures/:id/manifest` | admin, super_admin |

`admin` is the ordinary operations manager. `super_admin` is reserved for users,
roles, owner/security settings, destructive recovery, and protected
privacy/audit operations. No role can view environment secrets.

## Public registration creates a customer. Only a customer.

`POST /auth/register` never reads `role` or `status` from the request body.
`validateRegistration` returns exactly four fields — `fullName`, `email`,
`password`, `preferences` — so a body asking for `super_admin` is not rejected
so much as **not seen**.

Two tests hold that line: one on the validator's returned keys, and one over
HTTP that registers with `role: 'super_admin'` and then reads the **stored**
record back to confirm it says `customer`.

The only way to a privileged role is `npm run bootstrap:super-admin` (once,
behind a flag) or future protected user-management work.

---

## Intended allocation

| Area | Roles that should reach it |
| --- | --- |
| Own bookings, own profile | `customer` (own records only) |
| Own guide profile and availability | Future `guide` portal only; no self-service portal in this scope |
| Enquiries and customer messages | `admin`, `super_admin` |
| Catalogue and CMS content | `admin`, `super_admin` |
| Bookings and departures | `admin`, `super_admin` |
| Users and role assignment | `super_admin` for role/security ownership; frontend demo still lets admin view ordinary customer operations |
| Creating or removing administrators | `super_admin` |

"Own records only" is an ownership check, not a role check. A `customer` may
read *their* booking, not any booking — that comparison belongs in the service
layer, alongside the role check rather than instead of it.

---

## How the checks work

```js
import requireAuth from '../middleware/requireAuth.js'
import requireRole, { requireStaff } from '../middleware/requireRole.js'

router.get('/reports', requireAuth, requireRole('admin'), handler)
router.get('/panel',   requireAuth, requireStaff(), handler)
```

- **`requireAuth` first, always.** It loads the user from the database and
  attaches `req.user`.
- `requireRole` refuses with **401** when `req.user` is missing. An
  authorization check that quietly passes because authentication was left off
  the route is worse than no check at all.
- An unknown role name passed to `requireRole` **throws at boot**, so a typo is
  a five-second fix instead of a route nobody can reach.
- A refusal is a plain **403** that never names the roles that would have
  worked — that list is a map of the admin surface.

### Frontend menu visibility is not authorization

The React app hides links a role should not see. That is a courtesy for the
person using it, not a security boundary — anybody can call the API directly
with curl. Every rule that matters is the one in `requireRole`, on the server,
enforced against the role read from MongoDB on that request.

If a check exists only in the frontend, it does not exist.

### Guide self-service is deferred

`guide` is a valid role and the `Guide` catalogue model exists, but there is no
route yet that lets a guide edit their own profile or availability, and no link
between a `User` with `role: 'guide'` and a `Guide` record. That association is
future guide self-service work, and it needs an ownership check — "this guide, not any
guide" — in the service layer alongside the role check.

### Protected admin workflows need explicit allowlists

Some admin API routes now exist for inquiries, media, events, search, and print.
Future booking, customer, CMS, and reporting APIs must keep the same pattern:
name every allowed role on the route, then apply ownership or result filtering
inside the service where needed.

### The role is never trusted from the session

`requireAuth` reads the user — role and status included — from MongoDB on every
request. The session holds only an id and a version number.

So a demotion, a promotion, or a suspension takes effect on the **next request**.
A role cached in the session would survive until the user happened to sign in
again, which is exactly how a revoked administrator keeps their access.
