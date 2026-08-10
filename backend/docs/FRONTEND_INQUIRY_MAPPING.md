# Frontend inquiry mapping

Every field the React forms send, what the backend accepts, and where it is
stored.

The frontend is **not connected to this API**. It still runs on its mock
`dataClient`. This document is the contract the frontend API integration has to
satisfy, and the record of four places where the two sides currently disagree.

---

## The single entry point

All five live forms call one function:

```js
// frontend/src/lib/createInquiry.js
createInquiry({ type, fullName, email, phone, country, subject, message,
                packageId, guideId, preferredDate, groupSize, userId })
```

`POST /api/v1/inquiries` accepts exactly that shape. It also accepts the
canonical spellings, so neither side has to change first.

---

## Field-by-field

| Frontend sends | Backend also accepts | Stored as | Required | Normalisation and validation |
| --- | --- | --- | --- | --- |
| `type` | — | `type` | Yes | One of the six canonical values |
| `fullName` | — | `contact.fullName` | Yes | Trimmed, single line, 2–200 chars |
| `email` | — | `contact.email` | One of three | Trimmed, lowercased. **`''` means "not given"** |
| `phone` | — | `contact.phone` | One of three | Trimmed; international shapes accepted |
| — | `whatsapp` | `contact.whatsapp` | One of three | As phone. Not collected by any form yet |
| `country` | — | `contact.country` | No | Trimmed, ≤100 |
| — | `language` | `contact.language` | No | Trimmed, ≤40 |
| — | `nationality` | `contact.nationality` | No | Trimmed, ≤100. Folded into `message` today |
| — | `preferredContactMethod` | `contact.preferredContactMethod` | No | `email`, `phone`, or `whatsapp` |
| `packageId` | — | `trip.packageId` | For `package_inquiry` | Resolved by id or slug; must be **published** |
| `guideId` | — | `trip.guideId` | For `guide_request` | Resolved by id or slug; must be **public** |
| — | `fixedDepartureId` | `trip.fixedDepartureId` | No | Must exist, not be a draft, and belong to the package |
| **`preferredDate`** | **`travelDate`** | `trip.travelDate` | No | Must parse; an unreadable date is an error |
| **`groupSize`** | **`numberOfPeople`** | `trip.numberOfPeople` | No | Whole number, 1 to `INQUIRY_MAX_PEOPLE` |
| — | `destinationInterest` | `trip.destinationInterest` | No | Trimmed, ≤200 |
| — | `flexibleDates` / `dateFlexibility` | `trip.flexibleDates` | No | Trimmed, ≤40 |
| — | `budgetRange` | `trip.budgetRange` | No | Trimmed, ≤60. A band, never a figure |
| — | `tripType` | `trip.tripType` | No | Trimmed, ≤60 |
| — | `guideLanguage` | `trip.guideLanguage` | No | Trimmed, ≤60 |
| — | `hotelNeeded` | `trip.hotelNeeded` | No | Trimmed, ≤20 |
| — | `transportNeeded` | `trip.transportNeeded` | No | Trimmed, ≤20 |
| `subject` | — | `subject` | No | Single line, ≤300 |
| `message` | — | `message` | For `contact`, `emergency` | Plain text, ≤`INQUIRY_MAX_MESSAGE_LENGTH` |
| — | `specialRequest` / `specialPreferences` | `specialRequest` | No | Plain text |
| — | `preferredCallbackDate` | `callback.preferredDate` | No | Must parse |
| — | `preferredCallbackTime` / `when` | `callback.preferredTime` | No | Trimmed, ≤60 |
| — | `timezone` | `callback.timezone` | No | Trimmed, ≤60 |
| **`consent`** | **`consentAccepted`** | `consent.accepted` | **Yes** | Must be affirmative |

### Server-controlled — a request cannot set any of these

| Stored as | Source |
| --- | --- |
| `referenceCode` | Generated from a CSPRNG |
| `status` | Forced to `new` |
| `priority` | `urgent` for `emergency`, otherwise `normal` |
| `source` | Forced to `website` |
| `userId` | The authenticated session, or null |
| `consent.acceptedAt` | Server clock |
| `consent.privacyPolicyVersion` | `PRIVACY_POLICY_VERSION` |
| `snapshot.*` | Copied from the resolved catalogue records |
| `statusHistory[0]` | Written at creation, with no actor |

`userId` is notable: the frontend's `createInquiry` currently passes
`values.userId`, and the backend **rejects it**. Otherwise anybody could file an
inquiry against somebody else's account.

---

## The four mismatches

### 1. `consent` is required but four forms do not collect it

Only `CustomTripForm` has a consent checkbox, and `buildCustomTripInquiry` drops
it before calling `createInquiry`. The other four forms have none.

The backend requires it. **Nothing the current React app sends would be
accepted.**

This is deliberate. A backend that stores personal data without a consent record
is the wrong default, and the frontend is not connected yet, so nothing is
broken today.

> **Owner action.** The frontend API integration must add a consent checkbox to
> `ContactForm`, `InquiryForm`, `CallbackForm`, and `GuideAvailabilityForm`, and
> forward `consent` from all five including `CustomTripForm`.

### 2. The honeypot never reaches the network

`HoneypotField.jsx` renders an input named **`company-website`**. `useForm`
checks it client-side, blocks the submission, and never sends it.

That stops nothing: a bot posts straight to the API and never runs React. The
backend implements the check on `INQUIRY_HONEYPOT_FIELD`, defaulting to
`company-website` to match.

> **Owner action.** Forward the honeypot value with the submission so the server
> can act on it.

### 3. Four fields are collected then flattened into `message`

`CustomTripForm` collects `nationality`, `destinationInterest`, `tripType`,
`dateFlexibility`, `tripDuration`, `budgetRange`, `comfortLevel`, `language`,
`guideLanguage`, `hotelNeeded`, `transportNeeded`, and `specialPreferences` —
then `summariseBrief()` renders them all into one prose `message`.

The backend has typed columns for most of them. Sending them as fields would
make the CRM filterable by budget, trip type, and duration instead of leaving
staff to read prose.

> **Owner decision.** Send them as fields, keep the prose summary, or both. The
> API accepts either today.

### 4. No form sends `whatsapp` or `preferredContactMethod`

Three forms label their phone input "Phone or WhatsApp" and send one value. The
backend stores them separately, so somebody who only uses WhatsApp cannot say
so.

Low priority, but worth a separate field when those forms are next touched.

---

## The emergency type

`emergency` is canonical — it appears in the seed data and the admin CRM filter —
but **no public form produces one**. The backend supports the type so the CRM
keeps working and a future urgent-support form has somewhere to land.

Its response says plainly that a web form does not guarantee immediate help.
That sentence must stay honest: the current backend flow does not notify anybody.

---

## What the frontend gets back

```json
{ "referenceCode": "CFN-2026-7K9Q2M", "status": "new", "submittedAt": "…" }
```

The mock `dataClient` currently returns the whole created record. The real API
returns three fields. Any component reading `result.data.id` or
`result.data.fullName` from a submission needs updating during integration.

The `{ success, message, data, meta }` envelope is unchanged, so the outer
handling is already correct.

After this response, the frontend may show external continuation actions. It
must say the inquiry was saved and must not say an email, WhatsApp message, or
social direct message was sent.

Required email actions:

- Open Email App;
- Open Gmail;
- Copy Email Address.

The configured public email must come from company contact settings. Gmail is
opened as an external web compose URL in a new tab; Camp For Nepal does not
authenticate with Google and does not use Gmail API or SMTP.
