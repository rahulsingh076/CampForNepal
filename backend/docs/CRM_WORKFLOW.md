# Inquiry CRM workflow

What happens to an inquiry after somebody submits it, who may move it, and why
it can only move one way.

---

## The lifecycle

```
        ┌──────────► lost ────────┐
        │                         │
new ──► contacted ──► quoted ─────┼──► closed
        │             │           │
        └─────────────┴───────────┘

converted ──► closed        (booking conversion only — see below)
```

| Status | Means |
| --- | --- |
| `new` | Submitted, nobody has picked it up |
| `contacted` | Somebody has replied |
| `quoted` | A price or itinerary has gone out |
| `converted` | It became a booking |
| `lost` | The person went elsewhere or stopped replying |
| `closed` | Finished, for any reason |

### Allowed moves

| From | To |
| --- | --- |
| `new` | `contacted`, `lost`, `closed` |
| `contacted` | `quoted`, `lost`, `closed` |
| `quoted` | `lost`, `closed` |
| `converted` | `closed` |
| `lost` | `closed` |
| `closed` | *nothing* |

Anything else is a **409**, and the API never silently repairs it. A status
field that accepts any value is a free-text field, and the history stops
meaning anything.

### It only moves forward

An inquiry never returns to `new`, and a closed one is not reopened in the
current CRM scope. Reopening needs its own endpoint with its own audit trail —
that is real work, not a missing `if`.

---

## `converted` is reserved for booking conversion

No CRM endpoint can set it. `allowedTransitions()` filters it out of every list,
so it is not merely undocumented — the API cannot offer it.

An inquiry becomes `converted` because a booking was created, not because
somebody picked it from a menu. A `converted` inquiry with no booking behind it
is a lie in the reporting, and reporting is the only reason the status exists.

---

## Who may do what

| Action | admin | super_admin |
| --- | --- | --- |
| List and read | yes | yes |
| Add an internal note | yes | yes |
| Set a follow-up date | yes | yes |
| Change status | yes | yes |
| **Assign** | yes | yes |
| **Change priority** | yes | yes |
| Set `converted` | **no** | **no** |
| Delete | *no endpoint exists* | |

`customer` and `guide` have **no CRM access at all** — not list, not detail.
An allowlist that includes every signed-in account is not an allowlist.

Roles are checked on the server against the role stored in MongoDB, read fresh
on every request. The React admin panel hides links a role should not see; that
is a courtesy, not a boundary.

---

## The audit trail

### Status history

Append-only, `select: false`, staff-only.

Every entry records `fromStatus`, `toStatus`, who changed it, when, and an
optional short reason. The first entry is written at submission with
`toStatus: 'new'` and **no actor** — a public submission has no staff member
behind it.

The actor comes from the session and the time from the server clock. A body
supplying `changedByUserId` or `changedAt` is ignored. An audit trail whose
actor a client can choose proves nothing.

### Internal notes

Append-only, `select: false`, staff-only. Author from the session, timestamp
from the server.

There is **no edit endpoint and no delete endpoint**. A note is a permanent
record of what somebody knew at the time, which is the only version worth
having when a complaint arrives six months later.

Notes never appear in the list view, and never reach the person who submitted
the inquiry.

---

## Two people at once

Admins work the same queue. Two people can open the same inquiry, and both can
press a button.

The status update is a **conditional write**: the request may name the status
the caller believed was current, and the update only matches while that is
still true.

```
Agent A reads "new" ─► moves to "contacted" ─► 200
Agent B reads "new" ─► moves to "lost"      ─► 409
```

B's transition is refused rather than applied. Without the condition, B's write
would overwrite A's and **drop the history entry A just wrote** — the trail
would show a move that never happened and hide one that did.

The 409 message says somebody else changed it and to reload. That is a normal
thing to happen in a shared queue, not an error worth hiding.

---

## What this workflow does not do

- **Nothing is sent.** No email, no SMS, no WhatsApp, no push notification. A
  follow-up date is a note to staff, not an alarm.
- **No booking is created**, by any route.
- **No payment** of any kind exists.
- **No inquiry is ever deleted.** There is no endpoint, and no TTL — a
  retention policy is an owner decision that has not been made. See
  [INQUIRY_PRIVACY.md](INQUIRY_PRIVACY.md).
