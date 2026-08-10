# Database Schema

Catalogue, media, event, auth, and CRM models used by the backend. Earlier
backend work began with schemas only; the current backend also includes read/write
services for inquiries, media, events, search, and print-safe projections.

Field-by-field provenance, and every place the backend differs from the
frontend, is in [FRONTEND_FIELD_MAPPING.md](FRONTEND_FIELD_MAPPING.md).

## Conventions

| Concern | Rule |
| --- | --- |
| Identifier | MongoDB `_id`, exposed as `id` (string) in JSON. No second public id. |
| Timestamps | `createdAt` / `updatedAt` on every model, via `timestamps: true`. |
| Version key | Disabled. `__v` never appears. |
| Strict mode | On. A field not in the schema is rejected, not quietly stored. |
| `minimize` | Off, so an empty nested object (`seo`, `mapInfo`) is kept rather than stripped — the frontend expects the shape to exist. |
| Embedded docs | `_id: false`. An itinerary day is a value, not a record. |
| Model names | Singular (`Package`), explicit collection names (`packages`). |
| Registration | `mongoose.models.X || mongoose.model('X', schema, 'collection')`, so `node --watch` reloads cannot throw `OverwriteModelError`. |
| Relations | `ObjectId` with a **string** `ref`, which avoids circular imports. |
| Populate | No automatic populate middleware. A service asks for relations explicitly. |

### JSON output

`src/database/schemaOptions.js` holds one transform used by every model:

```json
{
  "id": "6710f2c4a3b1d2e4f5a6b7c8",
  "title": "Everest Base Camp Trek",
  "slug": "everest-base-camp-trek",
  "createdAt": "2026-08-05T09:12:44.101Z",
  "updatedAt": "2026-08-05T09:12:44.101Z"
}
```

It converts `_id` to a string `id`, removes `_id` and `__v`, includes virtuals,
and **removes every path marked `select: false`**.

That last step matters more than it looks. `select: false` stops a *query*
loading a field, but a document constructed in memory still materialises any
path with a default — and Mongoose gives every array path a default of `[]`. A
freshly built guide would otherwise serialise `certifications: []` and
`verificationStatus: 'pending'`. Stripping in the transform makes the guarantee
structural rather than dependent on how the document was obtained. The document
itself still holds the value for services that legitimately need it.

The transform mutates the plain object Mongoose supplies, never the document.

## Enums

Centralised in `src/constants/`, exported frozen, never re-typed in a model.

| Constant | Values |
| --- | --- |
| `CONTENT_STATUSES` | `draft`, `published`, `hidden`, `archived` (default `draft`) |
| `PACKAGE_TYPES` | `tour`, `trekking`, `expedition` |
| `GUIDE_TYPES` | `trekking`, `expedition`, `cultural`, `naturalist` |
| `DIFFICULTY_LEVELS` | `easy`, `easy to moderate`, `moderate`, `challenging`, `strenuous`, `strenuous and technical`, `extreme` |
| `DEPARTURE_STATUSES` | `draft`, `booking_open`, `almost_full`, `guaranteed`, `closed`, `cancelled`, `completed` |
| `VERIFICATION_STATUSES` | `pending`, `verified`, `rejected`, `expired` |
| `AVAILABILITY_STATUSES` | `available`, `on_trip`, `unavailable` |
| `REVIEW_STATUSES` | `pending`, `published`, `rejected` (default `pending`) |
| `MEDIA_TYPES` | `image`, `video`, `reel` |
| `MEDIA_SOURCE_TYPES` | `local_asset`, `external_url`, `youtube`, `vimeo`, `instagram`, `facebook` |
| `MEDIA_STATUSES` | `draft`, `published`, `hidden`, `archived` |
| `EVENT_STATUSES` | `draft`, `published`, `cancelled`, `completed`, `archived` |

**Canonical values only.** The database stores `booking_open`; the interface
renders "Booking open". A presentation label is never stored in a status field.

`category` on Activity and Package is deliberately **not** an enum — the seed
values are open-ended and an editor must be able to add one without a code
change.

## Media values

Destination, Activity, and Package media fields accept the legacy frontend
gallery string shape and the richer public media object shape. The object may
carry `type`, `sourceType`, `src`, `thumbnailSrc`, `alt`, `caption`,
`focalPosition`, `photographer`, `sourceName`, `sourceReference`, `sourceUrl`,
`licenceName`, `licenceUrl`, `mediaId`, `day`, and `season`. Images may use
site-relative `/images/...` paths or safe external URLs. Videos and reels are
stored as external URLs unless `sourceType === 'local_asset'`, in which case
the URL must be a shipped site-relative path such as `/media/library/file.mp4`.
No video binary is stored in MongoDB.

Current seed records still use the demo image paths. Captions, credits,
licence fields, seasonal media, before/after media, and video/reel links are
owner-supplied content and must not be invented during migration.

## Public and private fields

Only two models carry private data. Everything listed as private is
`select: false` **and** stripped by the JSON transform.

| Model | Private field | Why |
| --- | --- | --- |
| User | `passwordHash` | The one field worth stealing |
| User | `failedLoginAttempts`, `lockUntil` | Reveal how close an account is to lockout |
| User | `sessionVersion` | Internal session invalidation counter |
| Guide | `pricePerDay`, `currency`, `priceBasis` | Commercially sensitive day rate |
| Guide | `certifications` | Licence names |
| Guide | `verificationStatus` | Public output derives a boolean badge instead |
| Guide | `availabilityStatus` | Operational state |
| Guide | `publicProfile`, `status` | Visibility control, not content |
| Guide | `internalNotes` | Staff notes |
| FixedDeparture | `internalNotes` | Staff notes |
| MediaAsset | `createdByUserId`, `updatedByUserId` | Staff identity is operational metadata, not public media content |

Everything else on every model is public.

**Never stored in any model:** plaintext passwords, passport or identity
numbers, bank or card details, payment details, or raw identity documents. A
password exists only as an Argon2id hash on `User`.
Guide verification *documents* belong in a separate private collection with its
own access rules when verification storage is implemented — this model holds a
status, not a file.

## Models

### Destination — `destinations`

Place records. `title`, `slug`, and `region` required; `region` because every
seed record has one and the listing groups by it.

Embeds `mapInfo` (latitude −90..90, longitude −180..180, elevation, nearest
airport) and `seo`. References Package and Guide.

**Indexes:** `slug` (unique), `status`, `{ status, region }`.

### Activity — `activities`

Things to do. Canonical `difficulty`, free-text `category`. References
Destination and Package.

**Indexes:** `slug` (unique), `status`, `category`, `{ status, category }`.

### Package — `packages`

The largest model. `title`, `slug`, `type`, and `price` required.

Embeds `duration {days,nights}`, `groupSize {min,max}`, `itinerary[]`, `faq[]`,
`reviewsSummary`, `seo`. References Destination and Activity.

Cross-field rules, both `pre('validate')` hooks because each compares two
fields:

- `discountPrice` must not exceed `price`.
- Numbered itinerary days must ascend. Entries whose `day` is a range label
  (`'12-18'`) are skipped rather than rejected — `pkg-009` needs them.

**Indexes:** `slug` (unique), `status`, `type`, `region`,
`{ status, featured }`, `{ status, type }`.

### FixedDeparture — `fixeddepartures`

Scheduled group departures. `packageId`, `startDate`, `endDate`, and
`totalSeats` required.

Rules: `endDate` must not precede `startDate` (same day is allowed — the
helicopter tour is a one-day departure); `bookedSeats` must not exceed
`totalSeats`; both seat counts are non-negative integers.

**Virtual `seatsLeft`** = `totalSeats - bookedSeats`, clamped at zero so
inconsistent data can never show a negative seat count to a visitor.

**Indexes:** `status`, `{ packageId, startDate }`, `{ status, startDate }`.

### Guide — `guides`

Public profile plus private staff fields. Listed publicly only when
`publicProfile === true` **and** `status === 'published'`.

`rating` 0–5 and `totalReviews` are cached aggregates over published reviews,
recomputed server-side.

**Indexes:** `slug` (unique), `status`, `{ status, publicProfile }`.

### Review — `reviews`

`customerName`, `rating`, and `reviewText` required. Rating is **1–5** for an
individual review; only aggregates may be 0.

At least one of `packageId` / `guideId` must be present. `userId` and
`bookingId` are `ObjectId` **without a `ref`**, because referencing an
unregistered model makes a future `populate()` throw `MissingSchemaError`; the
refs are added with those models.

`status` defaults to `pending`, so nothing publishes itself. **Unpublished and
rejected reviews must never appear publicly** — the schema stores that state,
and the read service will enforce it.

**Indexes:** `status`, `{ status, packageId, createdAt }`,
`{ status, guideId, createdAt }`.

### MediaAsset — `mediaassets`

Searchable image/video/reel reference library.

Required: `title`, `type`, `sourceType`, and `sourceUrl`. `slug` is unique when
present. `sourceType` validates the source: provider records must use matching
provider hosts, external records must use a safe external URL, and local assets
must use safe site-relative paths. Thumbnails may be local or safe external
URLs.

`usageLocations[]` is an embedded allowlist of entity type, entity id, entity
title, and field. It supports used/unused filters and blocks deletion while a
shared asset is still attached.

**Indexes:** `slug` (unique, sparse), `type`, `sourceType`, `status`, `tags`,
`{ status, type }`, and text over title/source fields.

### Event — `events`

Public/admin events, travel windows, campaigns, and information sessions.

Required: `title`, `slug`, `startDateTime`, and `status`. Public statuses are
`published`, `cancelled`, and `completed`; `draft` and `archived` are hidden.
`mapLink` must be a safe external URL. `ctaLink` must be a safe site path or
safe external URL. `coverMedia`, `gallery`, and `videos` use the shared media
value validation.

No ticket, payment, deposit, card, invoice, or refund fields exist.

**Indexes:** `slug` (unique), `status`, `eventType`, `startDateTime`,
`featured`, `{ status, startDateTime }`, and `{ status, featured, startDateTime }`.

### User — `users`

| Field | Type | Notes |
| --- | --- | --- |
| `fullName` | String | 2–200 characters |
| `email` | String | Unique. Trimmed and lowercased by a setter, which is what makes the unique index case-insensitive. Plus-addresses are **not** stripped — they are different mailboxes to their owner |
| `passwordHash` | String | Argon2id. Required. Private |
| `role` | String | One of the eight roles. Defaults to `customer` |
| `status` | String | `active` or `suspended`. Defaults to `active` |
| `preferences` | Object | `country`, `language`, `currency`. All optional |
| `emailVerifiedAt` | Date | Always `null` so far; the column exists so enforcement can be switched on without a migration |
| `lastLoginAt` | Date | Set by `/auth/login` |
| `passwordChangedAt` | Date | |
| `failedLoginAttempts` | Number | Private |
| `lockUntil` | Date | Private. An expired lock simply stops matching, so no cleanup job is needed |
| `sessionVersion` | Number | Private. Raised by a password change and by "sign out everywhere"; a session carrying an older value is rejected |

Indexes: `email` (unique), `role`, `status`.

`User` has no `sourceId`: it is not migrated from the frontend, and the
frontend demo accounts and plaintext demo passwords are never imported.

### `sessions`

Managed by `connect-mongo`. Each document holds a session id, an `expires` date
carrying a TTL index, and a `session` sub-document with exactly five fields:

| Field | Purpose |
| --- | --- |
| `userId` | The signed-in user, as a string |
| `sessionVersion` | Compared against the user's on every request |
| `authenticatedAt` | When this session signed in |
| `absoluteExpiresAt` | Fixed at sign-in, never moved |
| `csrfToken` | 32 random bytes, hex |

Deliberately **no role, email, name, or hash**. The TTL is the idle timeout and
slides forward on each response; the absolute limit is enforced in application
code, because nothing else would enforce it.

### Inquiry — `inquiries`

One collection behind every public form. Flat frontend fields are grouped into
typed subdocuments; nothing uses `Mixed`.

| Group | Fields |
| --- | --- |
| Identity | `referenceCode` (unique, server-generated), `type`, `status`, `priority`, `source`, `userId` |
| `contact` | `fullName`, `email`, `phone`, `whatsapp`, `country`, `language`, `nationality`, `preferredContactMethod` |
| `trip` | `packageId`, `fixedDepartureId`, `guideId`, `destinationInterest`, `travelDate`, `flexibleDates`, `numberOfPeople`, `budgetRange`, `tripType`, `guideLanguage`, `hotelNeeded`, `transportNeeded` |
| `snapshot` | `packageTitle`, `packageSlug`, `departureDate`, `guideName` — copied from the database, never the browser |
| Message | `subject`, `message`, `specialRequest` |
| `callback` | `preferredDate`, `preferredTime`, `timezone` |
| `consent` | `accepted`, `acceptedAt`, `privacyPolicyVersion` — the last two from the server |
| CRM | `assignedToUserId`, `followUpAt`, `convertedBookingId` |

**Private** (`select: false` and stripped again by the serializers):
`internalNotes`, `statusHistory`, `idempotencyKeyHash`, `spamSignals`,
`submissionMetadata`.

`internalNotes` and `statusHistory` are append-only: no edit and no delete
endpoint exists for either.

Indexes: `referenceCode` (unique), `type`, `status`, `priority`, `userId`,
`assignedToUserId`, `followUpAt`, `idempotencyKeyHash` (unique, sparse), plus
compound `{status, createdAt}` and `{assignedToUserId, followUpAt}`.

**Never stored:** raw IP addresses, session ids, CSRF tokens, cookies, user
agents, passwords, identity or payment details, or the payload of a spam
attempt. See [INQUIRY_PRIVACY.md](INQUIRY_PRIVACY.md).

An inquiry is saved data, not a sent message. Opening an external email,
WhatsApp, Facebook, Messenger, Instagram, or phone link must not move status or
create delivery claims.

There is **no TTL** on inquiries. A retention policy is an owner decision that
has not been made, and a TTL would silently delete personal data in the
meantime.

### ExternalContactEvent — future, not implemented

A future communication module may add an `externalContactEvents` collection:

| Field | Purpose |
| --- | --- |
| `inquiryId` | The inquiry the action belongs to |
| `customerId` | The authenticated customer, when present |
| `channel` | `email_app`, `gmail`, `whatsapp`, `facebook`, `messenger`, `instagram`, or `phone` |
| `action` | `composer_opened`, `external_link_opened`, or `email_address_copied` for automatic events |
| `createdAt` | Server clock |
| `createdByUserId` | Staff actor when staff records a manual event |
| `staffSummary`, `nextAction` | Optional manual CRM context |

Do not automatically create `message_sent`, `message_delivered`, or
`message_read`, because direct links cannot prove those states. Staff may
manually add `contact_received`, `staff_replied`, `customer_replied`, or
`external_conversation_summary` only when they know it happened.

## Relation counts — two different metrics

Both appear in the verification documents and they measure different things.
Confusing them produces incorrect migration summaries.

| Metric | Value | What it counts |
| --- | --- | --- |
| Individual references | **144** | Every stored `ObjectId`, counting each element of every array separately |
| Relation-bearing records | **65** | Documents carrying at least one relation — the number `npm run seed:catalog` prints |

Per field, all verified against the frontend seed files and all resolving to an
existing document:

| Field | References |
| --- | --- |
| `Destination.relatedPackageIds` | 15 |
| `Destination.relatedGuideIds` | 12 |
| `Activity.relatedDestinationIds` | 21 |
| `Activity.relatedPackageIds` | 15 |
| `Package.destinationIds` | 15 |
| `Package.activityIds` | 15 |
| `FixedDeparture.packageId` | 14 |
| `FixedDeparture.assignedGuideIds` | 15 |
| `Review.packageId` | 9 |
| `Review.guideId` | 7 |
| `Event.relatedPackageIds` | 3 |
| `Event.relatedDestinationIds` | 3 |
| **Total** | **144** |

`Review.bookingId` and `Review.userId` are stored as `null` on every seed
record — there is no Booking model yet — so they contribute nothing.

## Derived and cached data

| Field | Kind | Source of truth |
| --- | --- | --- |
| `fixedDeparture.seatsLeft` | Virtual, never stored | `totalSeats - bookedSeats` |
| `package.reviewsSummary` | Cached | Published Review documents |
| `guide.rating`, `guide.totalReviews` | Cached | Published Review documents |

Cached figures are written by the server. **A future API must never accept a
rating or review count from a client.**

## Known limitations

- **No routes, controllers, or services.** Nothing exposes these models yet.
- **No seed importer.** Frontend seed ids are not yet mapped to ObjectIds.
- **Validation is Mongoose-only.** No Joi, no Zod — a deliberate constraint.
- **Uniqueness is index-backed, not validated in memory.** A duplicate slug
  fails on write against a real database, not during `validate()`; the tests
  therefore cover slug *format*, not uniqueness.
- **Only `published` records exist in the seed**, so the other three content
  statuses are untested against real data.
- The 100 model tests run without MongoDB. Index behaviour, uniqueness, and
  write concurrency are consequently unverified.

### Seat concurrency — deliberately deferred

Two people reserving the last seat simultaneously is a real race, and a
read-then-write in application code cannot fix it. Reservation, when built,
must be a single atomic update guarded by the seat count:

```js
FixedDeparture.updateOne(
  { _id, $expr: { $lte: [{ $add: ['$bookedSeats', requested] }, '$totalSeats'] } },
  { $inc: { bookedSeats: requested } }
)
```

with a transaction where the booking is written in the same step. A zero
`matchedCount` means the seats went to someone else. **No reservation logic
exists in the current backend.**

### Future operational models

Not created yet: Booking, Notification, AuditLog, CMS singletons, a media
library/asset collection, private chat, and external contact events.
`review.bookingId` and `review.userId` are the only forward references, and
both are intentionally ref-less until then.

### Payment

**Explicitly excluded from the current scope.** No payment, deposit, invoice,
refund, tax, gateway, transaction, or payment-status field exists in the
backend models, and none should be added speculatively. A future backend
booking model should start from the current simplified product behavior:
`booked` or `cancelled`.
