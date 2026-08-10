# Data Model

All business content lives in `frontend/src/data/` seed files. Components never import
those files — everything goes through `frontend/src/lib/dataClient.js`.

This document is the **backend contract for V2**: each section below is one
collection, and the field list is what the real API should return.

## The response shape

Every `dataClient` function resolves to the same object, matching the future API:

```js
{ success: true, message: '', data: [...], meta: { total, page, pageSize, totalPages } }
```

`success` is false with a human-readable `message` on any failure. `data` is
`null` on failure, an array for lists, an object for a single record.

## The layers

| File | Job |
| --- | --- |
| `frontend/src/data/*.js` | Seed content. Never mutated at runtime. |
| `frontend/src/lib/entities.js` | The only file that imports seed data. Maps a collection name to its seed, its label, and which field identifies a row. |
| `frontend/src/lib/storage.js` | localStorage wrapped in try/catch. A blocked or full store degrades to seed data instead of throwing. |
| `frontend/src/lib/queryList.js` | Search, filter, sort, and paginate. Pure functions. |
| `frontend/src/lib/dataClient.js` | The public API. |

## The localStorage overlay

Seed data is read-only, so every admin edit is written to a single overlay
object in localStorage under `cfn:overlay`. A read returns the overlay's copy
of a collection if one exists and the untouched seed array otherwise, which
means an edit survives a refresh while the original content is never lost.
`resetDemoData()` deletes that one key and the whole site snaps back to seeds.

---

# Collections

Every collection supports `listItems`, `getItem`, `createItem`, `updateItem`,
and `deleteItem`. Ids follow a per-collection prefix (`pkg-001`, `dest-004`).

## countries — 9
Keyed by `countryCode`, not an id.
`countryCode` · `countryName` · `defaultLanguage` · `defaultCurrency` ·
`suggestedSupportText` · `recommendedContentTags[]`

## languages — 6
Keyed by `code`. `code` · `name` · `nativeName` · `direction`

## currencies — 5
Keyed by `code`. `code` · `symbol` · `label` · `rate`
Rates are fixed demo values, never live.

## Shared public media values

Legacy gallery entries remain valid as plain image URL strings. New owner-entered
media may be a structured object:

`type` (`image | video | reel`) · `sourceType?` · `src` · `thumbnailSrc?` ·
`caption?` · `focalPosition?` · `photographer?` · `sourceName?` ·
`sourceReference?` · `sourceUrl?` · `licenceName?` · `licenceUrl?` ·
`mediaId?` · `day?` · `season?`

`image` items may use a site-relative `/images/...` path or a safe external
URL. `video` and `reel` items store safe external URLs unless
`sourceType === 'local_asset'`, in which case the source must be a shipped
site-relative path such as `/media/library/file.mp4`. Video binaries are not
stored in MongoDB. Captions, alt text, focal position, photographer, source, and
licence fields are public metadata and must be owner-approved rather than
invented. Private dashboard print output is suppressed by the app stylesheet.

## mediaAssets — 5 (`media-`)
`id` · `title` · `slug` · `type` · `sourceType` · `sourceUrl` · `embedUrl` ·
`thumbnailUrl` · `alt` · `caption` · `width` · `height` ·
`durationSeconds` · `focalPosition` · `tags[]` · `sourceName` ·
`sourceReference` · `photographerOrCreator` · `licence` ·
`attributionRequired` · `verifiedAt` · `status` · `usageLocations[]`

`sourceType` is `local_asset | external_url | youtube | vimeo | instagram |
facebook`. Local file pickers fill a reference path only; the owner must place
the file in `frontend/public/media/library/` before production.

`usageLocations[]` is used to block deletion while a shared asset is still
attached. Archive unused media instead of deleting it where possible.

## events — 2 (`event-`)
`id` · `title` · `slug` · `eventType` · `shortDescription` ·
`fullDescription` · `startDateTime` · `endDateTime` · `timezone` ·
`venueName` · `address` · `mapLink` · `organizer` · `coverMedia` ·
`gallery[]` · `videos[]` · `relatedPackageIds[]` ·
`relatedDestinationIds[]` · `ctaLabel` · `ctaLink` · `status` · `featured` ·
`seo`

`status` is `draft | published | cancelled | completed | archived`. Public
pages show only `published`, `cancelled`, and `completed`. No event ticketing
or payment workflow exists.

## destinations — 10 (`dest-`)
`id` · `title` · `slug` · `region` · `shortDescription` · `fullDescription` ·
`coverImage?` · `heroMedia?` · `gallery[]` · `videos[]` · `seasonalMedia[]` ·
`beforeAfterMedia[]` · `bestSeason[]` ·
`mapInfo{ latitude, longitude, elevationMetres, nearestAirport }` ·
`relatedPackageIds[]` · `relatedGuideIds[]` · `seo{ metaTitle,
metaDescription, keywords[] }` · `status`

## activities — 10 (`act-`)
`id` · `title` · `slug` · `category` · `difficulty` · `bestSeason[]` ·
`shortDescription` · `fullDescription` · `safetyNotes[]` · `requiredPermits[]` ·
`relatedDestinationIds[]` · `relatedPackageIds[]` · `coverImage?` ·
`heroMedia?` · `gallery[]` · `videos[]` · `seasonalMedia[]` ·
`beforeAfterMedia[]` · `seo` · `status`

## packages — 13 (`pkg-`)
The largest entity. `type` is `tour | trekking | expedition`.

`id` · `title` · `slug` · `type` · `category` · `region` · `destinationIds[]` ·
`activityIds[]` · `shortDescription` · `overview` · `price` · `discountPrice` ·
`duration{ days, nights }` · `difficulty` · `maxElevationMetres` ·
`walkingPerDay` · `accommodation` · `meals` · `bestSeason[]` ·
`groupSize{ min, max }` · `highlights[]` ·
`itinerary[]{ day, title, description, elevationMetres, walkingHours,
accommodation, meals, media[]? }` · `costIncludes[]` · `costExcludes[]` ·
`gearList[]` · `permits[]` · `routeMap` · `coverImage?` · `heroMedia?` ·
`gallery[]` · `videos[]` · `seasonalMedia[]` · `beforeAfterMedia[]` ·
`faq[]{ question, answer }` ·
`reviewsSummary{ averageRating, totalReviews }` · `seo` · `status` · `featured`

`price` is a plain USD number. There is no payment field anywhere.

**Two things to know before building a package page:**

1. **`itinerary[].day` is a number on twelve packages and a string on one.**
   `pkg-009` (the 60-day Everest Expedition) is grouped into 14 phases with
   range labels — `'12-18'` — because 60 near-identical rows help nobody.
   Render it as a label; never do arithmetic or `day === n` on it.
2. **`reviewsSummary` is a denormalised aggregate over the whole review
   corpus, not a count of the rows in `reviews`.** A real backend returns it
   the same way. The seeded `reviews` collection is a representative sample,
   so a detail page should say "showing 3 of 214", never imply it has them all.

## fixedDepartures — 14 (`dep-`)
`id` · `packageId` · `title` · `startDate` · `endDate` · `durationDays` ·
`totalSeats` · `bookedSeats` · `price` · `status` · `guaranteed` ·
`assignedGuideIds[]` · `internalNotes` · `createdAt`

`status` is `draft | booking_open | almost_full | guaranteed | closed |
cancelled | completed`. `bookedSeats` never exceeds `totalSeats`.

## guides — 7 (`guide-`)
`id` · `fullName` · `slug` · `photo` · `photoAlt` · `photoSourceName?` · `bio` · `guideType` · `languages[]` ·
`regions[]` · `experienceYears` · `certifications[]` · `pricePerDay` ·
`verificationStatus` · `rating` · `totalReviews` · `availabilityStatus` ·
`summitsOrTrips` · `publicProfile` · `status`

### Public vs private, enforced in code

`frontend/src/lib/publicGuide.js` holds the allowlist. Public pages render the
**projection**, never the raw record, so a private field cannot reach the
screen even by mistake. Adding a field to `PUBLIC_GUIDE_FIELDS` is the only
way to make it public.

| Public | Private — never rendered |
| --- | --- |
| `id` `slug` `fullName` `photo` `bio` `guideType` `languages` `regions` `experienceYears` `rating` `totalReviews` `summitsOrTrips` | `pricePerDay` `certifications` `availabilityStatus` `verificationStatus` `publicProfile` `status` |

`photoSourceName` is optional owner-approval/source metadata. A public guide
portrait renders only when both `photo` and `photoSourceName` are supplied;
the metadata itself is never rendered publicly. `verificationStatus` is private as a *value*; the projection converts it to a
boolean `isVerified`, which is the only thing the badge reads. A guide appears
publicly only when `publicProfile === true` **and** `status === 'published'`.

**`certifications` is treated as private** because it holds licence names, and
the backend schema plan keeps licence data server-side. If you would rather show
qualifications as a trust signal, move that one string between the two arrays
in `publicGuide.js` — nothing else needs to change.

## reviews — 16 (`rev-`)
`id` · `customerName` · `country` · `rating` · `title` · `reviewText` ·
`packageId` · `guideId` · `userId` · `bookingId` · `verifiedBooking` ·
`status` · `createdAt` · `adminReply`

Exactly one of `packageId` / `guideId` is set; the other is null.
`status` is `published | pending | rejected`.

`userId` and `bookingId` are null on every seed review (those customers have
no account). A review written from the customer dashboard carries both, starts
as `pending` for admin moderation, and the dashboard allows one review per
booking.

## blogPosts — 8 (`post-`)
`id` · `title` · `slug` · `category` · `author` · `excerpt` · `content` ·
`featuredImage` · `gallery[]` · `relatedPackageIds[]` · `readingMinutes` ·
`seo` · `status` · `publishedAt`

Blog `gallery[]` can use the same media object shape when real captions and
credits are supplied. Current demo posts still use the existing image URLs.

## travelUpdates — 8 (`upd-`)
`id` · `title` · `slug` · `category` · `severity` · `author` · `summary` ·
`content` · `featuredImage` · `relatedDestinationIds[]` ·
`relatedPackageIds[]` · `seo` · `status` · `publishedAt` · `expiresAt`

`severity` is `info | advisory | urgent`. `expiresAt` is null for notices with
no end date; a page should hide an update once `expiresAt` has passed.

## travelInfoPages — 7 (`info-`)
`id` · `title` · `slug` · `category` · `summary` · `content` ·
`sections[]{ heading, body }` · `relatedPackageIds[]` · `seo` · `status` ·
`updatedAt`

## certificates — 6 (`cert-`)
`id` · `title` · `issuer` · `issuedDate` · `expiryDate` · `registrationNumber` ·
`description` · `image` · `verificationNote` · `displayOrder` · `status`

## users — 8 (`user-`)
Demo accounts for customer, guide, admin, and super admin. Some retired staff
records remain suspended so historical bookings and audit entries still resolve.
`id` · `fullName` · `email` · `password` · `role` · `avatar` · `phone` ·
`country` · `guideId` · `preferences{ language, currency, emailUpdates }` ·
`lastLoginAt` · `createdAt` · `status`

`role` is `customer | guide | admin | super_admin`.

**V1 has no real authentication.** Passwords are demo strings, checked only in
the browser. V2 must replace this entirely — never ship these records.

Browser mock auth on top of this collection: the session is `{ userId }`
under the localStorage key `cfn:session`; registration writes a new customer
row to the overlay; the per-user wishlist lives under `cfn:wishlist` as
`{ [userId]: [{ type: 'package' | 'destination', id }] }` — deliberately
outside dataClient because it is visitor UI state, not business content.

## bookings — 11 (`bkg-`)
`id` · `reference` · `inquiryId` · `userId` · `packageId` · `departureId` ·
`travellers{ adults, children }` ·
`leadTraveller{ fullName, email, phone, country, passportProvided }` ·
`specialRequests` · `status` · `statusHistory[]{ status, changedAt, note }` ·
`documents[]{ name, type, status, sizeKb, uploadedAt }` ·
`documentsChecklist[]{ label, done }` · `assignedGuideId` ·
`internalNotes[]{ body, authorName, createdAt }` · `createdAt` · `updatedAt`

`status` is intentionally simple and normalizes through
`frontend/src/config/bookingStatuses.js` to `booked` or `cancelled`. Older demo
records may still contain historical workflow values, but UI code maps them to
`booked` for display so customers and staff do not see a long booking timeline.

`statusHistory` records the status events that actually happened; older records
may contain historical values and are normalized when displayed. The effective
current status is always `booked` or `cancelled`.
`documents[].type` is `passport | insurance | photo | medical | form | other`
and `documents[].status` is `received | verified`.

`userId` is the account that manages the booking. Walk-in and phone customers
have no account, so those bookings belong to the staff member who logged them
(`user-003`, `user-005`). The demo customer `user-001` owns `bkg-001`,
`bkg-003`, and `bkg-011`.

**A booking tracks only whether the trip is booked or cancelled — there is no
price, total, deposit, invoice, refund, or payment status field.** `documents`
holds metadata only; no file is ever uploaded. Further planning details belong
in private chat or manual owner/customer contact.

## inquiries — 12 (`inq-`)
`id` · `referenceCode` · `type` · `status` · `fullName` · `email` · `phone` · `country` ·
`subject` · `message` · `packageId` · `guideId` · `preferredDate` ·
`groupSize` · `assignedTo` · `internalNotes` · `createdAt` · `updatedAt`

`type` is `package_inquiry | custom_trip | contact | callback | emergency |
guide_request | booking_change`. `status` is `new | contacted | quoted |
converted | lost | closed`.

`booking_change` is created from the customer dashboard when someone asks to
cancel or reschedule a booking — the booking itself never changes until a
person handles the inquiry.

`referenceCode` is the public search key for external conversations. It appears
in email subjects, email bodies, WhatsApp prefilled messages, private chat, CRM
detail, and manual external-contact summaries. Do not expose MongoDB ObjectIds
as public references.

## externalContactEvents — future
`id` · `inquiryId` · `customerId` · `channel` · `action` · `createdAt` ·
`createdByUserId` · `staffSummary` · `nextAction`

Future event records may capture privacy-safe external actions:
`composer_opened`, `external_link_opened`, and `email_address_copied` across
`email_app`, `gmail`, `whatsapp`, `facebook`, `messenger`, `instagram`, and
`phone`.

They must not automatically create `message_sent`, `message_delivered`, or
`message_read`. Staff may manually add summaries when they know what happened
outside the website.

## messageThreads — 3 (`thr-`)
`id` · `userId` · `subject` · `relatedBookingId` · `status` ·
`messages[]{ from, authorName, body, sentAt }` · `createdAt` · `updatedAt`

Mock support conversations for the customer dashboard.
`from` is `customer | support`, `status` is `open | closed`. A reply from the
dashboard appends to `messages[]` through `updateItem`, so it persists in the
overlay and writes an audit entry like any other edit.

Future private website chat is the only communication channel whose complete
message history is automatically stored in MongoDB. It must not synchronize
Gmail or any external inbox.

## notifications — 10 (`notif-`)
`id` · `userId` · `type` · `title` · `message` · `link` · `read` · `createdAt`

## auditLogs — 10 (`log-`)
Append-only in practice; read-only in the admin panel.
`id` · `action` · `entity` · `entityId` · `entityLabel` · `userId` ·
`userName` · `timestamp` · `summary`

Every `createItem`, `updateItem`, `deleteItem`, and `updateSingleton` call
appends one entry automatically.

---

# Singletons

Single objects rather than lists, read with `getSingleton(name)` and written
with `updateSingleton(name, changes)`.

## cmsHomepage
`hero{ headline, subheadline, backgroundImage, primaryCtaLabel, primaryCtaLink,
secondaryCtaLabel, secondaryCtaLink, trustPoints[] }` and `sections[]`.

Each section: `key` · `order` · `visible` · `heading` · `subtext` ·
`ctaLabel` · `ctaLink` · `itemIds[]`. There are 13 sections:
featuredPackages, popularDestinations, thingsToDo, whyChooseUs,
fixedDepartures, meetOurGuides, trekkingHighlights, expeditions,
customerReviews, travelUpdates, certificatesAndTrust, blogHighlights,
planYourTripCta.

## menu
`mainMenu[]{ label, path, children[] }` · `customerMenu[]` · `adminMenu[]`

## footer
`columns[]{ heading, links[] }` · `socialLinks[]` · `newsletterHeading` ·
`newsletterSubtext` · `legalLinks[]` · `copyrightLine`

## planYourTripPage
`headline` · `intro` · `steps[]{ title, body }` ·
`seasonHints[]{ season, body }` · `budgetHints[]{ band, body }` · `reassurance`

Both were added with the public planning content. The About and Plan Your Trip
pages carry business prose, and project architecture keeps business copy out of
components, so it lives here as editable CMS content rather than hard-coded JSX.

## contactDetails
`companyName` · `tagline` · `addressLines[]` · `phone` · `whatsapp` ·
`whatsappEnabled` · `publicEmail` · `email` · `emailEnabled` · `supportEmail` ·
`emergencyPhone` · `emergencyContactWording` · `officeHours` · `responseTime` ·
`mapEmbedNote` · `facebookPageUrl` · `facebookMessengerUrl` · `instagramUrl` ·
`socialLinks[]`

All contact values are fictional demo data on `campfornepal.example.com`.
Public email and WhatsApp actions must respect the enabled flags. Email contact
opens external composers only; the app does not authenticate with Gmail and does
not send email.

## sitePages
`pages[]{ key, title, headline, intro, status, sections[]{ heading, body } }`

This is the editable source for About, Privacy, Terms, and Cancellation
Policy. Published legal content is rendered at `/privacy-policy`,
`/terms-and-conditions`, and `/cancellation-policy`; `/booking-policy` is a
legacy compatibility route to the same Cancellation Policy record. Public
routes render only `published` pages.

## siteSettings
`siteName` · `defaultLanguage` · `defaultCurrency` · `demoMode`

Currency is display-only in V1. The selected currency does not calculate or
convert package prices. `demoMode` is the central V1 demo switch. When it is
true, public form success reads: “Your demo request was saved in this browser.
No message was sent to Camp For Nepal.” Contact details, trust records, users,
guide verification, and operational data must be identified as browser-local
sample data rather than live services or real-world evidence.

## notificationTemplates
`templates{ new_inquiry, booking_status, review_submitted, post_published }`
with each template holding `label`, `title`, and `message`. Notifications are
in-app only unless a future delivery module changes the scope.

---

# Notes for the V2 backend

- Replacing `dataClient.js` internals with real `fetch` calls should be the
  whole migration. No component changes.
- Keep the `{ success, message, data, meta }` envelope.
- `listItems` options are `{ search, filters, sort, direction, page, pageSize }`.
  `pageSize: 0` means "return everything".
- Ids are strings with a per-collection prefix. Slugs are unique within a
  collection and both `getItem(entity, id)` and `getItem(entity, slug)` resolve.
- Image fields are path strings only. V1 stores no files.
- `notificationTemplates` is a singleton, so server-side in-app notification
  rendering can use the same editable copy without exposing operational logic
  to the client.
