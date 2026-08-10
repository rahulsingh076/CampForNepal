# Inquiry API

One endpoint behind every public form on the site, and six staff endpoints
behind the CRM that works the resulting queue.

Current inquiry scope: no booking, no payment, and no message delivery. Nothing
here emails, texts, or WhatsApps anybody.

---

## Why one endpoint

The frontend already funnels package inquiries, custom trips, contact messages,
callback requests, and guide requests through a single `createInquiry` call
with a `type` field. This mirrors that exactly.

Five near-identical collections would drift apart within a month, and privacy
would have to be got right five times. One collection, one queue, one place to
audit.

---

## Public: `POST /api/v1/inquiries`

Anonymous. CSRF protected. Rate limited.

### The client flow

```
1.  GET  /api/v1/auth/csrf-token     → { data: { csrfToken } }
2.  POST /api/v1/inquiries           X-CSRF-Token: <token>
                                     credentials: 'include'
                                     { type, fullName, … , consent: true }
                                     → 201 { data: { referenceCode, status, submittedAt } }
```

Anonymous does not mean unprotected. A forged submission is exactly what
somebody would use to flood the CRM, so the same synchroniser token and the
same `Origin` check apply here as everywhere else.

### Types

| Type | Also requires |
| --- | --- |
| `package_inquiry` | a published `packageId` |
| `custom_trip` | enough trip context to act on — a message, a destination, a date, a group size, or a trip type |
| `contact` | a `message` |
| `callback` | a `phone` or `whatsapp` — an email address cannot be called |
| `guide_request` | a public `guideId` |
| `emergency` | a `phone` or `whatsapp`, and a `message` |

`emergency` is canonical — the admin CRM filters on it — but **no public form
produces one yet**. The type is supported so the CRM keeps working and a future
urgent-support form has somewhere to land.

### Common rules

- `fullName` is required.
- **At least one of `email`, `phone`, `whatsapp`.** Not all three: the callback
  form collects only a phone, the contact form only an email. An empty string
  means "not given", not "invalid" — `CallbackForm` sends `email: ''`.
- `consent` (or `consentAccepted`) must be affirmatively true.
- `numberOfPeople` / `groupSize` is a whole number from 1 to
  `INQUIRY_MAX_PEOPLE`.
- Dates must parse. An unreadable date is an error, not a silent null — a trip
  date that quietly disappears is worse than one that is rejected.
- Text is plain text. Length-capped, control characters removed, ordinary
  Unicode preserved.

### Field names

The frontend and the canonical model disagree in three places. **Both spellings
are accepted** and one is stored. See
[FRONTEND_INQUIRY_MAPPING.md](FRONTEND_INQUIRY_MAPPING.md) for the full table.

| Frontend sends | Canonical | Stored as |
| --- | --- | --- |
| `preferredDate` | `travelDate` | `trip.travelDate` |
| `groupSize` | `numberOfPeople` | `trip.numberOfPeople` |
| `consent` | `consentAccepted` | `consent.accepted` |

### Fields a request may not set

These are **rejected with a 400**, not stripped. Stripping would let somebody
probe which fields exist by watching what survives; a refusal says no once.

```
status  priority  source  assignedToUserId  assignedTo  userId
internalNotes  statusHistory  convertedBookingId  referenceCode
idempotencyKeyHash  spamSignals  submissionMetadata
consentAcceptedAt  privacyPolicyVersion
password  passwordHash  role  sessionVersion
createdAt  updatedAt  _id  id
```

An unknown field is also refused — a typo like `emial` should tell somebody
rather than vanish.

### Success

```json
{
  "success": true,
  "message": "Your inquiry has been saved.",
  "data": {
    "referenceCode": "CFN-2026-7K9Q2M",
    "status": "new",
    "submittedAt": "2026-08-07T11:10:27.477Z"
  },
  "meta": { "requestId": "…" }
}
```

Three fields, deliberately. **No MongoDB id**: an ObjectId leaks its creation
time and a rough insertion order, and the reference code is the identifier a
person can read down the phone. No priority, no assignment, no internal state.

The website may then offer external continuation actions: Open Email App, Open
Gmail, Continue on WhatsApp, and Start Private Chat when dedicated chat exists.
That is a separate customer action. The API response must not be
treated as proof that an email, WhatsApp message, or social direct message was
sent.

Correct public confirmation:

> Your inquiry has been saved. No email has been sent yet. Open your email
> application, review the prepared message, and press Send.

For `emergency` the message is honest and promises nothing:

> Your request has been recorded. This website form does not guarantee
> immediate emergency assistance. Use the published phone or WhatsApp contact
> for urgent help.

**No response time is promised anywhere**, for any type. The current inquiry
flow sends no message, so a promise would be a lie the code cannot keep.

### External email content

Prefilled email subjects and bodies are built by the frontend integration from
server-validated or database-backed values. Include the `referenceCode`, package
or guide title when available, preferred travel date, number of travellers, and
a short non-sensitive customer message.

Do not include passport or identity numbers, card details, CVV, bank
credentials, passwords, OTP codes, confidential medical information, internal
staff notes, or private guide information. Validate the configured company email
before constructing `mailto:` or Gmail compose links, and encode subject/body
values safely.

### Validation failure

```json
{
  "success": false,
  "message": "Please correct the highlighted inquiry fields.",
  "data": null,
  "meta": {
    "requestId": "…",
    "errors": { "email": "Enter a valid email address." }
  }
}
```

One message per field, so somebody fixes their whole form once.

### Catalogue references

Resolved server-side, by id or by slug. A `sourceId` is never matched — that is
the internal migration key.

- A package must be **published**. Draft, hidden, and archived cannot receive
  public inquiries.
- A guide must have `publicProfile: true` and a published status.
- A departure must exist, must not be a draft, and must belong to the selected
  package.

The refusal is **identical** whether the record is missing or merely
unpublished. Saying "that exists but is a draft" would turn the endpoint into a
way to enumerate unreleased trips.

Resolved records are **snapshotted from the database** — title, slug, departure
date, guide name — so a staff member reading a six-month-old inquiry knows what
was being discussed. A browser-supplied title is never stored.

**No seats are reserved and `bookedSeats` never changes.** An inquiry is a
question, not a booking.

### Rate limiting

`INQUIRY_PUBLIC_MAX_SUBMISSIONS` per `INQUIRY_PUBLIC_WINDOW_MS` per address
(10 per 15 minutes by default). Refusals are 429 in the standard envelope with
a generic message that exposes no counter.

The counter is in memory, so it is **per process**. A shared store is required
before running more than one instance. It does not apply to staff CRM routes —
an agent working through the queue makes far more requests than any visitor.

### The honeypot

A hidden field, named by `INQUIRY_HONEYPOT_FIELD` (**`company-website`**, which
is what `HoneypotField.jsx` renders).

When it is filled, the server **stores nothing at all** — not even a flagged
record, because keeping spam would mean keeping the personal details inside it —
and returns a normal-looking 201. A bot told "spam detected" learns to work
around the check; one told "thank you" reports success and moves on.

> **Frontend gap.** `useForm` currently blocks a filled honeypot client-side and
> never sends it. A real bot posts straight to the API and never runs React, so
> the server-side check is the one that matters. The frontend API integration must
> forward the field.

### Minimum fill time

`INQUIRY_MIN_FILL_TIME_MS` (3000ms, matching the frontend) is recorded as a
**weak signal only**. A fast submission is never rejected on its own — people
using autofill, a password manager, or a keyboard confidently are fast, and
refusing them would break the form for exactly the users who are best at it.

CSRF, rate limiting, explicit validation, and the honeypot carry the weight.

### Idempotency

Optional `Idempotency-Key` header, 8–200 characters. Header only — a key in a
query string ends up in access logs, browser history, and referrer headers.

A repeat of the same key returns the original result instead of creating a
second inquiry. This solves an ordinary problem: a double-click, or a dropped
connection after the server committed but before the response arrived.

The raw key is **never stored**. Only a SHA-256 hash goes to the database. It is
not authentication and grants no read access to anything.

---

## Staff CRM

All seven require an authenticated session, an active account, a valid
`sessionVersion`, and an explicitly allowed role. Unsafe methods need CSRF.

| Method | Path | Roles |
| --- | --- | --- |
| GET | `/inquiries` | admin, super_admin |
| GET | `/inquiries/:id` | same |
| PATCH | `/inquiries/:id/status` | same |
| PATCH | `/inquiries/:id/follow-up` | same |
| POST | `/inquiries/:id/notes` | same |
| PATCH | `/inquiries/:id/assignment` | admin, super_admin |
| PATCH | `/inquiries/:id/priority` | admin, super_admin |

There is **no `DELETE`** — an inquiry is somebody's request for help and part of
the audit trail; it is closed, never erased. There is **no `/convert`** —
conversion creates a booking, which belongs to the future booking workflow.

### `GET /inquiries`

Filters: `search`, `type`, `status`, `priority`, `assignedToUserId`,
`unassigned`, `country`, `createdFrom`, `createdTo`, `followUpFrom`,
`followUpTo`, `page`, `limit`, `sort`.

`req.query` never reaches Mongoose. Every value is parsed by name.

Sort: `createdAt`, `updatedAt`, `followUpAt`, `referenceCode`, each with a `-`
prefix for descending. Anything else is a 400.

Search covers `referenceCode`, contact name, email, phone, WhatsApp, and
subject. The term is **escaped** — unescaped, `.*` matches everything and a
nested quantifier can hang the process.

A list row carries no message body, **no internal notes, and no status
history**. A list endpoint returning those would ship every note in the
database to anybody who could reach page 1.

### `GET /inquiries/:id`

Adds the message, the callback preferences, the consent record, the resolved
package/departure/guide summaries, the internal notes, and the full status
history.

Never returns `idempotencyKeyHash`, `spamSignals`, `submissionMetadata`, a
session identifier, a CSRF token, a password field, a `sourceId`, or any
private guide field. Related records go through explicit allowlists rather than
a broad `populate`.

### `PATCH /inquiries/:id/status`

```json
{ "status": "contacted", "fromStatus": "new", "reason": "Optional, internal" }
```

`fromStatus` is optional but recommended: it makes the write conditional, so a
colleague who moved the inquiry first wins and this returns **409** rather than
silently overwriting their transition. See [CRM_WORKFLOW.md](CRM_WORKFLOW.md).

`changedByUserId` and `changedAt` come from the session and the server clock. A
body supplying them is ignored — an actor a client could choose is not an audit
trail.

### `POST /inquiries/:id/notes`

```json
{ "text": "Called, left a message." }
```

Plain text, length-capped, author from the session, timestamp from the server.
**Append only**: there is no edit and no delete endpoint, so a note is a
permanent record of what somebody knew and when.

### `PATCH /inquiries/:id/follow-up`

```json
{ "followUpAt": "2026-09-01T09:00:00.000Z" }
```

`null` clears it. **A past date is allowed** — staff record overdue follow-ups
and backfill ones made by phone yesterday. No notification is sent; the current
inquiry flow sends nothing.

### `PATCH /inquiries/:id/priority`

```json
{ "priority": "high" }
```

`normal`, `high`, or `urgent`. Managers only: letting anybody raise their own
tickets to urgent makes the field meaningless.

---

## Status codes

| Code | When |
| --- | --- |
| 201 | Created |
| 400 | Validation, a privileged field, an unknown field, an unresolvable reference, or a manual `converted` |
| 401 | Not signed in |
| 403 | Missing/invalid CSRF token, a disallowed `Origin`, or a role refusal |
| 404 | No such inquiry (including a malformed id) |
| 409 | An invalid transition, or somebody else changed it first |
| 429 | Rate limited |

No error exposes a Mongoose internal, a collection name, a database detail, a
hidden package, a private guide, or a stack trace in production.
