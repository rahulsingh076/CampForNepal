# Database Schema

The authoritative backend schema details live in
`backend/docs/DATABASE_SCHEMA.md`. This root handover summary lists the actual
Mongoose models present in the repository and the production concerns a
backend developer needs first.

## Conventions

- MongoDB `_id` is exposed as string `id` by JSON transforms or serializers.
- Migrated catalogue records may use private `sourceId` fields.
- Private fields use `select: false` and should also be excluded by serializers
  or JSON transforms.
- Do not include real record data in documentation.

## Models Present

| Model | Collection | File | Purpose | Important fields | Private/internal fields | Indexes/constraints |
| --- | --- | --- | --- | --- | --- | --- |
| `Destination` | `destinations` | `backend/src/modules/destinations/destination.model.js` | Public place/destination content. | `title`, `slug`, `region`, descriptions, media, related packages/guides, `seo`, `status`. | `sourceId`. | Unique `slug`; unique sparse `sourceId`; `status`, `{status, region}`. |
| `Activity` | `activities` | `backend/src/modules/activities/activity.model.js` | Public activity content. | `title`, `slug`, `category`, difficulty, media, related destinations/packages, `seo`, `status`. | `sourceId`. | Unique `slug`; unique sparse `sourceId`; `status`, `category`, `{status, category}`. |
| `Package` | `packages` | `backend/src/modules/packages/package.model.js` | Trips, treks, expeditions, tours. | `title`, `slug`, `type`, related destination/activity ids, price, duration, itinerary, inclusions, `seo`, `status`, `featured`. | `sourceId`. | Unique `slug`; unique sparse `sourceId`; `status/type/featured/region` indexes. |
| `FixedDeparture` | `fixeddepartures` | `backend/src/modules/fixedDepartures/fixedDeparture.model.js` | Dated departure inventory. | `packageId`, dates, seats, price/currency, status, assigned guides. | `sourceId`, `internalNotes`. | Unique sparse `sourceId`; `{packageId, startDate}`, `{status, startDate}`. |
| `Guide` | `guides` | `backend/src/modules/guides/guide.model.js` | Public/admin-managed guide profiles. | `fullName`, `slug`, type, languages, regions, bio, rating, totals, photo/source metadata. | `sourceId`, rates, certifications, verification status, availability status, `publicProfile`, `status`, `internalNotes`. | Unique `slug`; unique sparse `sourceId`; `{status, publicProfile}`. |
| `Review` | `reviews` | `backend/src/modules/reviews/review.model.js` | Published/moderated reviews. | reviewer name/country, rating, title, text, package/guide ids, status, featured, admin reply. | `sourceId`; booking/user ids are present but no Booking model exists. | Unique sparse `sourceId`; status/package/guide indexes. |
| `User` | `users` | `backend/src/modules/users/user.model.js` | Authentication and role identity. | `fullName`, `email`, `role`, `status`, preferences, login timestamps. | `passwordHash`, failed attempts, lock date, `sessionVersion`. | Unique email; role/status indexes. |
| `Inquiry` | `inquiries` | `backend/src/modules/inquiries/inquiry.model.js` | Public inquiry and CRM record. | reference, type, status, priority, source, user id, contact, trip, snapshot, message, callback, consent, assignment, follow-up. | notes/history, idempotency hash, spam signals, submission metadata. | Unique `referenceCode`; unique sparse idempotency hash; status/assignment/follow-up indexes. |
| `MediaAsset` | `mediaassets` | `backend/src/modules/media/mediaAsset.model.js` | Image/video/reel reference records. | title, slug, type, source type/url, thumbnail/embed data, alt, caption, focal position, tags, source/licence, usage, status. | `sourceId`, creator/updater ids. | Unique sparse slug/source id; status/type; text index. |
| `Event` | `events` | `backend/src/modules/events/event.model.js` | Public/admin event records. | title, slug, event type, dates, timezone, venue, descriptions, CTA, related ids, media, status, featured, SEO. | `sourceId`. | Unique `slug`; unique sparse `sourceId`; status/date/featured indexes. |

## Session Store

`connect-mongo` stores Express session documents in MongoDB. The application
session contains only minimal session state such as authenticated user id,
session version, timestamps, and CSRF token. User roles are loaded from the
database for protected requests.

## Models Not Present

- Booking
- Conversation
- Message
- CMS/settings Mongo model
- Audit record model
- Payment model
- Upload/file model

Frontend seed data contains bookings, messages, CMS singletons, notifications,
and audit-log demo records. Those are not backend Mongoose models yet.

## Relationship Map

```text
Package -> Destination[]
Package -> Activity[]
Package -> FixedDeparture[]
Package -> Review[]
Destination -> Package[]
Destination -> Guide[]
Activity -> Destination[]
Activity -> Package[]
FixedDeparture -> Package
FixedDeparture -> Guide[]
Review -> Package
Review -> Guide
Inquiry -> User?
Inquiry -> Package?
Inquiry -> FixedDeparture?
Inquiry -> Guide?
Inquiry -> convertedBookingId? (target model not present)
MediaAsset -> MediaAsset thumbnail?
Event -> Package[]
Event -> Destination[]
User -> Inquiry assignment/history
```

## Migration Concerns

- `sourceId` is internal migration metadata and must not appear in public API
  output.
- Unique constraints are database indexes, not only in-memory validation.
- Guide private commercial/verification fields must not appear in public guide
  responses.
- Inquiry public responses must not expose CRM fields, notes, history, raw
  ObjectIds, idempotency hashes, spam signals, or submission metadata.
- There is no backend Booking model yet; do not design destructive migrations
  from frontend booking seed data without owner approval.
