# Authentication security checklist

What is in place, where it lives, and what proves it. Every "verified by" line
points at a test that fails if the property is broken.

Current auth security status.

---

## Passwords

| Control | Where | Verified by |
| --- | --- | --- |
| Argon2id only — no bcrypt fallback | `src/utils/password.js` | `tests/auth/password.test.js` — hash starts `$argon2id$` |
| OWASP parameters (19 MiB, t=2, p=1) | `ARGON2_OPTIONS` | same file — parameters asserted in the encoded hash |
| Minimum 12 characters | `validatePasswordPolicy` | short password rejected with 400 |
| Maximum 128 characters | `validatePasswordPolicy` | over-long rejected, so hashing cannot burn CPU |
| Never trimmed | `validatePasswordPolicy` | `'  short  '` still fails on length |
| Random salt per hash | argon2 | the same password hashes differently twice |
| Plaintext never stored or logged | `user.service.js` | stored hash contains no part of the password |
| Old hashes upgraded on sign-in | `auth.service.js` | `passwordNeedsRehash` covered |
| A malformed stored hash reads as "no match", not a 500 | `verifyPassword` | five malformed inputs all return `false` |

---

## Password storage and exposure

| Control | Where | Verified by |
| --- | --- | --- |
| `passwordHash` is `select: false` | `user.model.js` | `tests/auth/user.model.test.js` |
| The shared JSON transform strips it again | `database/schemaOptions.js` | `JSON.stringify(user)` contains no `argon2` |
| The same for `failedLoginAttempts`, `lockUntil`, `sessionVersion` | `user.model.js` | public key list asserted exactly |
| No response body contains a hash | — | integration test greps every register response |

Two independent mechanisms, because `select: false` alone is not enough: a
document built in memory still materialises paths that have defaults.

---

## Sessions

| Control | Where | Verified by |
| --- | --- | --- |
| Stored in MongoDB, never `MemoryStore` | `src/config/session.js` | `sessions` collection exists after a sign-in |
| Cookie holds a signed id only — no user data | express-session | cookie value contains no email or role |
| `HttpOnly` | `config/session.js` | integration test asserts the attribute |
| `Secure` forced on in production | `config/env.js` | `SESSION_COOKIE_SECURE=false` is a boot error in production |
| `SameSite=lax` | `config/session.js` | attribute asserted |
| Cookie name is not `connect.sid` | `config/env.js` | boot error if it is |
| Session id regenerated at sign-in (fixation) | `auth.controller.js` | cookie value before ≠ after |
| Idle timeout, enforced by the cookie **and** the store's TTL | `config/session.js` | store `ttl` derived from the idle timeout |
| Absolute timeout that does not slide | `middleware/sessionTimeout.js` | `tests/auth/session.test.js`, plus an end-to-end test that rewrites the stored deadline |
| A session with no absolute deadline fails closed | same | treated as expired, not unlimited |
| The session holds exactly 5 fields, no role or email | `auth.controller.js` | the stored document's key list is asserted |
| The session store is closed at shutdown | `server.js`, `app.js` | the test process exits without hanging |
| An expired session is destroyed, not merely ignored | same | `destroy` called, cookie cleared |
| `sessionVersion` invalidates every session at once | `requireAuth`, `user.service.js` | a second device is signed out by a password change |
| Secret rotation without ending sessions | `SESSION_SECRETS` array | — (configuration; not exercised by a test) |

---

## CSRF

| Control | Where | Verified by |
| --- | --- | --- |
| Synchroniser token, held in the session | `middleware/csrfProtection.js` | `tests/auth/csrf.test.js` |
| Applied to every unsafe method, globally | `src/app.js` | POST without a token is 403 |
| Safe methods exempt, so the catalogue is untouched | same | GET passes with no token |
| 32 random bytes from a CSPRNG | `issueCsrfToken` | matches `/^[0-9a-f]{64}$/` |
| Constant-time comparison | `timingSafeEqual` | wrong-length token is 403, not a 500 |
| Rotated whenever the session is regenerated | `auth.controller.js` | login returns a different token |
| Another session's token does not work | — | integration test with two agents |
| Login itself is protected | global middleware | a forged login is a real attack |
| `Origin` validated against `CORS_ORIGINS` | `csrfProtection.js` | a foreign Origin is 403 even with a valid token |
| Logout is CSRF protected although it is public | `auth.routes.js` | logout with no token is 403 |

---

## Brute force and enumeration

| Control | Where | Verified by |
| --- | --- | --- |
| Per-address rate limit on login | `middleware/authRateLimit.js` | 429 after the configured budget |
| Only failures count toward it | `skipSuccessfulRequests` | signing in repeatedly does not lock you out |
| Per-account lockout | `auth.service.js` | account locks at the threshold |
| A locked account is not locked further by more guesses | `auth.service.js` | counter not incremented while locked |
| A successful sign-in clears the counter | `user.service.js` | counters reset to 0 |
| Rate limit on registration | `authRateLimit.js` | — (configuration; exercised indirectly) |
| Wrong password, unknown email, locked, and suspended are all byte-identical | `auth.service.js` | every one asserted to be `Invalid email or password.` |
| The lock is temporary, never permanent | `auth.service.js` | remaining lock time asserted within `AUTH_ACCOUNT_LOCK_MS` |
| Timing equalised with a real dummy hash | `verifyAgainstDummy` | timing ratio asserted under 10× |
| Attempts are counted only for a real account | `auth.service.js` | an unknown email writes nothing |
| `TRUST_PROXY_HOPS` is a count, never `true` | `src/app.js` | spoofed `X-Forwarded-For` cannot bypass the limit |

---

## Authorization

| Control | Where | Verified by |
| --- | --- | --- |
| Explicit allowlists, no numeric hierarchy | `middleware/requireRole.js` | `tests/auth/authorization.test.js` |
| `super_admin` inherits nothing implicitly | same | asserted directly |
| A missing `req.user` is 401, not a silent pass | same | asserted |
| An unknown role name throws at boot | same | asserted |
| Role read from the database on every request | `requireAuth` | changing a role in the database changes `/auth/me` |
| Suspension ends an existing session immediately | `requireAuth` | asserted |
| A suspended account cannot sign in | `auth.service.js` | 403 with the correct password |
| Registration cannot choose a role | `auth.validation.js` | `role: 'super_admin'` in the body still yields `customer` |
| Only the whitelisted fields survive validation | same | key list asserted exactly |
| Type checking blocks query injection | same | `{"email": {"$ne": null}}` is a 400 |

---

## Configuration and secrets

| Control | Where | Verified by |
| --- | --- | --- |
| Session secrets validated at boot (length, not a placeholder) | `config/env.js` | checked directly |
| Absolute timeout must exceed the idle timeout | same | checked directly |
| `.env` git-ignored; only `.env.example` committed | `.gitignore` | `git check-ignore` |
| There is no second env file to keep in sync | — | tests reuse `.env` and switch database by name |
| `MONGODB_URI` never logged or returned | `config/database.js` | error messages strip credentials |
| No secret in `.env.example` | — | placeholders only |
| Seed scripts do not require session variables | `requireAuthConfig: false` | `readEnv` returns zero problems without them |
| The test database name must end in `_test` | `config/env.js` | `camp_for_nepal`, `production`, and `staging` are all rejected |
| Tests check the **live** connection, not the configured string | `tests/helpers/authTestDatabase.js` | four assertions before any delete |
| `dropDatabase` is never called | — | it appears nowhere in the repository |
| Only `@authtest.invalid` accounts are deleted | same | the filter is a fixed pattern |

---

## OWNER ACTION REQUIRED — Atlas credential rotation

The MongoDB Atlas database-user password was exposed in a chat transcript
earlier in this project's development. It has **not been verified as rotated**,
and rotation cannot be verified from this repository — it happens in the Atlas
console and leaves no trace here.

The database username is the project's brand name, so it is guessable. A
guessable username plus an unrotated password is the whole credential.

Every repository-side check is clean: `.env` is ignored and untracked, and the
password, the URI, the host, and the session secret appear in **no tracked file
and in no commit on any branch**. That is not the same as the credential being
safe.

**This is a release blocker.** Rotate the Atlas database-user password, update
`backend/.env`, and restart the API. Until that is done, treat production
security as incomplete regardless of what the tests report.

---

## Required before production

Not defects — decisions that are correct now and must change at deployment.

| Requirement | Why |
| --- | --- |
| **HTTPS everywhere.** `SESSION_COOKIE_SECURE` is forced `true` in production, so the cookie will simply not be stored over plain HTTP | A session cookie over HTTP is readable by anything on the path |
| **A shared rate-limit store** (Redis or similar) before running more than one API instance | The counter is in memory today, so N instances multiply the effective budget by N |
| **`TRUST_PROXY_HOPS` set to the real number of proxies** | Left at 0 behind a load balancer, every request appears to come from the balancer and the IP limit becomes global |
| **Rotate `SESSION_SECRETS` periodically** | Add the new secret first, keep the old one to verify, remove it after the absolute timeout has passed |

## Inquiries

| Control | Where | Verified by |
| --- | --- | --- |
| The public POST is CSRF protected despite being anonymous | global middleware | a POST with no token is 403 |
| `Origin` is validated on the public POST | `csrfProtection.js` | a foreign Origin is 403 |
| Public submissions are rate limited, separately from login | `inquiryRateLimit.js` | 429 in the standard envelope |
| A request cannot set status, priority, source, assignment, or userId | `inquiry.validation.js` | each is a 400, not stripped |
| An unknown field is refused rather than ignored | same | asserted |
| Operator injection is blocked | same | `{"$ne": null}` and `$`/dotted keys are 400 |
| Draft packages and private guides cannot be referenced | `inquiry.service.js` | refused, with wording identical to "missing" |
| The honeypot stores nothing at all | `inquiry.controller.js` | zero records after a filled honeypot |
| Idempotency keys are hashed, never stored raw | `inquiryIdempotency.js` | stored value is a SHA-256 hex digest |
| No raw IP, session id, cookie, or CSRF token is stored | `inquiry.model.js` | the stored metadata has exactly two fields |
| Internal notes and history never reach a list or a public response | `inquiry.serializer.js` | asserted against whole responses |
| `.lean()` cannot leak — serializers are allowlists | same | a document with every private field set serialises clean |
| Notes and status actors come from the session | controller | a body-supplied author is ignored |
| Status history is append-only | service | `$push` only; no edit or delete route |
| `converted` cannot be set by hand | `inquiryStatuses.js` | filtered from every transition list |
| Concurrent status changes cannot overwrite each other | service | conditional update returns 409 |
| No inquiry can be deleted | `inquiry.routes.js` | no DELETE route exists |
| Consent is required, timed, and versioned by the server | service | a browser-supplied time is ignored |

## Still open

Honest list of what the current auth and inquiry scope does **not** do.

- **No email verification.** `emailVerifiedAt` exists on the model and is
  always `null`. Nothing enforces it.
- **No password reset.** Someone who forgets their password has no route back
  in; an administrator would have to intervene.
- **No two-factor authentication.**
- **The rate limiter is per process.** Its counter is in memory, so running
  more than one instance multiplies the effective budget. The per-account
  lockout lives in MongoDB and is unaffected.
- **No audit log of authentication events.** Failed sign-ins are counted but
  not recorded with a time and an address.
- **`lastLoginAt` is set by `/auth/login` only**, not by registration.
- **No account deletion or deactivation route.** `status` can only be changed
  directly in the database so far.
- **Secret rotation is untested.** The array is passed to express-session, but
  no test proves a session survives a rotation.
- **No MFA.** Worth considering for `admin` and `super_admin` once the admin
  API exists — those accounts are the ones worth attacking, and a password is
  the only thing between an attacker and all of it.
- **Guide self-service does not exist.** `role: 'guide'` grants nothing today.
- **Inquiries have no retention policy, no export route, and no erasure
  route.** All three are owner decisions with legal weight; see
  [INQUIRY_PRIVACY.md](INQUIRY_PRIVACY.md).
- **The inquiry rate limiter is per process**, like the login limiter.
- **A locked-out customer is told only that their credentials are wrong.** The
  honest message would confirm the account exists. An email notice to the
  account holder is the right fix, once delivery exists.
