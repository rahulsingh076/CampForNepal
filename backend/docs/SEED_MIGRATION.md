# Seed Migration

Imports the frontend's catalogue seed data into MongoDB. Safe to re-run.

```bash
npm run seed:catalog          # import or update
npm run seed:catalog:reset    # remove migrated records (guarded)
```

## Source

`FRONTEND_ROOT` points at the frontend package; the loader reads
`$FRONTEND_ROOT/src/data`. **Only the seed scripts read it — the API server
never does**, so a deployed backend needs no frontend on disk.

### Approved files — an allowlist, not a directory scan

| File | Entity |
| --- | --- |
| `destinations.js` | destinations |
| `activities.js` | activities |
| `packages.js` | packages |
| `fixedDepartures.js` | fixedDepartures |
| `guides.js` | guides |
| `reviews.js` | reviews |

Nothing else is readable from here. `users.js`, `bookings.js`,
`inquiries.js`, `contactDetails.js`, and `auditLogs.js` contain demo
passwords, customer contact details, and staff notes, and are deliberately
outside the list. The importer executes no arbitrary frontend code beyond
importing these six modules for their default export.

## `sourceId`

Every migrated document keeps the id it had in the frontend seed —
`pkg-001`, `dest-004` — in a `sourceId` field.

| Property | Value |
| --- | --- |
| Type | String, trimmed |
| Visibility | `select: false`, and stripped by the JSON transform |
| Index | Unique, **sparse** |
| Public? | **Never.** The public identifier is always `id` |

It exists for two reasons: it makes re-running the seed an update rather than a
duplicate, and it lets the reset script target migrated records without
touching anything an admin created later. Records created through a future
admin API have no `sourceId` at all, which is what `sparse` allows.

## Order and the two passes

Relations in the seed are strings (`"pkg-001"`), and MongoDB needs ObjectIds.
A single pass cannot work: a destination references packages that may not
exist yet. So:

**Pass 1 — base records.** Upsert each entity by `sourceId`, writing every
field except relations, and record `sourceId -> _id`:

```
destinations -> activities -> guides -> packages -> fixedDepartures -> reviews
```

**Pass 2 — relations.** Using those maps, resolve and write:

| Entity | Fields resolved |
| --- | --- |
| Destination | `relatedPackageIds`, `relatedGuideIds` |
| Activity | `relatedDestinationIds`, `relatedPackageIds` |
| Package | `destinationIds`, `activityIds` |
| FixedDeparture | `packageId`, `assignedGuideIds` |
| Review | `packageId`, `guideId` |

```json
{
  "dest-001": "6710f2c4a3b1d2e4f5a6b7c8",
  "pkg-001":  "6710f2c4a3b1d2e4f5a6b7d1"
}
```

**Any unresolved relation aborts the run** before pass two writes anything. A
silently dropped reference is a bug nobody notices until a detail page renders
a missing trip.

## Validation happens before the first write

The whole catalogue is checked in memory first, and **a single problem stops
the run with nothing written**. A half-migrated catalogue is worse than none.

Checked: unique source ids; unique, well-formed slugs; required fields;
canonical statuses, package types, and difficulties; every relation resolving
to a real source record; `endDate >= startDate`; `bookedSeats <= totalSeats`;
non-negative seats and prices; `discountPrice <= price`; ratings in range;
and image URLs using a safe scheme.

Failures are grouped by entity and printed with entity, source id, field,
value, and reason. Invalid records are **reported, never silently dropped**.

## Idempotency

Every write is an upsert keyed on `sourceId`.

- A source record with no matching document is **created**.
- A source record with a match is **updated**.
- A document with **no `sourceId` is never touched** — that is owner content.

Running the command twice produces the same database. The summary reports
created, updated, unchanged, and skipped counts, then verifies that the
migrated document count matches the source count for every entity and fails
if they differ.

## Deferred relations

`review.bookingId` and `review.userId` reference models that do not exist yet.
The importer **does not** fabricate Booking or User records, and does not coerce
a string like `bkg-001` into an invalid ObjectId. Each value is recorded as
deferred and reported in the summary.

In the current seed all sixteen reviews have `bookingId: null` and
`userId: null`, so **the deferred count is 0** — the mechanism exists for when
that changes.

## Not imported

Users, bookings, inquiries, notifications, audit logs, CMS singletons, contact
details, and site settings. The seed migrator imports the public catalogue only.

## Guards

| Situation | Requirement |
| --- | --- |
| Seed with `NODE_ENV=production` | `ALLOW_SEED_IN_PRODUCTION=true` |
| Reset, any environment | `ALLOW_DESTRUCTIVE_SEED=true` |
| Reset with `NODE_ENV=production` | **both** of the above |

Refusal writes nothing and explains why. The reset script deletes only
documents matching `{ sourceId: { $exists: true } }`, prints exactly what will
be removed and what will be kept beforehand, and **never** calls
`dropDatabase()` or drops a collection.

## Verifying

```bash
npm run seed:catalog     # note the created/updated counts
npm run seed:catalog:reset   # needs ALLOW_DESTRUCTIVE_SEED=true
```

Expected source counts: destinations 10, activities 10, packages 13,
fixedDepartures 14, guides 7, reviews 16 — **70 records**.

Run the seed twice: the second run should report 0 created and 70 updated,
with identical database counts.

## Troubleshooting

| Message | Cause |
| --- | --- |
| `FRONTEND_ROOT is not set` | Add it to `.env`. Only the seed needs it. |
| `FRONTEND_ROOT does not exist` | Path is relative to the backend directory. |
| `Missing frontend catalogue files` | One of the six approved files is absent. Nothing was imported. |
| `did not export an array` | A seed file changed shape; the importer expects a default-exported array. |
| `N problem(s) found. Nothing was written.` | Validation failed. Fix the source data — the report names each record and field. |
| `relation(s) could not be resolved` | A relation points at a source id that does not exist. |
| `Migrated counts do not match the source` | A write failed silently; investigate before re-running. |
| `Refusing to seed a production database` | Set `ALLOW_SEED_IN_PRODUCTION=true` only if you mean it. |
