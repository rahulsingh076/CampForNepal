# Authentication

How someone signs in to Camp For Nepal, what the server remembers about them,
and why each piece is built the way it is.

Current auth scope: sessions and roles only. There is no email verification,
password reset, social login, or payment flow. Those are future features.

---

## The short version

- Passwords are hashed with **Argon2id**. Nothing else is accepted.
- A sign-in creates a **server-side session** stored in MongoDB. The browser
  gets a cookie holding a signed session id and nothing else.
- Every state-changing request needs a **CSRF token** in `X-CSRF-Token`.
- The **role is read from the database on every request**, never from the
  session or the cookie.
- Everything is enforced on the server. The frontend's role checks are a
  convenience for hiding menu items, not a security boundary.

---

## Endpoints

All paths are under `API_PREFIX`, which defaults to `/api/v1`.

| Method | Path | Who | What it does |
| --- | --- | --- | --- |
| GET | `/auth/csrf-token` | anyone | Issues the CSRF token for this session |
| POST | `/auth/register` | anyone | Creates a customer account and signs in |
| POST | `/auth/login` | anyone | Signs in |
| GET | `/auth/me` | signed in | Returns the current user |
| POST | `/auth/logout` | signed in | Ends this session |
| POST | `/auth/logout-all` | signed in | Ends every session, including this one |
| POST | `/auth/change-password` | signed in | Changes the password, ends other sessions |

Every response uses the same envelope as the rest of the API:

```json
{ "success": true, "message": "", "data": null, "meta": { "requestId": "…" } }
```

### The client flow

```
1.  GET  /api/v1/auth/csrf-token        → { data: { csrfToken } }
2.  POST /api/v1/auth/login             X-CSRF-Token: <token>
                                        { email, password }
                                        → { data: { user, csrfToken } }   ← a NEW token
3.  …use the new token for every later POST/PATCH/DELETE
```

Step 3 matters. Signing in regenerates the session, which discards the old CSRF
token on purpose. The login response carries the replacement.

**Every future frontend request must send `credentials: 'include'`.** Without
it the browser will not attach the session cookie and every authenticated call
returns 401 — including the one that reads the token.

```js
await fetch(`${API}/auth/login`, {
  method: 'POST',
  credentials: 'include',                 // required
  headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': token },
  body: JSON.stringify({ email, password }),
})
```

The frontend is **not** connected to this API. It still runs on its mock
`dataClient`; wiring it up is a future integration task.

---

## Passwords

**Argon2id**, with OWASP's baseline parameters: 19 MiB of memory, 2 iterations,
1 lane. It is memory-hard, which is what makes cracking on GPUs expensive.

- Minimum 12 characters, maximum 128.
- No composition rules. Requiring a symbol reliably produces `Password1!`, not
  entropy; length is what actually helps.
- Passwords are **never trimmed**. A leading space is a character the user
  chose, and silently removing it means the stored password differs from the
  typed one.
- The maximum exists so a large body cannot be used to burn CPU in the hash.
- On a successful sign-in, a hash made with older parameters is **re-hashed
  transparently** — the one moment the plaintext is legitimately available.

If the `argon2` package cannot be installed, the correct response is to stop and
report it. Substituting bcrypt would be a silent downgrade.

---

## Sessions

Stored in the `sessions` collection in MongoDB via `connect-mongo`.

The default `MemoryStore` is never used: it leaks memory, cannot be shared
between processes, and drops every session on restart.

### What the session holds

```js
{
  userId: '…',              // an ObjectId as a string
  sessionVersion: 0,        // compared against the user's, see below
  authenticatedAt: 1735…,   // when this session signed in
  absoluteExpiresAt: 1735…, // fixed at sign-in, never moved
  csrfToken: '…'            // 32 random bytes, hex
}
```

Five fields, and a test asserts that list exactly.

Deliberately **no role, no email, and no name**. Those are read from the
database on every authenticated request, so a demotion or a suspension takes
effect on the very next request instead of at the next sign-in.

### The cookie

| Attribute | Value | Why |
| --- | --- | --- |
| name | `SESSION_COOKIE_NAME` (`cfn.sid`) | Not `connect.sid`, which advertises the framework |
| `HttpOnly` | always | JavaScript cannot read it, so an XSS bug cannot steal it |
| `Secure` | always in production | Never sent over plain HTTP |
| `SameSite` | `lax` | Blocks cross-site form posts while normal navigation still works |
| `Path` | `/` | One session for the whole API |
| `Max-Age` | `SESSION_IDLE_TIMEOUT_MS` | Refreshed on each response (`rolling`) |

The cookie carries a **signed session id only**. There is no user data in it to
decode and no role in it to edit.

### Two timeouts

| Limit | Default | Enforced by | Behaviour |
| --- | --- | --- | --- |
| Idle | 30 minutes | The cookie's `Max-Age` **and** the MongoDB store's TTL | Both slide forward on each response, because the session is `rolling` |
| Absolute | 8 hours | `absoluteExpiresAt` + the `sessionTimeout` middleware | Fixed at sign-in. Never slides |

The absolute limit is the one that matters after a theft: a stolen session
cannot be kept alive forever by making a request every few minutes. Nothing
else enforces it, which is why it is checked in application code rather than
left to a TTL.

A session with no `absoluteExpiresAt` is treated as **expired**, not as
unlimited. A malformed session has to fail closed.

An expired session is destroyed and the request continues **as anonymous**, so a
public page still renders. `requireAuth` is the single place that answers 401.

### Session version — "sign out everywhere"

Each user has a `sessionVersion` counter. It is copied into the session at
sign-in and compared on every authenticated request. Raising it on the user
invalidates every session already sitting in the store, without having to find
and delete them.

It is raised by a password change and by `POST /auth/logout-all`.

---

## CSRF protection

Synchroniser-token pattern. The token lives in the session, server-side; the
client sends it back in the `X-CSRF-Token` header.

- Applied globally to `POST`, `PUT`, `PATCH`, and `DELETE` — so a
  future state-changing route cannot forget it.
- `GET`, `HEAD`, and `OPTIONS` skip it, so the public catalogue is unaffected.
- Compared with `timingSafeEqual`, so the token cannot be guessed one character
  at a time.
- Rotated whenever a session is regenerated — sign-in, and password change.

Why bother when the cookie is already `SameSite=lax`? Because SameSite is a
browser default rather than a guarantee: old browsers ignore it, `lax` still
permits top-level navigations, and one permissive CORS change can undo it. The
token is the part an attacker on another origin genuinely cannot read.

There is a second, independent barrier: the **`Origin` header** is checked
against `CORS_ORIGINS` on every unsafe method. A browser always sends it on a
cross-origin state-changing request and an attacker's page cannot forge it. A
request with *no* `Origin` is allowed past that check — curl, a monitor, and a
server-to-server call are not browsers and are not subject to CSRF — but the
token is still required for them.

Login is protected too. A forged login is a real attack: it signs the victim
into an account the attacker controls, and then watches what they do there.

Logout is deliberately **not** behind `requireAuth`. Signing out has no side
effect worth guarding with a 401, and refusing it because the session already
lapsed makes the button fail for exactly the person who needed it. CSRF still
applies.

---

## Brute-force defence

Two independent layers, because either alone is evadable.

| Layer | Scope | Configured by |
| --- | --- | --- |
| Rate limit | per client address | `AUTH_LOGIN_WINDOW_MS`, `AUTH_LOGIN_MAX_ATTEMPTS` |
| Account lock | per account | `AUTH_ACCOUNT_LOCK_THRESHOLD`, `AUTH_ACCOUNT_LOCK_MS` |

An IP limit alone is defeated by a botnet. An account lock alone still allows
one guess sprayed across thousands of accounts. Together they cover both.

Only **failed** sign-ins count toward the rate limit, so signing in and out
repeatedly never locks someone out of their own account. Registration counts
every request, because a successful registration is exactly what an abuser
wants.

The rate-limit counter is in memory, so it is per process. Running more than one
instance would need a shared store; the account lock lives in MongoDB and works
either way.

---

## Not leaking who has an account

Every sign-in failure returns the same 401, without exception:

> Invalid email or password.

- A wrong password, an unknown email, a **locked** account, and a **suspended**
  account are indistinguishable from outside.
- An unknown email still verifies the submitted password against a dummy Argon2
  hash, so the two paths take a comparable amount of time. Without that,
  response timing alone would reveal which addresses are registered.
- Registration does return 409 on a duplicate email. That is unavoidable —
  the form has to say the address is taken — and it is rate limited.

**The cost is real and accepted.** A customer whose account is temporarily
locked is told only that their credentials are wrong, with no hint that waiting
fifteen minutes would fix it. The alternative — an honest "your account is
locked" — confirms to anybody who guessed an address that it belongs to a real
account worth attacking. When email delivery exists, a
lockout notice sent to the account holder is the right way to close that gap.

---

## What a request cannot do

- **Choose a role.** `role` and `status` in a registration body are dropped
  before anything is created. Public registration always produces a `customer`.
- **Inject a query.** Every field is type-checked, so `{"email": {"$ne": null}}`
  is a 400 rather than a query operator.
- **See a hash.** `passwordHash`, `failedLoginAttempts`, `lockUntil`, and
  `sessionVersion` are `select: false` and are stripped again by the shared JSON
  transform, so they cannot reach a response even by accident.

---

## The first administrator

There is no route that grants a privileged role, so the first `super_admin` is
created by a script:

```bash
# in backend/.env
ALLOW_BOOTSTRAP_SUPER_ADMIN=true
BOOTSTRAP_SUPER_ADMIN_NAME="…"
BOOTSTRAP_SUPER_ADMIN_EMAIL="…"
BOOTSTRAP_SUPER_ADMIN_PASSWORD="…"

npm run bootstrap:super-admin
```

Then set `ALLOW_BOOTSTRAP_SUPER_ADMIN=false` and clear the three values.

The script refuses to run if a `super_admin` already exists, and never prints
the password.

---

## Configuration

See `.env.example`. Auth-related variables:

| Variable | Default | Notes |
| --- | --- | --- |
| `SESSION_SECRETS` | — | Comma separated. The first signs; the rest still verify, which is how a secret is rotated without ending every session |
| `SESSION_COOKIE_NAME` | `cfn.sid` | Must not be `connect.sid` |
| `SESSION_COOKIE_SECURE` | `false` dev / forced `true` in production | |
| `SESSION_COOKIE_SAMESITE` | `lax` | |
| `SESSION_IDLE_TIMEOUT_MS` | 1800000 | 30 minutes |
| `SESSION_ABSOLUTE_TIMEOUT_MS` | 28800000 | 8 hours. Must exceed the idle timeout |
| `SESSION_TOUCH_AFTER_SECONDS` | 60 | How often a session document is rewritten |
| `AUTH_LOGIN_WINDOW_MS` | 900000 | 15 minutes |
| `AUTH_LOGIN_MAX_ATTEMPTS` | 10 | Failed sign-ins per window, per address |
| `AUTH_ACCOUNT_LOCK_THRESHOLD` | 5 | Failures before an account locks |
| `AUTH_ACCOUNT_LOCK_MS` | 900000 | How long the lock lasts |
| `TRUST_PROXY_HOPS` | 0 | A count, never `true` — see below |
| `ALLOW_BOOTSTRAP_SUPER_ADMIN` | `false` | |
| `AUTH_TEST_DATABASE_NAME` | `camp_for_nepal_auth_test` | Must end in `_test`. Rejected if it is `camp_for_nepal`, `production`, or `staging` |

Each secret must be at least 32 characters of real randomness:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
```

`TRUST_PROXY_HOPS` is a number rather than a boolean on purpose. Setting Express
to trust every proxy hop lets any client spoof `X-Forwarded-For`, which defeats
the IP rate limit. Set it to the number of proxies actually in front of the
server: `0` locally, `1` behind a single load balancer.

The seed scripts do not start the Express stack, so they load configuration with
`requireAuthConfig: false` and keep working on a machine with no session secret.

---

## Testing

| Command | What it runs | Result |
| --- | --- | --- |
| `npm test` | 316 tests, no database | 316 / 316 |
| `npm run test:auth` | 143 tests, against the test database | 143 / 143 |
| `npm run verify:auth` | the whole flow end to end | 16 / 16 |

### One environment file, two databases

There is **no `.env.test`**. The integration tests create and delete real users,
so they get their own database — but not their own configuration file, because
a second env file is one more thing to drift out of sync and one more place a
credential can be pasted.

Instead `npm run test:auth` loads the ordinary `.env`, reuses its host and
credentials, and **replaces only the database name** with
`AUTH_TEST_DATABASE_NAME`.

Four assertions run against the *live* connection before anything is deleted:

1. the name ends in `_test`
2. it is not `camp_for_nepal`, `production`, or `staging`
3. it matches `AUTH_TEST_DATABASE_NAME` exactly
4. a connection is actually open

Only accounts at `@authtest.invalid` are removed. `dropDatabase` is never
called, anywhere in the repository.

`AUTH_TEST_DATABASE_NAME` is validated twice over. The server refuses to boot if
it is set to anything that does not end in `_test`, or to `camp_for_nepal`,
`production`, or `staging`. The test helper refuses to *run* on the same
grounds, and additionally when it is blank — the server tolerates a missing
test-only variable, the tests must not.

Without `MONGODB_URI` the HTTP suite skips with a reason instead of failing, so
plain `npm test` stays green on a machine that has no `.env`.

---

## Implementation History

| Commit | What it was |
| --- | --- |
| `834a7e2` | Initial authentication, sessions, roles, and CSRF implementation |
| follow-up | The hardening pass — `Origin` validation, the five-field session payload, absolute-expiry enforcement, `AUTH_TEST_DATABASE_NAME`, `req.auth`, registration preferences, public logout, `verifyAuth.js`, and session-store shutdown |

`834a7e2` was not amended. It may already be referenced elsewhere, and a
follow-up commit is the safer way to correct a commit that is already published.

### Rate limiting in tests

Each `describe` block builds its own app. The login and register limiters count
in memory *per app*, so a shared instance would let one group exhaust another
group's budget and produce 429s that look like real failures.
