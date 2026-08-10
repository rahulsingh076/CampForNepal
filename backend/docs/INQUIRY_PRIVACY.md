# Inquiry privacy

Every personal field an inquiry stores, why it is collected, who can see it,
and what has not been decided yet.

---

## The shape of the problem

An inquiry is the most personal record this system holds. Somebody tells us
their name, how to reach them, where they want to go, who they are travelling
with, and sometimes why. They do that to get a reply, not to be profiled.

Two rules follow, and everything below is an application of them:

1. **Collect what a reply needs.** Nothing is stored "in case it is useful
   later".
2. **What is stored for staff stays with staff.** Internal notes and status
   history are never returned to the person who submitted the form.

---

## What is collected

### Contact

| Field | Why | Required | Types |
| --- | --- | --- | --- |
| `contact.fullName` | To address a reply to a person | Yes | all |
| `contact.email` | To reply | One of three | all |
| `contact.phone` | To reply or call back | One of three | all; required for `callback` and `emergency` |
| `contact.whatsapp` | Many travellers prefer it | One of three | all |
| `contact.country` | Time zone, visa context, likely language | No | all |
| `contact.language` | Which language to reply in | No | all |
| `contact.nationality` | Permit and visa rules genuinely differ by nationality | No | `custom_trip` |
| `contact.preferredContactMethod` | To use the channel they asked for | No | all |

At least one of email, phone, and WhatsApp is required — **not all three**. A
form that demands a phone number to answer an email is collecting data it does
not need.

`nationality` is collected because trekking permits actually depend on it. It
is **never** used to set priority, and never as a proxy for anything else.

### Trip

`packageId`, `fixedDepartureId`, `guideId`, `destinationInterest`,
`travelDate`, `flexibleDates`, `numberOfPeople`, `budgetRange`, `tripType`,
`guideLanguage`, `hotelNeeded`, `transportNeeded`.

All optional. All operational: they are what somebody needs to answer the
question. `budgetRange` is a band, never a figure, and like everything else here
it has no effect on how quickly an inquiry is handled.

### Message

`subject`, `message`, `specialRequest`. Free text, plain text, length-capped.

People sometimes disclose things in a message that we would never ask for — a
health condition, a bereavement, a disability. There is no way to prevent that
and no attempt to parse or classify it. It is stored as written, visible only
to CRM staff, and never used to sort the queue.

### Consent

| Field | Source |
| --- | --- |
| `consent.accepted` | Must be affirmatively true in the request |
| `consent.acceptedAt` | **Server clock** |
| `consent.privacyPolicyVersion` | **Server configuration** |

The time and the version come from the server. A browser-supplied consent
timestamp proves nothing, and a client-chosen policy version could claim
consent to a policy that never existed.

This is **operational consent only** — permission to use these details to
answer this inquiry. It is not marketing consent. Nothing subscribes anybody to
anything, and the two must stay separate.

---

## What is deliberately not stored

| Not stored | Why |
| --- | --- |
| **IP address** | Personal data under GDPR, identifies a household, and the current inquiry flow does not need it |
| Session id | Storing an authentication artefact beside the data it protects turns one leak into two |
| CSRF token | Same |
| Cookies | Same |
| User agent | Fingerprintable, and no operational need |
| Passwords or hashes | An inquiry has nothing to do with authentication |
| Passport or identity numbers | Not needed to answer a question |
| Payment or bank details | No payment exists anywhere in this system |
| Identity or medical documents | No uploads exist |
| The submitted payload of a spam attempt | Keeping spam means keeping the personal details inside it |
| External email, WhatsApp, Facebook, Messenger, Instagram, or phone conversation content | Direct links cannot synchronize external conversations, and private website chat is the only planned stored conversation channel |

`submissionMetadata` holds exactly two fields: a capped `Accept-Language` and a
server timestamp.

A later external-contact event record may store only privacy-safe action facts
such as composer opened, external link opened, or email address copied. It must
not automatically store message sent, delivered, or read events.

---

## Who can see what

| Audience | Sees |
| --- | --- |
| The person who submitted | `referenceCode`, `status`, `submittedAt`. Nothing else |
| `admin`, `super_admin` | The full record, notes, and history |
| `customer`, `guide` | **Nothing** — no list, no detail |
| Anonymous | Nothing |

Never returned to anybody, in any response: `idempotencyKeyHash`,
`spamSignals`, `submissionMetadata`, raw `_id`, `__v`, `sourceId`, or any
private User or Guide field.

Two independent mechanisms enforce this — `select: false` on the model, and
allowlist serializers — because `.lean()` bypasses the first. A previous
serializer defect proved why both layers are needed.

---

## Owner decisions still required

### 1. `PRIVACY_POLICY_VERSION` is `owner-required`

Every consent record currently stores the literal string `owner-required`,
which is not a published policy.

Development runs fine. **Production does not start** — the server refuses to
boot in production while the placeholder is set. Replace it with a real,
published, dated policy version before launch.

### 2. There is no retention policy

Inquiries are kept indefinitely. There is **no TTL index**, deliberately: a TTL
silently deletes records, and choosing how long to keep somebody's personal data
is not a decision to make in a schema file.

The owner needs to decide how long an inquiry is kept once it is `closed` or
`lost`, and whether that differs by type. Until then, nothing expires.

### 3. There is no export or erasure route

Somebody asking for a copy of their data, or asking for it to be deleted, has
no self-service route and no staff endpoint. Handling that today means a manual
database operation.

If this site serves visitors from the EU or the UK — it is a Nepal tourism site,
so it will — both are legal obligations, not features. They need building.

### 4. The frontend does not collect consent

Only `CustomTripForm` has a consent checkbox, and it does not forward it. The
other four forms have none.

The backend requires it, so the frontend API integration must add the checkbox to four
forms and forward it from all five. Until then the API will refuse every
submission the current React app produces — correctly. See
[FRONTEND_INQUIRY_MAPPING.md](FRONTEND_INQUIRY_MAPPING.md).
