# Repository Path Map

This map records the actual repository paths at handover time. "Safe to edit"
means safe with normal review and tests; it does not override product scope,
security, or owner-approval rules.

## Root

| Path | Purpose | Primary owner | Main callers | Safe to edit | Dependencies / related tests |
| --- | --- | --- | --- | --- | --- |
| `package.json` | Root npm workspace and scripts. | Full-stack | Developers and CI/local scripts. | Yes, with workspace script review. | Calls frontend/backend package scripts. |
| `package-lock.json` | Locked dependency graph. | Full-stack | npm. | Yes, through npm install/update only. | Must stay in sync with package manifests. |
| `README.md` | Human developer entry point. | Full-stack/docs | Developers and handover readers. | Yes. | Links main docs. |
| `ENGINEERING_GUIDELINES.md` | Neutral engineering rules and contribution guardrails. | Full-stack/docs | Developers and reviewers. | Yes. | Keep aligned with README and handover docs. |
| `.gitignore` | Ignore rules. | Full-stack | Git. | Yes, carefully. | Must keep `.env` ignored. |
| `.github/` | CI configuration. | Not present in the current repository. | Not present in the current repository. | Not present in the current repository. | Not present in the current repository. |
| `vercel.json` | Root Vercel config. | Not present in the current repository. | Not present in the current repository. | Not present in the current repository. | Frontend has `.vercel` metadata only. |

## Frontend Entry And Configuration

| Path | Purpose | Primary owner | Main callers | Safe to edit | Dependencies / related tests |
| --- | --- | --- | --- | --- | --- |
| `frontend/package.json` | Frontend scripts and dependencies. | Frontend | Root npm scripts, npm. | Yes, with dependency review. | `npm run check`, Vite. |
| `frontend/vite.config.js` | Vite and Tailwind plugin setup. | Frontend | Vite build/dev server. | Yes, with build check. | `@vitejs/plugin-react`, `@tailwindcss/vite`. |
| `frontend/index.html` | SPA HTML shell. | Frontend | Browser/Vite. | Yes. | Build and smoke tests. |
| `frontend/src/main.jsx` | React mount entry. | Frontend | Browser bundle. | Yes, carefully. | React, providers. |
| `frontend/src/app/App.jsx` | App wrapper. | Frontend | `main.jsx`. | Yes. | Router/providers. |
| `frontend/src/app/providers.jsx` | Context provider composition. | Frontend | `App.jsx`. | Yes. | Auth, locale, wishlist contexts. |
| `frontend/src/app/router.jsx` | Lazy route tree and route guards. | Frontend | React Router. | Yes, with route checks. | `frontend/src/config/routes.js`, `npm run check:routes`. |
| `frontend/src/app/OnboardingGate.jsx` | First-run locale/country onboarding gate. | Frontend | Router. | Yes. | Locale context/storage. |
| `frontend/src/app/ScrollToTop.jsx` | Scroll restoration behavior. | Frontend | Router. | Yes. | React Router location. |
| `frontend/src/config/routes.js` | Public/customer/admin route manifest. | Frontend | Router, route checker. | Yes, with route checks. | Page modules, `npm run check:routes`. |
| `frontend/src/config/navigation.js` | Customer/admin nav and role labels. | Frontend | Layouts and route guards. | Yes, with role QA. | Auth context, layouts. |
| `frontend/src/config/designTokens.js` | JS mirror of selected design tokens. | Frontend/design | Components needing JS token values. | Yes, with visual review. | CSS tokens. |
| `frontend/src/config/siteIdentity.js` | Brand identity constants. | Frontend/content | Layouts, metadata, structured data. | Yes, owner approval for brand changes. | Brand assets. |
| `frontend/src/config/translations.js` | UI copy translations. | Frontend/content | Locale context/components. | Yes, with content review. | Locale context. |
| `frontend/src/styles/` | Tailwind CSS v4 theme, base styles, print styles. | Frontend/design | Vite CSS bundle. | Yes, with responsive/print QA. | Build, visual QA. |
| `frontend/.vercel/project.json` | Local Vercel project metadata. | Deployment | Vercel tooling. | Usually no; coordinate with deployment owner. | Frontend deployment. |

## Frontend Data And API Boundary

| Path | Purpose | Primary owner | Main callers | Safe to edit | Dependencies / related tests |
| --- | --- | --- | --- | --- | --- |
| `frontend/src/lib/dataClient.js` | Public frontend data facade with response envelope. | Frontend/full-stack | Pages, hooks, components. | Yes, with broad frontend checks. | `entities`, overlay, write validation. |
| API request helper | Not present in the current repository. | Not present in the current repository. | Future `dataClient` internals. | Not present in the current repository. | Planned integration work. |
| `frontend/src/lib/entities.js` | Collection/singleton registry over seed data. | Frontend/data | `dataClient`, overlay. | Yes, with data validation. | `frontend/src/data/*.js`. |
| `frontend/src/lib/overlay.js` | localStorage overlay read/write helpers. | Frontend/data | `dataClient`. | Yes, with smoke/data checks. | Browser storage. |
| `frontend/src/lib/overlayMigrations.js` | Browser overlay compatibility migrations. | Frontend/data | Overlay initialization. | Yes, after migration review. | Existing localStorage data. |
| `frontend/src/lib/writeValidation.js` | Demo write validation rules. | Frontend/data | `dataClient` writes. | Yes, with `validate:data`. | Validators, seed records. |
| `frontend/src/lib/queryList.js` | Frontend list filtering/search/sort helpers. | Frontend | Collections, search. | Yes. | Data validation and UI tests. |
| `frontend/src/lib/globalSearch.js` | In-page public/admin search result builders. | Frontend | `InPageSearch`. | Yes, with search QA. | Data collections, role labels. |
| `frontend/src/lib/media.js` | Media normalization and lookup helpers. | Frontend/media | Galleries, cards, admin media. | Yes, with media QA. | Media assets and structured gallery data. |
| `frontend/src/lib/formatters.js` | Display formatting helpers. | Frontend | UI components. | Yes. | Locale/currency data. |
| `frontend/src/lib/storage.js` | Browser storage helper. | Frontend | Contexts and overlay. | Yes, carefully. | localStorage. |
| `frontend/src/lib/validators.js` | Generic frontend validation helpers. | Frontend | Forms/write validation. | Yes. | Form components. |
| `frontend/src/contexts/AuthContext.jsx` | Frontend mock auth/session state. | Frontend | Route guards, layouts, pages. | Yes, with auth/role QA. | `users` seed, storage. |
| `frontend/src/contexts/LocaleContext.jsx` | Locale/country/currency preferences. | Frontend | Public layout/forms. | Yes. | `countries`, `languages`, `currencies`. |
| `frontend/src/contexts/WishlistContext.jsx` | Browser wishlist state. | Frontend | Wishlist UI/cards. | Yes. | Storage, package ids. |
| `frontend/src/data/` | Frontend seed data still in active use. | Product/frontend | `entities`, validation, UI. | Yes, with owner/content approval. | `npm run validate:data`. |
| `docs/DATA_MODEL.md` | Frontend and backend data contract. | Full-stack/data | Developers and migration work. | Yes, with source review. | Seed data, backend schema docs. |

## Public Frontend

| Path | Purpose | Primary owner | Main callers | Safe to edit | Dependencies / related tests |
| --- | --- | --- | --- | --- | --- |
| `frontend/src/pages/public/` | Public route pages. | Frontend/product | Router. | Yes, with route/smoke checks. | `routes.js`, dataClient. |
| `frontend/src/components/layout/PublicLayout.jsx` | Public shell. | Frontend | Router. | Yes, with responsive QA. | Header, footer, search, contact controls. |
| `frontend/src/components/layout/Header.jsx` | Desktop/mobile public header. | Frontend/design | Public layout. | Yes, with responsive search/nav QA. | Menu data, locale, search. |
| `frontend/src/components/layout/MobileMenu.jsx` | Mobile navigation drawer. | Frontend | Header. | Yes, with accessibility QA. | Menu data, focus behavior. |
| `frontend/src/components/layout/Footer.jsx` | Public footer. | Frontend/content | Public layout. | Yes, with CMS/content review. | Footer/contact data. |
| `frontend/src/components/cards/` | Shared public listing cards. | Frontend/design | Public lists and related grids. | Yes. | ImageFrame, data records. |
| `frontend/src/components/forms/` | Inquiry, contact, callback, custom trip, guide forms. | Frontend/product | Public pages. | Yes, with form validation QA. | `createInquiry`, `useForm`. |
| `frontend/src/components/sections/PublicMediaGallery.jsx` | Public gallery rendering. | Frontend/media | Detail pages. | Yes, with media QA. | Media helpers/assets. |
| `frontend/src/components/sections/BookingSummary.jsx` | Public package booking/request summary. | Frontend/product | Package detail. | Yes. | Booking/request copy and data. |
| `frontend/src/components/search/InPageSearch.jsx` | Public/admin in-page search overlay. | Frontend | Header/admin layout. | Yes, with responsive QA. | `globalSearch`, collections. |
| `frontend/src/components/common/PrintButton.jsx` | Browser print trigger. | Frontend | Public/admin print actions. | Yes, with manual print QA. | Print CSS. |
| Public tracking route | Not present in the current repository. | Not present in the current repository. | Not present in the current repository. | Not present in the current repository. | Planned if required. |

## Customer Frontend

| Path | Purpose | Primary owner | Main callers | Safe to edit | Dependencies / related tests |
| --- | --- | --- | --- | --- | --- |
| `frontend/src/pages/customer/Dashboard.jsx` | Customer dashboard. | Frontend/product | Customer routes. | Yes. | dataClient, auth context. |
| `frontend/src/pages/customer/Bookings.jsx` | Customer booking list. | Frontend/product | Customer routes. | Yes. | Booking data/status config. |
| `frontend/src/pages/customer/BookingDetail.jsx` | Booking detail with simple status and message surface. | Frontend/product | Customer routes. | Yes, with booking QA. | Booking workflow/status components. |
| `frontend/src/pages/customer/Messages.jsx` | Customer message thread area. | Frontend/product | Customer routes. | Yes. | Message thread data/helpers. |
| `frontend/src/pages/customer/Documents.jsx` | Customer document metadata. | Frontend/product | Customer routes. | Owner decision needed. | Booking document metadata only. |
| `frontend/src/pages/customer/Reviews.jsx` | Customer review area. | Frontend/product | Customer routes. | Yes. | Review data. |
| `frontend/src/pages/customer/Profile.jsx` | Customer profile preferences. | Frontend/product | Customer routes. | Yes. | Auth/storage. |
| `frontend/src/pages/customer/Wishlist.jsx` | Saved trip list. | Frontend | Customer routes. | Yes. | Wishlist context. |
| `frontend/src/pages/customer/Notifications.jsx` | Customer notifications. | Frontend | Customer routes. | Yes. | Notifications data. |
| `frontend/src/components/layout/CustomerLayout.jsx` | Customer shell and nav. | Frontend | Router. | Yes, with responsive QA. | Auth context, `CUSTOMER_NAV`. |
| `frontend/src/components/auth/ProtectedRoute.jsx` | Signed-in route guard. | Frontend | Customer routes. | Yes, with auth QA. | Auth context. |
| Customer inquiries route | Not present in the current repository. | Not present in the current repository. | Not present in the current repository. | Not present in the current repository. | Inquiry references exist in backend; dashboard route not implemented. |

## Admin Frontend

| Path | Purpose | Primary owner | Main callers | Safe to edit | Dependencies / related tests |
| --- | --- | --- | --- | --- | --- |
| `frontend/src/components/layout/AdminLayout.jsx` | Admin shell. | Frontend/admin | Admin routes. | Yes, with role/responsive QA. | Admin nav, auth context, search. |
| `frontend/src/components/layout/AdminSidebar.jsx` | Desktop admin navigation. | Frontend/admin | Admin layout. | Yes. | `ADMIN_NAV`. |
| `frontend/src/components/layout/AdminMobileNav.jsx` | Mobile admin navigation. | Frontend/admin | Admin layout. | Yes. | `ADMIN_NAV`. |
| `frontend/src/components/auth/RoleRoute.jsx` | Admin role guard. | Frontend | Router. | Yes, with direct URL tests. | Auth context, route roles. |
| `frontend/src/pages/admin/Dashboard.jsx` | Admin dashboard. | Frontend/admin | Admin routes. | Yes. | dataClient. |
| `frontend/src/pages/admin/Inquiries.jsx` | Admin inquiry CRM UI. | Frontend/admin | Admin routes. | Yes. | Inquiry data/workflow. |
| `frontend/src/pages/admin/Bookings.jsx` | Admin booking list. | Frontend/admin | Admin routes. | Yes. | Booking data/status config. |
| `frontend/src/pages/admin/BookingDetail.jsx` | Admin booking detail and status/guide/docs controls. | Frontend/admin | Admin routes. | Yes, owner decision for docs scope. | Booking workflow, guides. |
| `frontend/src/pages/admin/Users.jsx` | Super-admin user/role UI. | Frontend/admin | Admin routes. | Yes, with role QA. | Users seed/auth. |
| `frontend/src/pages/admin/Activities.jsx`, `Destinations.jsx`, `Packages.jsx`, `FixedDepartures.jsx`, `Guides.jsx` | Catalogue CRUD pages. | Frontend/admin | Admin routes. | Yes, with data validation. | Admin CRUD components. |
| `frontend/src/pages/admin/MediaLibrary.jsx` | Media library UI. | Frontend/media | Admin routes. | Yes, with media QA. | MediaListEditor, media assets. |
| `frontend/src/pages/admin/Events.jsx` | Event management UI. | Frontend/admin | Admin routes. | Yes, with event QA. | Events data/media. |
| `frontend/src/pages/admin/Reviews.jsx` | Review moderation UI. | Frontend/admin | Admin routes. | Yes. | Reviews data. |
| `frontend/src/pages/admin/Website*.jsx` | Website CMS screens. | Frontend/admin/content | Admin routes. | Yes, with content QA. | Singleton data, website components. |
| `frontend/src/pages/admin/Settings.jsx` | Super-admin settings UI. | Frontend/admin | Admin routes. | Yes, with owner/security review. | Auth/storage/settings. |
| `frontend/src/pages/admin/AuditLog.jsx` | Frontend demo audit log. | Frontend/admin | Admin routes. | Yes. | Audit log seed/overlay. |
| `frontend/src/components/admin/` | Shared admin tables, forms, drawers, editors, save bars, toasts. | Frontend/admin | Admin pages. | Yes, with broad admin QA. | FormField, dataClient. |

## Backend Entry

| Path | Purpose | Primary owner | Main callers | Safe to edit | Dependencies / related tests |
| --- | --- | --- | --- | --- | --- |
| `backend/package.json` | Backend scripts and dependencies. | Backend | Root scripts, npm. | Yes, with dependency review. | Node 24, Express/Mongoose tests. |
| `backend/src/server.js` | Process lifecycle, env load, DB connect, listen, shutdown. | Backend | `npm run dev:backend`, `start:backend`. | Yes, carefully. | `config/env`, `config/database`, app. |
| `backend/src/app.js` | Express app and middleware order. | Backend | Tests and server. | Yes, with backend tests. | Middleware, routes, response helper. |
| `backend/src/config/env.js` | Environment validation. | Backend/security | Server, seed scripts, tests. | Yes, with config tests/manual boot. | `.env.example`. |
| `backend/src/config/database.js` | Mongoose connection helpers. | Backend | Server, scripts, tests. | Yes. | MONGODB_URI. |
| `backend/src/config/cors.js` | CORS allowlist middleware. | Backend/security | App. | Yes, with auth/security tests. | CORS_ORIGINS. |
| `backend/src/config/session.js` | Mongo-backed session middleware/store. | Backend/security | App. | Yes, with auth/session tests. | connect-mongo, express-session. |
| `backend/src/routes/index.js` | Central API router under `API_PREFIX`. | Backend | App. | Yes, with route/API tests. | All modules. |
| `backend/src/utils/response.js` | Standard response envelope. | Backend | Controllers and app root. | Yes, with API tests. | Auth/inquiry/media tests. |
| `backend/src/middleware/errorHandler.js` | Central error formatting. | Backend/security | App. | Yes, with auth/API tests. | ApiError, request context. |

## Backend Modules

| Module | Folder | Model | Validation | Serializer | Service | Controller | Routes | Tests | Verification / docs |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Activities | `backend/src/modules/activities` | `activity.model.js` | Shared database validators | Not present | `activity.service.js` | `activity.controller.js` | `activity.routes.js` | `backend/tests/models/activity.model.test.js` | `backend/docs/PUBLIC_CATALOG_API.md` |
| Auth | `backend/src/modules/auth` | Uses `users/user.model.js` | `auth.validation.js` | User JSON transform | `auth.service.js` | `auth.controller.js` | `auth.routes.js` | `backend/tests/auth/*.test.js` | `backend/docs/AUTHENTICATION.md`, `backend/docs/AUTH_SECURITY_CHECKLIST.md` |
| Destinations | `backend/src/modules/destinations` | `destination.model.js` | Shared database validators | Not present | `destination.service.js` | `destination.controller.js` | `destination.routes.js` | `backend/tests/models/destination.model.test.js` | `backend/docs/PUBLIC_CATALOG_API.md` |
| Events | `backend/src/modules/events` | `event.model.js` | Service cleaning | `event.serializer.js` | `event.service.js` | `event.controller.js` | `event.routes.js` | `backend/tests/media-cms/*.test.js` | `docs/VIDEO_REELS_EVENTS.md` |
| Fixed departures | `backend/src/modules/fixedDepartures` | `fixedDeparture.model.js` | Shared database validators | Not present | `fixedDeparture.service.js` | `fixedDeparture.controller.js` | `fixedDeparture.routes.js` | `backend/tests/models/fixedDeparture.model.test.js` | `backend/docs/PUBLIC_CATALOG_API.md` |
| Guides | `backend/src/modules/guides` | `guide.model.js` | Shared database validators | Not present | `guide.service.js` | `guide.controller.js` | `guide.routes.js` | `backend/tests/models/guide.model.test.js` | `backend/docs/PUBLIC_CATALOG_API.md` |
| Health | `backend/src/modules/health` | Not present | Not present | Not present | Not present | `health.controller.js` | `health.routes.js` | Covered by smoke/manual health checks | README health check |
| Inquiries | `backend/src/modules/inquiries` | `inquiry.model.js` | `inquiry.validation.js` | `inquiry.serializer.js` | `inquiry.service.js` | `inquiry.controller.js` | `inquiry.routes.js` | `backend/tests/inquiries/*.test.js` | `backend/docs/INQUIRY_API.md`, `backend/docs/CRM_WORKFLOW.md`, `backend/docs/INQUIRY_PRIVACY.md` |
| Media | `backend/src/modules/media` | `mediaAsset.model.js` | Service cleaning | `mediaAsset.serializer.js` | `mediaAsset.service.js` | `mediaAsset.controller.js` | `mediaAsset.routes.js` | `backend/tests/media-cms/*.test.js` | `docs/MEDIA_LIBRARY.md` |
| Packages | `backend/src/modules/packages` | `package.model.js` | Shared database validators | Not present | `package.service.js` | `package.controller.js` | `package.routes.js` | `backend/tests/models/package.model.test.js` | `backend/docs/PUBLIC_CATALOG_API.md` |
| Print | `backend/src/modules/print` | Uses existing models | Not present | Service projections | `print.service.js` | `print.controller.js` | `print.routes.js` | `npm run verify:b08` | `docs/PRINTING_AND_HARDCOPY.md` |
| Reviews | `backend/src/modules/reviews` | `review.model.js` | Shared database validators | Not present | `review.service.js` | `review.controller.js` | `review.routes.js` | `backend/tests/models/review.model.test.js` | `backend/docs/PUBLIC_CATALOG_API.md` |
| Search | `backend/src/modules/search` | Uses existing models | Query parsers in database helpers | Service result items | `search.service.js` | `search.controller.js` | `search.routes.js` | `backend/tests/database/publicQuery.test.js`, verifier | `docs/GLOBAL_SEARCH.md` |
| Users | `backend/src/modules/users` | `user.model.js` | Model validation | JSON transform | `user.service.js` | Not present | Not present | `backend/tests/auth/user.model.test.js` | `backend/docs/AUTHENTICATION.md`, `backend/docs/ROLE_MATRIX.md` |

## Backend Infrastructure

| Path | Purpose | Primary owner | Main callers | Safe to edit | Dependencies / related tests |
| --- | --- | --- | --- | --- | --- |
| `backend/src/middleware/` | Cross-cutting request handling. | Backend/security | App/routes. | Yes, with backend tests. | Auth, CSRF, inquiry tests. |
| `backend/src/constants/` | Shared enum values. | Backend/full-stack | Models, validation, services. | Yes, with model/API tests. | Frontend constants must stay aligned where documented. |
| `backend/src/database/` | Schema helpers, public visibility, query parsing, validators. | Backend/data | Models/services. | Yes, with database/model tests. | `backend/tests/database`, `backend/tests/services`. |
| `backend/src/seeds/` | Frontend seed normalization and migration pipeline. | Backend/data | Seed scripts. | Yes, with seed tests. | `backend/tests/seeds`. |
| `backend/scripts/seedCatalog.js` | Import/update migrated catalogue records. | Backend/data | `npm run seed:catalog`. | Yes, with seed tests and DB caution. | `FRONTEND_ROOT`, MongoDB. |
| `backend/scripts/resetCatalog.js` | Guarded removal of migrated seed records. | Backend/data | `npm run seed:catalog:reset`. | High caution. | `ALLOW_DESTRUCTIVE_SEED=true`. |
| `backend/scripts/bootstrapSuperAdmin.js` | Guarded first super-admin account creation. | Backend/security | `npm run bootstrap:super-admin`. | High caution. | Bootstrap env flags. |
| `backend/scripts/smokePublicApi.js` | Public API smoke script. | Backend | `npm run smoke:public`. | Yes. | Running backend/MongoDB. |
| `backend/scripts/verifyAuth.js` | Runtime auth verifier. | Backend/security | `npm run verify:auth`. | Yes, with test DB caution. | Auth test database. |
| `backend/scripts/verifyB08.js` | Media/events/search/print verifier. | Backend | `npm run verify:b08`. | Yes. | Models/routes/constants. |
| `backend/scripts/verifyInquiries.js` | Inquiry runtime verifier. | Backend | `npm run verify:inquiries`. | Yes, with test DB caution. | Inquiry test database. |
| `backend/tests/helpers/` | Backend test fixtures and database helpers. | Backend/test | Test suites. | Yes. | Node test runner. |
| `backend/.env.example` | Documented backend environment variables. | Backend/security | Developers. | Yes, never add secrets. | `config/env.js`. |
| `backend/.env` | Local secrets/config. | Local developer | Backend scripts. | No; never commit. | Git ignored. |
| Backend deployment config | Not present in the current repository. | Not present in the current repository. | Not present in the current repository. | Not present in the current repository. | Planned production work. |

## Related Documentation Paths

| Path | Purpose | Primary owner | Main callers | Safe to edit | Dependencies / related tests |
| --- | --- | --- | --- | --- | --- |
| `docs/PROJECT_OVERVIEW.md` | Neutral product status and scope. | Product/full-stack | Handover readers. | Yes. | Source tree and docs. |
| `docs/SYSTEM_ARCHITECTURE.md` | Actual architecture and flow diagrams. | Full-stack | Developers. | Yes. | Source tree. |
| `docs/BACKEND_DEVELOPER_HANDOVER.md` | Backend developer starting brief. | Backend/full-stack | Backend implementers. | Yes. | Backend source and active contracts. |
| `docs/FRONTEND_BACKEND_CONTRACT.md` | Frontend facade to backend integration contract. | Full-stack | Frontend/backend implementers. | Yes. | `dataClient`, backend routes, response envelope. |
| `docs/API_ROUTE_INVENTORY.md` | Current backend route inventory. | Backend/full-stack | API implementers and QA. | Yes. | Backend route files. |
| `docs/DATABASE_SCHEMA.md` | Root-level schema summary. | Backend/data | Backend developers and owner handover. | Yes. | Backend Mongoose models. |
| `docs/ROLE_PERMISSION_MATRIX.md` | Production-facing role and permission map. | Full-stack/security | Developers and reviewers. | Yes. | Frontend guards and backend role middleware. |
| `docs/ENVIRONMENT_AND_LOCAL_SETUP.md` | Local setup and environment variable guide. | Backend/devops | Developers and deployment owner. | Yes. | `.env.example`, npm scripts. |
| `docs/TESTING_AND_VERIFICATION.md` | Verification command matrix. | Full-stack/QA | Developers and QA. | Yes. | npm scripts and manual QA. |
| `docs/DEPLOYMENT_AND_OPERATIONS.md` | Deployment and operations plan. | Devops/full-stack | Deployment owner and developers. | Yes. | Environment and hosting decisions. |
| `docs/CURRENT_STATUS_AND_NEXT_STEPS.md` | Current implementation state and ordered backend work. | Product/full-stack | Owner and backend developer. | Yes. | Source inventory and active scope. |
| `docs/OWNER_HANDOVER_CHECKLIST.md` | Owner actions and approvals. | Owner/product | Owner and delivery team. | Yes. | Content, credentials, deployment, QA. |
| `docs/SECURITY_AND_PRIVACY.md` | Security/privacy guardrails. | Security/backend | Developers and owner. | Yes. | Auth, data, response, retention docs. |
| `docs/CURRENT_BUSINESS_SCOPE.md` | Business constraints and exclusions. | Product | Developers/product owner. | Yes, owner review. | README and overview. |
| `docs/COMMUNICATION_CHANNELS.md` | External contact model. | Product/full-stack | Contact UI/API planning. | Yes. | Contact components/data. |
| `docs/MEDIA_LIBRARY.md` | Media asset reference model. | Product/media/backend | Media UI/API work. | Yes. | Media modules/tests. |
| `docs/GLOBAL_SEARCH.md` | Public/admin search rules. | Product/full-stack | Search implementation. | Yes. | Search components/services. |
| `docs/PRINTING_AND_HARDCOPY.md` | Print-safe behavior. | Product/full-stack | Print UI/API work. | Yes. | Print modules/manual QA. |
| `backend/docs/API_CONTRACT.md` | Backend response and route contract. | Backend/full-stack | API clients and tests. | Yes. | Backend controllers/tests. |
| `backend/docs/DATABASE_SCHEMA.md` | Backend schema reference. | Backend/data | Models/migrations. | Yes. | Mongoose models/tests. |
