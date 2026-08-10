# API Route Inventory

Base path is configured by `API_PREFIX`; examples below assume `/api/v1`.
CSRF is global for unsafe methods. Safe methods (`GET`, `HEAD`, `OPTIONS`) do
not require a CSRF token.

## Health

| Method | Path | Purpose | Access | Controller | Service/model | Tests/status |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/api/v1/health` | Health/status response. | Public | `health.controller.js` | No model | Implemented; covered by smoke/auth integration checks. |

## Authentication

| Method | Path | Purpose | Access | CSRF | Rate limit | Controller | Tests/status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GET | `/api/v1/auth/csrf-token` | Issue/read CSRF token. | Public session | No | No | `auth.controller.js` | Implemented; auth tests. |
| POST | `/api/v1/auth/register` | Register customer and sign in. | Public | Yes | Registration limiter | `auth.controller.js` | Implemented; auth tests. |
| POST | `/api/v1/auth/login` | Sign in. | Public | Yes | Login limiter | `auth.controller.js` | Implemented; auth tests. |
| POST | `/api/v1/auth/logout` | End current session. | Public session | Yes | No | `auth.controller.js` | Implemented; auth tests. |
| GET | `/api/v1/auth/me` | Current signed-in user. | Authenticated | No | No | `auth.controller.js` | Implemented; auth tests. |
| POST | `/api/v1/auth/logout-all` | End all sessions for user. | Authenticated | Yes | No | `auth.controller.js` | Implemented; auth tests. |
| POST | `/api/v1/auth/change-password` | Change password and invalidate other sessions. | Authenticated | Yes | No | `auth.controller.js` | Implemented; auth tests. |

## Public Catalogue

| Group | Method | Path | Purpose | Access | Controller | Service/model | Tests/status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Destinations | GET | `/api/v1/destinations` | List published destinations. | Public | `destination.controller.js` | `destination.service.js`, `Destination` | Implemented. |
| Destinations | GET | `/api/v1/destinations/:slug` | Public destination detail. | Public | `destination.controller.js` | `Destination` | Implemented. |
| Activities | GET | `/api/v1/activities` | List published activities. | Public | `activity.controller.js` | `Activity` | Implemented. |
| Activities | GET | `/api/v1/activities/:slug` | Public activity detail. | Public | `activity.controller.js` | `Activity` | Implemented. |
| Packages | GET | `/api/v1/packages` | List published packages. | Public | `package.controller.js` | `Package` | Implemented. |
| Packages | GET | `/api/v1/packages/:slug` | Package detail. | Public | `package.controller.js` | `Package` | Implemented. |
| Packages | GET | `/api/v1/packages/:slug/fixed-departures` | Package departures. | Public | `package.controller.js` | `Package`, `FixedDeparture` | Implemented. |
| Packages | GET | `/api/v1/packages/:slug/reviews` | Package reviews. | Public | `package.controller.js` | `Package`, `Review` | Implemented. |
| Trekking | GET | `/api/v1/trekking`, `/api/v1/trekking/:slug` | Package routes filtered to trekking. | Public | `package.controller.js` | `Package` | Implemented. |
| Expeditions | GET | `/api/v1/expeditions`, `/api/v1/expeditions/:slug` | Package routes filtered to expeditions. | Public | `package.controller.js` | `Package` | Implemented. |
| Fixed departures | GET | `/api/v1/fixed-departures` | List public departures. | Public | `fixedDeparture.controller.js` | `FixedDeparture` | Implemented. |
| Guides | GET | `/api/v1/guides`, `/api/v1/guides/:slug` | Public guide list/detail. | Public | `guide.controller.js` | `Guide` | Implemented. |
| Reviews | GET | `/api/v1/reviews` | Published reviews. | Public | `review.controller.js` | `Review` | Implemented. |

## Inquiries

| Method | Path | Purpose | Access/roles | CSRF/rate | Controller/service | Tests/status |
| --- | --- | --- | --- | --- | --- | --- |
| POST | `/api/v1/inquiries` | Public inquiry submission. | Public | CSRF + inquiry limiter | `inquiry.controller.js`, `inquiry.service.js` | Implemented; inquiry tests. |
| GET | `/api/v1/inquiries` | CRM list. | `admin`, `super_admin` | No CSRF | Inquiry controller/service | Implemented; inquiry tests. |
| GET | `/api/v1/inquiries/:id` | CRM detail. | `admin`, `super_admin` | No CSRF | Inquiry controller/service/serializer | Implemented; inquiry tests. |
| PATCH | `/api/v1/inquiries/:id/status` | Controlled status transition. | `admin`, `super_admin` | CSRF | Inquiry service | Implemented; inquiry tests. |
| PATCH | `/api/v1/inquiries/:id/follow-up` | Set/clear follow-up. | `admin`, `super_admin` | CSRF | Inquiry service | Implemented; inquiry tests. |
| POST | `/api/v1/inquiries/:id/notes` | Append internal note. | `admin`, `super_admin` | CSRF | Inquiry service | Implemented; inquiry tests. |
| PATCH | `/api/v1/inquiries/:id/assignment` | Assign/unassign handler. | `admin`, `super_admin` | CSRF | Inquiry service | Implemented; inquiry tests. |
| PATCH | `/api/v1/inquiries/:id/priority` | Change priority. | `admin`, `super_admin` | CSRF | Inquiry service | Implemented; inquiry tests. |

## Media And Events

| Group | Method | Path | Purpose | Access/roles | Controller/service | Tests/status |
| --- | --- | --- | --- | --- | --- | --- |
| Media | GET | `/api/v1/media` | Public media list. | Public | `mediaAsset.controller.js`, `mediaAsset.service.js` | Implemented; media tests. |
| Media | GET | `/api/v1/admin/media` | Admin media list. | `admin`, `super_admin` | Media service/serializer | Implemented; media tests. |
| Media | GET | `/api/v1/admin/media/:id` | Admin media detail. | `admin`, `super_admin` | Media service/serializer | Implemented. |
| Media | POST | `/api/v1/admin/media` | Create media reference. | `admin`, `super_admin`; CSRF | Media service | Implemented. |
| Media | PATCH | `/api/v1/admin/media/:id` | Update media reference. | `admin`, `super_admin`; CSRF | Media service | Implemented. |
| Media | DELETE | `/api/v1/admin/media/:id` | Delete unused media reference. | `admin`, `super_admin`; CSRF | Media service | Implemented. |
| Events | GET | `/api/v1/events`, `/api/v1/events/:slug` | Public event list/detail. | Public | `event.controller.js`, `event.service.js` | Implemented; media/event tests. |
| Events | GET/POST/PATCH/DELETE | `/api/v1/admin/events` and `/:id` | Admin event management. | `admin`, `super_admin`; CSRF for unsafe methods | Event service/serializer | Implemented. |

## Search

| Method | Path | Purpose | Access | Controller/service | Tests/status |
| --- | --- | --- | --- | --- | --- |
| GET | `/api/v1/search` | Public search over safe public content. | Public | `search.controller.js`, `search.service.js` | Implemented; verifier. |
| GET | `/api/v1/admin/global-search` | Role-filtered admin search. | `admin`, `super_admin` | Search service | Implemented; verifier. |

## Print

| Method | Path | Purpose | Access/roles | Controller/service | Tests/status |
| --- | --- | --- | --- | --- | --- |
| GET | `/api/v1/print/packages/:slug` | Public package print data. | Public | `print.controller.js`, `print.service.js` | Implemented; verifier. |
| GET | `/api/v1/print/packages/:slug/itinerary` | Public itinerary print data. | Public | Print service | Implemented. |
| GET | `/api/v1/print/destinations/:slug` | Destination print data. | Public | Print service | Implemented. |
| GET | `/api/v1/print/events/:slug` | Event print data. | Public | Print service | Implemented. |
| GET | `/api/v1/admin/print/customers/:id` | Admin customer print projection. | `admin`, `super_admin` | Print service | Implemented; verifier. |
| GET | `/api/v1/admin/print/inquiries/:id` | Admin inquiry print projection. | `admin`, `super_admin` | Print service | Implemented. |
| GET | `/api/v1/admin/print/departures/:id/manifest` | Departure manifest projection. | `admin`, `super_admin` | Print service | Implemented. |

## Expected But Not Implemented

- Booking API routes.
- Customer dashboard API routes.
- Conversation/message API routes.
- CMS singleton backend write routes.
- Admin catalogue write routes for destinations, activities, packages,
  departures, guides, and reviews.
- Production audit/privacy request routes.
- Backend gallery-specific route; gallery data is embedded in content/media
  records.
