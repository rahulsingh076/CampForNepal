# Current Status And Next Steps

## Status By Area

| Area | Status | Notes |
| --- | --- | --- |
| Frontend foundation | Complete | React/Vite route shell, layouts, contexts, data facade, validation, build scripts. |
| Backend foundation | Complete | Express app, env validation, Mongo connection, middleware, response envelope. |
| Catalogue APIs | Partial | Public reads implemented; most admin writes not implemented. |
| Authentication | Complete | Backend sessions, CSRF, Argon2id, lockout, role authorization. |
| Inquiries | Partial | Backend public submit and CRM implemented; frontend still uses browser data. |
| Direct booking | Partial | Frontend booking demo exists; backend booking model/API not present. |
| Reference tracking | Partial | Inquiry reference codes implemented; customer tracking API/page not complete. |
| Private chat | Partial | Frontend message UI exists; backend conversation API not present. |
| Customer dashboard | Partial | Frontend demo exists; backend customer APIs not present. |
| Admin management | Partial | Frontend UI broad; backend admin APIs partial. |
| Media/galleries | Partial | Media references and galleries implemented; no binary upload/provider pipeline. |
| Events/videos/reels | Partial | Frontend and backend event/media references exist; production content needs owner approval. |
| Reviews | Partial | Frontend moderation and backend public reads; full backend moderation API not present. |
| Global search | Complete for current scope | Frontend in-page overlay and backend public/admin search exist. |
| Print | Complete for current scope | Browser print controls and backend print-safe projections exist; manual print QA needed. |
| Developer handover docs | Implemented | Professional developer documentation is available on this branch. |
| Frontend/backend integration | Not started broadly | No frontend API request helper yet. |
| Testing | Partial | Strong backend and frontend checks; no frontend unit/lint script. |
| Deployment | Partial | Frontend Vercel metadata; backend deployment not configured. |
| Production content | Partial | Demo/sample content remains; owner review required. |
| Legal/privacy | Partial | Privacy version/retention decisions pending. |
| Backups | Not started | Policy and restore procedure not documented by owner yet. |
| Payments | Removed | Not part of active product scope. |
| Backend email/social messaging | Removed | External links only. |

## Ordered Backend Developer Tasks

### 1. Add Frontend API Request Helper

- Objective: create a small request helper for backend calls with envelope
  handling, credentials, and CSRF support.
- Dependencies: backend base URL/origin decision.
- Starting paths: `frontend/src/lib/dataClient.js`, `frontend/src/contexts/AuthContext.jsx`.
- API/data impact: none until callers are migrated.
- Frontend dependency: preserve current loading/error behavior.
- Tests: frontend build, route check, smoke.
- Owner input: staging/local backend URL.
- Done: helper exists, is unused or used by one safe read, and does not change
  current UI behavior.

### 2. Wire Public Destination Reads

- Objective: move destination list/detail reads behind backend endpoints.
- Dependencies: task 1, seeded backend catalogue.
- Starting paths: `frontend/src/lib/dataClient.js`, `backend/src/modules/destinations/`.
- API/data impact: public read only.
- Frontend dependency: destination pages/cards.
- Tests: frontend checks, backend public smoke.
- Owner input: whether to keep seed fallback during rollout.
- Done: destination pages read backend data and keep envelope shape.

### 3. Wire Public Inquiry Submission

- Objective: connect public forms to `POST /api/v1/inquiries`.
- Dependencies: API helper, CSRF token handling, consent policy version.
- Starting paths: `frontend/src/lib/createInquiry.js`, `backend/src/modules/inquiries/`.
- API/data impact: real inquiry writes.
- Frontend dependency: all public forms.
- Tests: inquiry tests, frontend form smoke/manual submission.
- Owner input: privacy policy version and public confirmation copy.
- Done: public forms create backend inquiries without exposing internal fields.

### 4. Add Booking Backend Design

- Objective: design Booking model and minimal book/cancel API.
- Dependencies: owner confirmation of simplified booking scope and document
  metadata decision.
- Starting paths: `frontend/src/data/bookings.js`, `frontend/src/lib/bookingWorkflow.js`,
  backend modules.
- API/data impact: new model/routes.
- Frontend dependency: customer/admin booking pages.
- Tests: new backend booking tests plus frontend checks.
- Owner input: retention, status vocabulary, private-chat handoff details.
- Done: minimal booking API supports current frontend status model.

### 5. Plan Customer Conversations

- Objective: backend conversation/message API for private website chat.
- Dependencies: auth integration and customer identity.
- Starting paths: `frontend/src/data/messageThreads.js`, customer message pages,
  backend module area.
- API/data impact: new conversation/message models.
- Frontend dependency: customer/admin message surfaces.
- Tests: new privacy/authorization tests.
- Owner input: retention and prohibited content policy.
- Done: customers and staff can read/write scoped private messages.

### 6. Deploy Backend To Staging

- Objective: deploy API with staging MongoDB and real env validation.
- Dependencies: hosting access, MongoDB access, secrets handover.
- Starting paths: `backend/src/server.js`, `backend/.env.example`, deployment docs.
- API/data impact: staging only.
- Frontend dependency: API base URL.
- Tests: health, auth, inquiry, public smoke in staging.
- Owner input: host account and domain/CORS decisions.
- Done: staging backend passes health and smoke checks.
