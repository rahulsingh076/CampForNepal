# Environment And Local Setup

## Prerequisites

| Requirement | Notes |
| --- | --- |
| Operating system | Developed on macOS; commands are standard npm/Node commands. |
| Node.js | Root/frontend requires `>=20.19.0`; backend requires `>=24.0.0`. |
| npm | Required for workspaces and scripts. |
| Git | Required for branch workflow. |
| MongoDB | Required for backend runtime, backend integration tests, and seed scripts. Local MongoDB or MongoDB Atlas can be used. |
| Vercel account | Only if deploying the frontend through the existing Vercel metadata. |
| Backend host account | Required later; not configured in repo. |
| Media provider | Optional later; current media uses references only. |

## Install

```bash
npm install
```

## Start Commands

```bash
npm run dev              # frontend
npm run dev:frontend     # frontend only
npm run dev:backend      # backend with backend/.env
npm run preview          # preview built frontend
npm run start:backend    # backend production-style start
```

Current frontend dev port is assigned by Vite, commonly `5173`. Earlier local
sessions have used other open ports when `5173` was busy. Backend `PORT`
defaults to `5000` in `backend/.env.example`; change `PORT` if that port is in
use.

Health endpoint with default settings:

```text
http://localhost:5000/api/v1/health
```

## Environment Variables

Never copy actual `.env` values into documentation.

| Variable | Purpose | Dev | Test | Staging | Production | Secret | Safe example | Responsibility |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `NODE_ENV` | Runtime mode. | Yes | Yes | Yes | Yes | No | `development` | Developer/ops |
| `PORT` | Backend listen port. | Yes | Yes | Yes | Yes | No | `5000` | Developer/ops |
| `API_PREFIX` | API mount prefix. | Yes | Yes | Yes | Yes | No | `/api/v1` | Developer |
| `MONGODB_URI` | MongoDB connection string. | Yes | Yes | Yes | Yes | Yes | `mongodb://127.0.0.1:27017/camp_for_nepal` | Owner/ops |
| `CORS_ORIGINS` | Browser origin allowlist. | Yes | Yes | Yes | Yes | No | `http://localhost:5173` | Developer/ops |
| `REQUEST_BODY_LIMIT` | Body parser size cap. | Yes | Yes | Yes | Yes | No | `1mb` | Developer |
| `SHUTDOWN_TIMEOUT_MS` | Graceful shutdown timeout. | Yes | Yes | Yes | Yes | No | `10000` | Developer/ops |
| `FRONTEND_ROOT` | Seed script source path. | For seeds | For seeds | For seeds | For seeds | No | `../frontend` | Developer |
| `PUBLIC_DEFAULT_PAGE_SIZE` | Public pagination default. | Yes | Yes | Yes | Yes | No | `12` | Developer |
| `PUBLIC_MAX_PAGE_SIZE` | Public pagination max. | Yes | Yes | Yes | Yes | No | `100` | Developer |
| `ALLOW_SEED_IN_PRODUCTION` | Production seed guard. | Optional | Optional | Optional | Owner-approved only | No | `false` | Owner/ops |
| `ALLOW_DESTRUCTIVE_SEED` | Reset guard. | Owner-approved only | Owner-approved only | Owner-approved only | No | No | `false` | Owner |
| `SESSION_SECRETS` | Session signing secrets. | Yes | Yes | Yes | Yes | Yes | random 32+ chars | Owner/ops |
| `SESSION_COOKIE_NAME` | Cookie name. | Yes | Yes | Yes | Yes | No | `cfn.sid` | Developer |
| `SESSION_COOKIE_SECURE` | Secure cookie flag. | Yes | Yes | Yes | Yes | No | `false` local, true prod | Ops |
| `SESSION_COOKIE_SAMESITE` | SameSite setting. | Yes | Yes | Yes | Yes | No | `lax` | Developer/ops |
| `SESSION_IDLE_TIMEOUT_MS` | Idle timeout. | Yes | Yes | Yes | Yes | No | `1800000` | Developer |
| `SESSION_ABSOLUTE_TIMEOUT_MS` | Absolute timeout. | Yes | Yes | Yes | Yes | No | `28800000` | Developer |
| `SESSION_TOUCH_AFTER_SECONDS` | Session write throttle. | Yes | Yes | Yes | Yes | No | `60` | Developer |
| `AUTH_LOGIN_WINDOW_MS` | Login limiter window. | Yes | Yes | Yes | Yes | No | `900000` | Developer |
| `AUTH_LOGIN_MAX_ATTEMPTS` | Login limiter budget. | Yes | Yes | Yes | Yes | No | `10` | Developer |
| `AUTH_ACCOUNT_LOCK_THRESHOLD` | Failed guesses before lock. | Yes | Yes | Yes | Yes | No | `5` | Developer |
| `AUTH_ACCOUNT_LOCK_MS` | Lock duration. | Yes | Yes | Yes | Yes | No | `900000` | Developer |
| `TRUST_PROXY_HOPS` | Trusted proxy hop count. | Yes | Yes | Yes | Yes | No | `0` | Ops |
| `AUTH_TEST_DATABASE_NAME` | Auth test DB name. | For tests | Yes | No | No | No | `camp_for_nepal_auth_test` | Developer |
| `ALLOW_BOOTSTRAP_SUPER_ADMIN` | Bootstrap guard. | Owner-approved | Owner-approved | Owner-approved | Owner-approved | No | `false` | Owner |
| `BOOTSTRAP_SUPER_ADMIN_NAME` | Bootstrap account name. | When bootstrapping | No | When bootstrapping | When bootstrapping | No | empty | Owner |
| `BOOTSTRAP_SUPER_ADMIN_EMAIL` | Bootstrap email. | When bootstrapping | No | When bootstrapping | When bootstrapping | Sensitive | empty | Owner |
| `BOOTSTRAP_SUPER_ADMIN_PASSWORD` | Bootstrap password. | When bootstrapping | No | When bootstrapping | When bootstrapping | Yes | empty | Owner |
| `INQUIRY_PUBLIC_WINDOW_MS` | Inquiry limiter window. | Yes | Yes | Yes | Yes | No | `900000` | Developer |
| `INQUIRY_PUBLIC_MAX_SUBMISSIONS` | Inquiry limiter budget. | Yes | Yes | Yes | Yes | No | `10` | Developer |
| `INQUIRY_REFERENCE_PREFIX` | Public inquiry reference prefix. | Yes | Yes | Yes | Yes | No | `CFN` | Owner/developer |
| `INQUIRY_MAX_MESSAGE_LENGTH` | Message length cap. | Yes | Yes | Yes | Yes | No | `5000` | Developer |
| `INQUIRY_MAX_NOTE_LENGTH` | CRM note cap. | Yes | Yes | Yes | Yes | No | `3000` | Developer |
| `INQUIRY_MAX_PEOPLE` | Max group size in inquiry. | Yes | Yes | Yes | Yes | No | `100` | Owner/developer |
| `INQUIRY_HONEYPOT_FIELD` | Honeypot field name. | Yes | Yes | Yes | Yes | No | `company-website` | Developer |
| `INQUIRY_MIN_FILL_TIME_MS` | Fast-submit signal threshold. | Yes | Yes | Yes | Yes | No | `3000` | Developer |
| `PRIVACY_POLICY_VERSION` | Stored consent policy version. | Placeholder allowed | Yes | Yes | Yes, real value | No | `owner-required` local only | Owner |
| `INQUIRY_TEST_DATABASE_NAME` | Inquiry test DB name. | For tests | Yes | No | No | No | `camp_for_nepal_inquiry_test` | Developer |

## Seed And Smoke

```bash
npm run seed:catalog
npm run smoke:public
```

Do not run `seed:catalog:reset` unless the owner approves it for a known
non-production database.
