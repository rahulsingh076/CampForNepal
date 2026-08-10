# Security And Privacy Handover

## Implemented Safeguards

| Area | Status | Implementation |
| --- | --- | --- |
| Password hashing | Implemented | Argon2id in `backend/src/utils/password.js`. |
| Sessions | Implemented | Server-side sessions stored in MongoDB through `connect-mongo`. |
| Cookie settings | Implemented | Configured in `backend/src/config/session.js`; production forces secure cookies. |
| CSRF | Implemented | Global unsafe-method protection in `backend/src/middleware/csrfProtection.js`. |
| Origin validation | Implemented | Unsafe requests validate allowed browser origins. |
| CORS | Implemented | Explicit `CORS_ORIGINS` allowlist; wildcard origins are rejected. |
| Rate limiting | Implemented | Auth and public inquiry limits. |
| Account lockout | Implemented | Failed login counters and temporary locks on `User`. |
| Suspended users | Implemented | Suspended accounts cannot sign in and sessions are invalidated. |
| Session invalidation | Implemented | `sessionVersion` changes invalidate stale sessions. |
| Private fields | Implemented | `select: false` plus JSON/serializer allowlists. |
| Test DB isolation | Implemented | Auth/inquiry tests require `_test` database names. |
| Standard envelope | Implemented | `success`, `message`, `data`, `meta` for API responses. |

## Sensitive Data Rules

- Never commit `.env` or any secret-bearing file.
- Never expose MongoDB URIs, session secrets, passwords, hashes, deployment
  tokens, recovery codes, or provider credentials in documentation.
- Never return stack traces, driver errors, connection strings, CSRF tokens, or
  raw session metadata to clients.
- Do not store card numbers, CVV/CVC, PINs, OTP codes, bank-login credentials,
  payment proofs, passport scans, confidential medical documents, or identity
  documents in the current application.

## Payment And External Messaging Scope

- Online payment processing is removed from active scope.
- There is no gateway, checkout, payment proof, invoice, refund, or payment
  status workflow.
- Gmail login, Gmail API, SMTP, backend email delivery, and backend social
  message synchronization are not implemented.
- External contact links may open email, Gmail compose, phone, WhatsApp, or
  social pages. Opening a link is not proof of message delivery.

## Inquiry Privacy

Inquiries may contain personal contact and travel-planning information. Public
submission stores only validated fields. Public responses return a reference
code, status, and timestamp rather than internal ids or CRM fields.

Staff CRM list rows avoid notes, history, spam metadata, raw idempotency data,
and internal submission metadata. Detail responses for authorized staff include
only the fields documented by serializers.

## Current Limitations

- The frontend customer/admin areas still use browser demo data and are not
  production authorization.
- A production privacy policy version must replace `owner-required`.
- A data-retention policy is not finalized.
- Private conversation APIs and production audit operations are planned but not
  complete.
- No formal compliance certification is claimed.

## Owner Decisions Still Needed

- Final privacy policy version.
- Inquiry and customer-data retention periods.
- Privacy request handling process.
- Backup and restore policy.
- Production admin and super-admin access list.
- Whether customer document metadata remains in scope.
