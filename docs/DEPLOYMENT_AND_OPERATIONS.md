# Deployment And Operations

## Implemented Deployment Configuration

| Area | Status | Notes |
| --- | --- | --- |
| Frontend Vercel metadata | Partial | `frontend/.vercel/project.json` exists. No production domain details are documented in repo. |
| Root deployment config | Not present | No root `vercel.json`, Dockerfile, Procfile, or CI workflow is present. |
| Backend deployment config | Not present | Backend has start script but no checked-in host/service definition. |
| Environment example | Implemented | `backend/.env.example` documents backend variables with safe examples. |
| Health path | Implemented | `/api/v1/health` with default `API_PREFIX`. |

## Planned Deployment Shape

The current repo supports either split-origin or same-origin deployment after
frontend-backend integration:

- Split-origin: frontend hosted separately, backend API hosted on another
  service, CORS allowlist includes frontend origin.
- Same-origin: frontend and backend served under one domain/reverse proxy, API
  mounted under `/api/v1`.

The final choice is not configured in the repository.

## Backend Host Preparation

Before backend deployment, configure:

- Node runtime compatible with backend `>=24.0.0`.
- Build/start command: `npm run start:backend`.
- Health check path: `/api/v1/health`.
- MongoDB network access.
- Production `MONGODB_URI`.
- Strong `SESSION_SECRETS`.
- Production `CORS_ORIGINS`.
- `SESSION_COOKIE_SECURE=true` through production validation.
- Real `PRIVACY_POLICY_VERSION`.
- Log retention and monitoring.

## MongoDB Operations

Owner/developer must define:

- production database name
- staging/test database names
- backup schedule
- restore procedure
- migration approval process
- seed policy
- data-retention policy

Never run test suites, seed resets, or destructive maintenance against the
production database.

## Domain, DNS, And HTTPS

Not configured in repository. Owner actions:

- confirm domain ownership
- configure DNS provider access
- point frontend/backend host records
- enable HTTPS
- verify canonical domain and CORS origins
- update frontend robots/sitemap/canonical settings before launch

## Media Operations

Current media is reference-based. Production requires:

- owner-approved assets
- local shipped paths or approved external/provider URLs
- captions, alt text, focal positions, source/licence records
- no unapproved binary upload pipeline

## Backup, Restore, Rollback

Planned, not implemented in repository.

Minimum launch requirements:

- database backup schedule
- tested restore drill in non-production
- deployment rollback procedure
- owner approval for destructive recovery
- access log and application error monitoring

## Update Workflow

Recommended:

1. Work on a branch.
2. Run focused checks.
3. Update docs for route/model/env/permission changes.
4. Run broad checks.
5. Review `git diff --check`.
6. Merge/deploy through the chosen hosting workflow.
7. Verify health endpoint and key public/admin flows after deployment.
