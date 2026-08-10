# Role Permission Matrix

Backend middleware and route allowlists are authoritative. Frontend menu
visibility and route guards improve usability but are not production
authorization.

## Roles

| Role | Status | Meaning |
| --- | --- | --- |
| Public visitor | Implemented | Anonymous public browsing and public inquiry submission. |
| `customer` | Implemented in auth model; dashboard frontend partial | Registered traveller. Backend customer dashboard APIs are not present yet. |
| `guide` | Compatibility/data role | Managed guide profile role. No backend staff access and no self-service portal. |
| `admin` | Implemented | Operations/content role for current protected backend routes. |
| `super_admin` | Implemented | Explicitly allowed where named; not automatic hierarchy access. |

## Protected Backend Modules

| Module | Read | Create | Update/status | Assignment | Delete/archive | Print | Search | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Auth `/me` | Signed-in user | Public register | Password change/logout | N/A | Logout sessions | N/A | N/A | Registration always creates `customer`. |
| Inquiries CRM | `admin`, `super_admin` | Public inquiry submit | `admin`, `super_admin` | `admin`, `super_admin` | No delete endpoint | Admin print route available | Included in admin search | Public submit is CSRF and rate limited. |
| Media admin | `admin`, `super_admin` | `admin`, `super_admin` | `admin`, `super_admin` | N/A | `admin`, `super_admin` delete if unused | N/A | Included in admin search | Stores references only. |
| Events admin | `admin`, `super_admin` | `admin`, `super_admin` | `admin`, `super_admin` | N/A | `admin`, `super_admin` | Event print public | Included in admin search | Public event reads are available. |
| Admin search | `admin`, `super_admin` | N/A | N/A | N/A | N/A | N/A | `admin`, `super_admin` | `super_admin` can include user results. |
| Admin print | `admin`, `super_admin` | N/A | N/A | N/A | N/A | `admin`, `super_admin` | N/A | Customer, inquiry, departure manifest projections. |

## Public Backend Modules

| Module | Public read | Public write | Private fields protected |
| --- | --- | --- | --- |
| Destinations | Yes | No | `sourceId`. |
| Activities | Yes | No | `sourceId`. |
| Packages/trekking/expeditions | Yes | No | `sourceId`. |
| Fixed departures | Yes list | No | `sourceId`, `internalNotes`. |
| Guides | Yes public profiles | No | Rates, certifications, verification, availability, notes, status controls. |
| Reviews | Yes list | No | `sourceId`; unpublished records excluded. |
| Events | Yes | No | `sourceId`; non-public statuses filtered. |
| Media | Yes | No | creator/updater/source migration metadata excluded. |
| Search | Yes | No | Public search only covers public fields/content. |
| Print | Yes | No | Print projections are allowlisted. |

## Frontend/Backend Mismatches

- Frontend admin UI has broader localStorage CRUD than the backend API
  currently exposes.
- Frontend customer dashboard exists, but backend customer dashboard routes do
  not.
- Frontend booking operations exist, but backend booking model/routes do not.
- Frontend CMS/settings are browser singleton records; backend CMS models/routes
  do not exist.
- Frontend demo audit log exists; backend production audit model is not present.

## Security Rules

- Environment secrets are never shown through the application.
- `super_admin` does not receive raw infrastructure credentials.
- Protected recovery, destructive seed reset, production seeding, and production
  super-admin bootstrap require explicit owner approval outside normal app UI.
