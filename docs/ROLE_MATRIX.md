# Role Matrix

The backend authority document is `backend/docs/ROLE_MATRIX.md`. This frontend
summary mirrors the current product boundary.

## Canonical Roles

- `customer`
- `guide`
- `admin`
- `super_admin`

## Current Admin Boundary

`admin` handles ordinary company management: customers, inquiries, bookings,
conversations, packages, destinations, activities, departures, guides, media,
events, posts, reviews, website content, contact/social settings, ordinary
reports, and print actions.

`super_admin` can do the admin work and additionally manage users, roles,
owner/security settings, protected audit/privacy operations, and destructive
recovery actions.

There are no separate support, content, booking, or finance admin roles in this
scope. Frontend menu visibility is only convenience; server routes must enforce
authorization.

No web role may view MongoDB URIs, Atlas passwords, session secrets, deployment
credentials, SMTP/social passwords, private environment variables, password
hashes, CSRF tokens, or session internals.
