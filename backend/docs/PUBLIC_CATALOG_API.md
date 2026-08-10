# Public Catalogue API

Read-only endpoints for the public site. **There is no create, update, or
delete endpoint for public catalogue resources**, and no authentication —
everything here is public content.

Base path `/api/v1`. Every response uses the envelope in
[API_CONTRACT.md](API_CONTRACT.md).

**The frontend is not connected to these endpoints yet.** It still runs on its
mock `dataClient`.

## Visibility — what "public" means

Enforced in one place, `src/database/publicVisibility.js`, so a new endpoint
cannot invent a looser rule.

| Entity | Rule |
| --- | --- |
| Destination, Activity, Package | `status: 'published'` only. `draft`, `hidden`, `archived` never appear. |
| Guide | `status: 'published'` **and** `publicProfile: true`. Either alone is not enough. |
| Review | `status: 'published'` only. `pending` and `rejected` never appear. |
| FixedDeparture | Any status except `draft`. |
| Event | `published`, `cancelled`, and `completed` only. `draft` and `archived` never appear. |
| MediaAsset | `published` only. Public global search exposes video/reel results only. |

Departure statuses are public because the frontend's own list renders them:
`booking_open`, `almost_full`, and `guaranteed` are bookable, while `closed`,
`cancelled`, and `completed` appear with a status badge so a returning visitor
can still find a trip they know about. `draft` is internal and always excluded.

**Projections are allowlists, never `-field` exclusions**, so adding a private
field to a model can never widen a response by accident. These never appear in
any public response: `sourceId`, `internalNotes`, `pricePerDay`,
`certifications`, `verificationStatus`, `availabilityStatus`, `publicProfile`,
`_id`, `__v`.

Published Destination, Activity, and Package responses may include public media
metadata: `coverImage`, `heroMedia`, `gallery`, `videos`, `seasonalMedia`, and
`beforeAfterMedia`. Legacy gallery strings remain valid. Structured media
objects carry public captions, alt text, focal position, source and licence
metadata only. Video and reel fields store external or shipped local asset
references, not binary files.

Related records populated into a response carry their own visibility filter, so
an unpublished trip cannot surface through a published destination.

## Query parameters

Every value is parsed individually and range-checked. **`req.query` is never
passed to Mongoose** — Express parses `?a[$ne]=1` into an object, so forwarding
it would allow operator injection. An invalid value is a readable **400**, not
a silent empty list.

| Rule | Behaviour |
| --- | --- |
| `page` | Positive integer, default 1 |
| `limit` | Positive integer, default `PUBLIC_DEFAULT_PAGE_SIZE` (12), capped at `PUBLIC_MAX_PAGE_SIZE` (100) |
| Booleans | Only `true` / `false`; `yes` or `1` is a 400 |
| Lists | Comma-separated, trimmed, allowlisted where the field is an enum |
| `search` | Max 100 characters, regex-escaped so `.*` matches literally |
| `sort` | Allowlisted per endpoint; `-` prefix reverses |
| Ranges | `min > max` is a 400; **zero is a valid minimum** |
| Ids | Must look like an ObjectId, else 400 |

Search fields are allowlisted per endpoint. They do not search media credit
fields, private guide fields, inquiry/customer data, internal notes, or any
field absent from the public projection.

### List `meta`

```json
{
  "page": 1, "limit": 12, "total": 24, "totalPages": 2,
  "hasNextPage": true, "hasPreviousPage": false,
  "filters": { "type": "trekking" },
  "sort": "-createdAt"
}
```

---

## Endpoints

### `GET /destinations`

Published destinations. **Filters:** `search`, `region`, `bestSeason`, `page`,
`limit`, `sort`. **Sort:** `title`, `region`, `createdAt` (± `-`), default
`title`.

`featured` is **rejected with a 400** — the frontend contract has no `featured`
field on a destination, and accepting it silently would imply a capability that
does not exist.

Eventually backs `dataClient.listItems('destinations', …)`.

### `GET /destinations/:slug`

One destination, with `relatedPackageIds` and `relatedGuideIds` populated as
public summaries. **404** when the slug does not exist or is not published.
Backs `dataClient.getItem('destinations', slug)`.

### `GET /activities`

**Filters:** `search`, `category`, `difficulty`, `bestSeason`, `destinationId`,
`page`, `limit`, `sort`. **Sort:** `title`, `category`, `createdAt`.

`category` is free text (the frontend treats it as open), so it is not
allowlisted. `difficulty` **is** allowlisted against the canonical vocabulary.

### `GET /activities/:slug`

One activity with related destinations and packages as summaries. 404 as above.

### `GET /packages`

**Filters:** `search`, `type`, `destinationId`, `activityId`, `region`,
`difficulty`, `bestSeason`, `durationMin`, `durationMax`, `priceMin`,
`priceMax`, `featured`, `page`, `limit`, `sort`.

**Sort:** `title`, `price`, `duration`, `createdAt` (± `-`), default `title`.
`duration` sorts on `duration.days`.

`type` accepts `tour`, `trekking`, `expedition`.

### `GET /packages/:slug`

One trip with `destinationIds` and `activityIds` populated as public summaries.

### `GET /packages/:slug/fixed-departures` · `GET /packages/:slug/reviews`

Both exist because the frontend's trip detail page already renders departures
and reviews for one trip. Same filters as the corresponding list endpoint;
`packageId` is resolved from the slug. **404** when the trip is not public.

### `GET /trekking` · `GET /expeditions`

Aliases over the **same** Package service with `type` forced — the query logic
is not duplicated.

`GET /trekking/:slug` and `GET /expeditions/:slug` return **404 when the slug
exists but belongs to another type**. A tour is never served from a trekking
URL.

### `GET /fixed-departures`

**Filters:** `packageId`, `month` (`2027-03`), `dateFrom`, `dateTo`, `status`,
`guaranteed`, `region`, `type`, `difficulty`, `page`, `limit`, `sort`.
**Sort:** `startDate`, `price`, `createdAt`, default `startDate`.

`status` may only narrow the public set — asking for `draft` is a 400.
`month` is resolved in UTC so the boundary does not drift with server timezone.

`region`, `type`, and `difficulty` live on the parent trip. They are resolved
to a list of package ids with a separate query rather than an aggregation, so
no untrusted value reaches a pipeline operator.

Returns the package summary, dates, `durationDays`, `totalSeats`,
`bookedSeats`, the derived `seatsLeft`, status, `guaranteed`, price, and
currency. **`internalNotes` is never returned.**

**Seat numbers are display-only in public catalogue responses.** Reservation and its
concurrency handling are deliberately not implemented — see
[DATABASE_SCHEMA.md](DATABASE_SCHEMA.md).

### `GET /guides`

**Filters:** `search`, `language`, `region`, `guideType`, `page`, `limit`,
`sort`. **Sort:** `fullName`, `experienceYears`, `rating`, `createdAt`.

`verificationStatus` and `availabilityStatus` are **rejected with a 400**.
Both are private fields, and allowing a filter on them would let a caller infer
values the API deliberately does not return — ask for verified guides, compare
counts, learn who is not verified.

Returns the public projection only, mirroring `publicGuide.js` on the
frontend. A day rate, certifications, verification status, availability, and
internal notes are all absent.

### `GET /guides/:slug`

One public guide profile. 404 when not found, not published, or not
`publicProfile`.

### `GET /reviews`

**Filters:** `packageId`, `guideId`, `country`, `rating`, `featured`, `page`,
`limit`, `sort`. **Sort:** `createdAt`, `rating`, `publishedAt`, default
`-createdAt`.

Published reviews only. No moderation state, `userId`, or `bookingId` is
returned. No organisation-wide rating is computed from these records.

### `GET /events`

Public events. **Filters:** `search`/`q`, `eventType`, `featured`,
`dateFrom`, `dateTo`, `page`, `limit`, `sort`. **Sort:** `title`,
`startDateTime`, `createdAt`, `updatedAt`, default `startDateTime`.

Returns cover/gallery/video media, related public package and destination
summaries, event status, CTA fields, and SEO. There is no ticket or payment
field.

### `GET /events/:slug`

One public event. 404 when the slug does not exist or is `draft`/`archived`.

### `GET /media`

Published media records. **Filters:** `search`/`q`, `type`, `page`, `limit`,
`sort`. Public search uses media for video/reel discovery; draft, hidden, and
archived records are excluded.

### `GET /search`

Public global search over published packages, destinations, activities, public
guides, published reviews, events, and published video/reel media. Query
parameters: `q` or `search`, `type`, `page`, and `limit`.

No customer, booking, inquiry, user, session, environment, or staff data is
searched or returned.

### `GET /print/...`

Print-safe public projections:

- `/print/packages/:slug`
- `/print/packages/:slug/itinerary`
- `/print/destinations/:slug`
- `/print/events/:slug`

These are JSON allowlists for browser-native printing or Save as PDF. They do
not create server PDF files and do not claim physical print completion.

---

## Errors

| Status | When |
| --- | --- |
| 400 | Invalid query value, malformed id, unknown sort or enum, inverted range |
| 404 | No such route, or no public record with that slug |
| 409 | Duplicate key conflict |
| 500 | Unexpected fault. Masked in production and logged with its request id |

```json
{
  "success": false,
  "message": "Package not found.",
  "data": null,
  "meta": { "requestId": "fc134876-12f4-48c7-a062-b85abee9fac3" }
}
```
