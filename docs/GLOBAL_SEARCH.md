# Global Search

Global search is split by audience. It must never become a generic query over
every collection and every field.

## Public Search

The public frontend search opens in-page from the header. Backend
`GET /api/v1/search` includes only safe public content:

- published packages
- published destinations
- published activities
- public guides
- published posts/updates on the frontend
- public events
- published video/reel media

No customer, booking, inquiry, staff, audit, session, CSRF, environment, or
security data is included.

## Admin Search

The admin frontend search opens in-page from the admin header. Backend
`GET /api/v1/admin/global-search` is permission-filtered. Admin can search
ordinary operational and content records. Super admin additionally sees user
records.

Search result descriptions are allowlisted summaries, not raw documents.

## Customer Search

Customer-owned search remains scoped to the customer dashboard and must only
return that customer's own visible booking, inquiry, and conversation data when
implemented against the backend.

## Abuse Safety

Search terms are trimmed, length-limited, and regex-escaped. Query objects are
not forwarded into Mongoose, so operator injection attempts are rejected before
they reach a database query.
