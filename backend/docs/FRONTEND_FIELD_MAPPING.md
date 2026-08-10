# Frontend → Backend Field Mapping

The frontend seed data and `docs/DATA_MODEL.md` are the source of truth for
public field names. This file records every field, and **every place the
backend does something other than store the frontend value verbatim**.

Nothing is silently corrected. Where a transformation exists it is listed with
its effect.

Legend — **Req**: required · **Opt**: optional · **—**: no transformation.

---

## The two mismatches worth reading first

### 1. `difficulty` is stored two ways in the seed

| Source | Values |
| --- | --- |
| `packages` | `Easy`, `Easy to Moderate`, `Moderate`, `Challenging`, `Strenuous`, `Strenuous and technical`, `Extreme` |
| `activities` | `easy`, `moderate`, `challenging`, `extreme` |

The frontend already reconciles them at read time:
`difficultyDetails()` in `frontend/src/lib/displayLabels.js` lowercases the
value and collapses separators before looking it up, and its seven lookup keys
are the real canonical vocabulary.

**Backend behaviour:** a Mongoose setter (`normaliseDifficulty`) applies exactly
the same normalisation on write, so both entities store one lowercase
vocabulary. `"Strenuous and technical"` is a presentation label; storing it in
an enum field would break the rule that status fields hold canonical values.

**Effect:** lossless. `difficultyDetails()` renders `"Challenging"` and
`"challenging"` identically, so no visible output changes. A client reading the
raw API value gets lowercase where the mock returned Title Case for packages.

**Owner decision required:** if the label casing must be preserved byte-for-byte
in the API response, say so and the setter is removed in favour of storing both
a canonical key and a display label.

### 2. `status` has four values but the seed only exercises one

Every seeded destination, activity, package, and guide is `published`. The
admin panel writes `draft`, `hidden`, and `archived`, and `DATA_MODEL.md`
documents all four, so the enum carries all four.

**Effect:** none on existing data. Note that the backend default is `draft`, not
`published` — a record created through a future API is unpublished until
someone publishes it.

---

## Destination

Frontend entity: `destinations` (10 records, `dest-` prefix)

| Frontend field | Backend field | Type | Req | Transformation | Note |
| --- | --- | --- | --- | --- | --- |
| `id` | `_id` → `id` | ObjectId → String | Req | seed id replaced | See *Seed ID mapping* below |
| `title` | `title` | String | Req | trimmed | max 200 |
| `slug` | `slug` | String | Req | lowercased, trimmed | unique, indexed, slug format enforced |
| `region` | `region` | String | Req | trimmed | Required: every seed record has one and the listing groups by it |
| `shortDescription` | `shortDescription` | String | Opt | trimmed | max 600 |
| `fullDescription` | `fullDescription` | String | Opt | trimmed | max 20000 |
| `coverImage` | `coverImage` | Mixed media | Opt | — | Additive; image/video/reel URL metadata only |
| `heroMedia` | `heroMedia` | Mixed media | Opt | — | Additive; no binary media storage |
| `gallery` | `gallery` | [String or media object] | Opt | — | Legacy strings remain valid; objects may carry alt, caption, focal position, source and licence metadata |
| `videos` / `seasonalMedia` / `beforeAfterMedia` | same | [media object] | Opt | — | Additive public metadata, external video/reel URLs only |
| `bestSeason` | `bestSeason` | [String] | Opt | — | free text months |
| `mapInfo` | `mapInfo` | embedded | Opt | — | `latitude`, `longitude`, `elevationMetres`, `nearestAirport` |
| `relatedPackageIds` | `relatedPackageIds` | [ObjectId] ref Package | Opt | seed ids remapped | |
| `relatedGuideIds` | `relatedGuideIds` | [ObjectId] ref Guide | Opt | seed ids remapped | |
| `seo` | `seo` | embedded | Opt | — | `metaTitle`, `metaDescription`, `keywords[]` |
| `status` | `status` | String enum | Opt | — | default `draft` |
| — | `createdAt`, `updatedAt` | Date | auto | added | Mongoose timestamps |

**Not added:** no `featured`. Destinations now have optional media fields, but
the seed still uses the existing demo gallery paths until the owner supplies
genuine cover, hero, caption, source, licence, video, reel, seasonal, or
before/after media.

## Activity

Frontend entity: `activities` (10 records, `act-` prefix)

| Frontend field | Backend field | Type | Req | Transformation | Note |
| --- | --- | --- | --- | --- | --- |
| `title` | `title` | String | Req | trimmed | |
| `slug` | `slug` | String | Req | lowercased | unique, indexed |
| `category` | `category` | String | Opt | trimmed | **Free text, not an enum** — see below |
| `difficulty` | `difficulty` | String enum | Opt | **normalised to lowercase** | see mismatch 1 |
| `shortDescription` / `fullDescription` | same | String | Opt | trimmed | |
| `bestSeason` | `bestSeason` | [String] | Opt | — | |
| `safetyNotes` | `safetyNotes` | [String] | Opt | — | |
| `requiredPermits` | `requiredPermits` | [String] | Opt | — | |
| `relatedDestinationIds` | same | [ObjectId] ref Destination | Opt | ids remapped | |
| `relatedPackageIds` | same | [ObjectId] ref Package | Opt | ids remapped | |
| `coverImage` / `heroMedia` | same | Mixed media | Opt | Additive | URL metadata only |
| `gallery` | `gallery` | [String or media object] | Opt | URL/media-validated | Legacy strings remain valid |
| `videos` / `seasonalMedia` / `beforeAfterMedia` | same | [media object] | Opt | Additive | External video/reel URLs only |
| `seo` | `seo` | embedded | Opt | — | |
| `status` | `status` | String enum | Opt | — | |

**`category` is intentionally free text.** The seed uses seven values
(`trekking`, `climbing`, `wildlife`, `adventure`, `culture`, `wellness`,
`scenic`) but nothing in the frontend treats them as a closed set, and an enum
would stop an editor adding a category without a code change. Same decision for
`package.category`, which uses eleven values.

## Package

Frontend entity: `packages` (13 records, `pkg-` prefix)

| Frontend field | Backend field | Type | Req | Transformation | Note |
| --- | --- | --- | --- | --- | --- |
| `title` | `title` | String | Req | trimmed | |
| `slug` | `slug` | String | Req | lowercased | unique, indexed |
| `type` | `type` | String enum | **Req** | — | `tour` / `trekking` / `expedition` |
| `category` | `category` | String | Opt | trimmed | free text |
| `region` | `region` | String | Opt | trimmed | indexed |
| `destinationIds` | `destinationIds` | [ObjectId] ref Destination | Opt | ids remapped | |
| `activityIds` | `activityIds` | [ObjectId] ref Activity | Opt | ids remapped | |
| `shortDescription` / `overview` | same | String | Opt | trimmed | |
| `price` | `price` | Number | **Req** | — | **Stays a plain USD number** |
| `discountPrice` | `discountPrice` | Number | Opt | — | nullable; must not exceed `price` |
| — | `currency` | String | Opt | **added** | defaults `USD`; frontend already assumes USD |
| — | `priceBasis` | String | Opt | **added** | frontend `priceBasisLabel()` already reads it, falling back to "per person" |
| `duration` | `duration` | embedded `{days,nights}` | Opt | — | shape preserved exactly |
| `difficulty` | `difficulty` | String enum | Opt | **normalised** | see mismatch 1 |
| `maxElevationMetres` | `maxElevationMetres` | Number | Opt | — | **name kept**, not `maxElevation` |
| `walkingPerDay` | `walkingPerDay` | String | Opt | trimmed | free text like "5-6 hours" |
| `accommodation` / `meals` | same | String | Opt | trimmed | |
| `bestSeason` | `bestSeason` | [String] | Opt | — | |
| `groupSize` | `groupSize` | embedded `{min,max}` | Opt | — | shape preserved |
| `highlights` | `highlights` | [String] | Opt | — | |
| `itinerary` | `itinerary` | [embedded] | Opt | — | `day` is **Mixed**; `media[]` is optional |
| `costIncludes` / `costExcludes` | same | [String] | Opt | — | |
| `gearList` / `permits` | same | [String] | Opt | — | |
| `routeMap` | `routeMap` | String | Opt | URL-validated | |
| `coverImage` / `heroMedia` | same | Mixed media | Opt | Additive | URL metadata only |
| `gallery` | `gallery` | [String or media object] | Opt | URL/media-validated | Legacy strings remain valid |
| `videos` / `seasonalMedia` / `beforeAfterMedia` | same | [media object] | Opt | Additive | External video/reel URLs only |
| `faq` | `faq` | [embedded] | Opt | — | question and answer both required per entry |
| `reviewsSummary` | `reviewsSummary` | embedded | Opt | — | **cache, not truth** — see below |
| `seo` | `seo` | embedded | Opt | — | |
| `status` | `status` | String enum | Opt | — | |
| `featured` | `featured` | Boolean | Opt | — | default `false` |

**`itinerary[].day` is `Schema.Types.Mixed` on purpose.** Twelve packages number
their days; `pkg-009` (the 60-day Everest expedition) groups phases and stores
range labels such as `'12-18'`. `DATA_MODEL.md` says to render it as a label and
never do arithmetic on it. Typing it as `Number` would make that record
unstorable. The ordering rule only compares entries that are genuinely numeric.

**`reviewsSummary` is denormalised display data.** `DATA_MODEL.md` states it
aggregates the whole review corpus, not the rows in `reviews` — a package can
read `4.9 from 214 reviews` while only three reviews are stored. The backend
keeps it as a cache; the authoritative figure will be recomputed from
`published` Review documents. **A future API must never accept these numbers
from a client.**

**No payment fields.** No deposit, tax, gateway, refund, or transaction field
exists on this model, and availability lives on FixedDeparture, not here.

## FixedDeparture

Frontend entity: `fixedDepartures` (14 records, `dep-` prefix)

| Frontend field | Backend field | Type | Req | Transformation | Note |
| --- | --- | --- | --- | --- | --- |
| `packageId` | `packageId` | ObjectId ref Package | **Req** | seed id remapped | |
| `title` | `title` | String | Opt | trimmed | |
| `startDate` | `startDate` | Date | **Req** | ISO string → Date | |
| `endDate` | `endDate` | Date | **Req** | ISO string → Date | must not precede `startDate` |
| `durationDays` | `durationDays` | Number | Opt | — | **name kept**, not `duration` |
| `totalSeats` | `totalSeats` | Number | **Req** | — | non-negative integer |
| `bookedSeats` | `bookedSeats` | Number | Opt | — | default 0; must not exceed `totalSeats` |
| `price` | `price` | Number | Opt | — | non-negative |
| — | `currency` | String | Opt | **added** | defaults `USD` |
| `status` | `status` | String enum | Opt | — | seven canonical values |
| `guaranteed` | `guaranteed` | Boolean | Opt | — | default `false` |
| `assignedGuideIds` | `assignedGuideIds` | [ObjectId] ref Guide | Opt | ids remapped | |
| `internalNotes` | `internalNotes` | String | Opt | **`select: false`** | staff only, never public |
| `createdAt` | `createdAt` | Date | auto | replaced by timestamps | |
| — | `seatsLeft` | Number (virtual) | — | **added, derived** | `totalSeats - bookedSeats`, clamped at 0 |

## Guide

Frontend entity: `guides` (7 records, `guide-` prefix)

The public/private split mirrors `frontend/src/lib/publicGuide.js` exactly.

| Frontend field | Backend field | Type | Public? | Note |
| --- | --- | --- | --- | --- |
| `fullName` | `fullName` | String | **public** | required |
| `slug` | `slug` | String | **public** | unique, indexed |
| `photo` | `photo` | String | **public** | URL-validated |
| `bio` | `bio` | String | **public** | |
| `guideType` | `guideType` | String enum | **public** | `trekking`/`expedition`/`cultural`/`naturalist` |
| `languages` | `languages` | [String] | **public** | |
| `regions` | `regions` | [String] | **public** | |
| `experienceYears` | `experienceYears` | Number | **public** | non-negative integer |
| `rating` | `rating` | Number | **public** | 0–5; cached aggregate |
| `totalReviews` | `totalReviews` | Number | **public** | cached aggregate |
| `summitsOrTrips` | `summitsOrTrips` | String | **public** | |
| `pricePerDay` | `pricePerDay` | Number | **private** | `select: false`. **Name kept**, not `price` |
| — | `currency`, `priceBasis` | String | **private** | added, `select: false` |
| `certifications` | `certifications` | [String] | **private** | `select: false`; licence names |
| `verificationStatus` | `verificationStatus` | String enum | **private** | `select: false`; public output derives a boolean |
| `availabilityStatus` | `availabilityStatus` | String enum | **private** | `select: false` |
| `publicProfile` | `publicProfile` | Boolean | **private** | `select: false`; listing requires `true` **and** `status: published` |
| `status` | `status` | String enum | **private** | `select: false` |
| — | `internalNotes` | String | **private** | added, `select: false` |

**`verificationStatus` enum note.** The seed uses only `verified` and `pending`.
`rejected` and `expired` are included as the obvious admin counterparts; no seed
record uses them. Flagged rather than presented as observed data.

## Review

Frontend entity: `reviews` (16 records, `rev-` prefix)

| Frontend field | Backend field | Type | Req | Transformation | Note |
| --- | --- | --- | --- | --- | --- |
| `customerName` | `customerName` | String | **Req** | trimmed | |
| `country` | `country` | String | Opt | uppercased | 2-letter code |
| `rating` | `rating` | Number | **Req** | — | **1–5**, unlike aggregates which allow 0 |
| `title` | `title` | String | Opt | trimmed | |
| `reviewText` | `reviewText` | String | **Req** | trimmed | max 5000 |
| `packageId` | `packageId` | ObjectId ref Package | Opt | id remapped | nullable |
| `guideId` | `guideId` | ObjectId ref Guide | Opt | id remapped | nullable |
| `userId` | `userId` | ObjectId | Opt | **no `ref`** | User model does not exist yet |
| `bookingId` | `bookingId` | ObjectId | Opt | **no `ref`** | Booking model does not exist yet |
| `verifiedBooking` | `verifiedBooking` | Boolean | Opt | — | default `false` |
| `status` | `status` | String enum | Opt | — | `pending`/`published`/`rejected`, default `pending` |
| `adminReply` | `adminReply` | String | Opt | trimmed | nullable |
| `createdAt` | `createdAt` | Date | auto | replaced by timestamps | |
| — | `featured` | Boolean | Opt | **added** | default `false` |
| — | `publishedAt` | Date | Opt | **added** | null until published |

**`bookingId` and `userId` carry no `ref` on purpose.** Declaring
`ref: 'Booking'` against an unregistered model makes any future `populate()`
throw `MissingSchemaError`. The refs are added with the future booking and user
relationship work — an additive change requiring no data migration.

**At least one of `packageId` / `guideId` is required.** A review of nothing
cannot be rendered anywhere.

---

## Seed ID mapping (future integration work — not implemented)

Frontend records use readable string ids (`pkg-001`, `dest-004`). MongoDB uses
ObjectIds. The importer, when it is written, must:

1. Insert each record and record `seedId → ObjectId`.
2. Rewrite every relation array using that map.
3. Fail loudly on an unresolved id rather than dropping it.

```json
{
  "dest-001": "6710f2c4a3b1d2e4f5a6b7c8",
  "pkg-001":  "6710f2c4a3b1d2e4f5a6b7d1"
}
```

Order matters: destinations, activities, and guides first, then packages, then
fixed departures and reviews, so every referenced id already exists.

**Open question for the owner:** whether to keep the original seed id on each
document as an indexed `legacyId` field. It costs one small index and makes the
import re-runnable and auditable. It is **not** implemented — nothing in the
frontend contract requires it.
