# Project Overview

## Purpose

Camp For Nepal is a full-stack tourism discovery, inquiry, booking request,
customer-service, and content-management platform focused on travel in Nepal.
It supports public trip discovery, structured inquiry capture, simple booking
status handling, customer account features, private customer-service surfaces,
admin content operations, media/event management, search, and print-safe
operational views.

The current repository contains both the user-facing React application and an
Express/Mongoose backend. The frontend still uses its browser `dataClient`
facade for most business data. The backend provides real API foundations for
public catalogue reads, authentication, inquiry CRM, media/events, search,
print-safe projections, and seed migration.

## Target Users

| User | Status | Purpose |
| --- | --- | --- |
| Public visitor | Implemented | Explore Nepal travel content and submit inquiries without creating an account. |
| Customer | Partially implemented | Optional login for dashboard, bookings, wishlist, messages, documents metadata, reviews, notifications, and profile preferences. Frontend-only today. |
| Admin | Partially implemented | Manage content, bookings, inquiries, media, events, reviews, website content, and print views. Frontend UI is broad; backend admin APIs are partial. |
| Super admin | Partially implemented | Manage users, roles, settings, and protected owner/security operations. Frontend UI and backend auth role exist; not every production operation is implemented. |
| Guide | Partially implemented | Guide is a data/profile role managed by admins. There is no guide self-service portal. |

## Public Functions

| Feature | Status | Notes |
| --- | --- | --- |
| Home page and public navigation | Implemented | CMS-backed seed content through frontend `dataClient`. |
| Destinations and places | Implemented | Frontend pages and backend public read APIs exist. |
| Activities | Implemented | Frontend pages and backend public read APIs exist. |
| Packages, trekking routes, and expeditions | Implemented | Frontend pages and backend public read APIs exist. |
| Fixed departures | Implemented | Frontend pages and backend public read APIs exist. |
| Guide listings and guide detail | Implemented | Public profiles are supported; private guide fields stay hidden. |
| Articles, travel updates, and reviews | Implemented | Frontend CMS/demo data. Backend reviews have public read support. |
| Events | Partially implemented | Frontend event pages and backend event APIs exist. Production event content needs owner confirmation. |
| Galleries, videos, and reels | Partially implemented | Structured media references are supported. No binary upload pipeline. |
| Public search | Implemented | In-page frontend search overlay and backend `/api/v1/search` endpoint exist. No separate frontend search page is used. |
| Public print actions | Implemented | Browser print controls and backend print-safe public projections exist. Manual print QA remains required. |
| Inquiry/contact forms | Partially implemented | Frontend forms exist and backend inquiry submission exists, but frontend integration with the backend is not complete. |
| External contact links | Implemented | Email, Gmail web compose, phone, WhatsApp, and social links open external services only. |

## Customer Functions

| Feature | Status | Notes |
| --- | --- | --- |
| Optional login/account | Partially implemented | Frontend mock account works. Backend auth exists, but frontend is not connected to it. Public browsing and inquiry remain available without login. |
| Dashboard | Implemented | Frontend demo dashboard. |
| Bookings | Implemented | Frontend demo records use simple `booked` and `cancelled` status behavior. |
| Booking detail | Implemented | Trip summary, simple status, and private message surface. |
| Messages/private chat | Partially implemented | Frontend message thread UI exists. Backend conversation API is planned. |
| Documents | Partially implemented | Metadata/checklist only. No file upload. Product decision remains whether to remove this from the simplified booking scope. |
| Wishlist | Implemented | Frontend visitor/customer state. |
| Reviews | Implemented | Frontend demo review surface. |
| Profile preferences | Implemented | Frontend demo preferences. |
| Secure public tracking by reference | Planned | Backend inquiries return public reference codes. A full customer self-service tracking API is not present. |

## Admin Functions

| Feature | Status | Notes |
| --- | --- | --- |
| Admin dashboard and navigation | Implemented | Frontend admin UI uses `admin` and `super_admin` roles. |
| Catalogue management | Partially implemented | Frontend CRUD uses localStorage overlay. Backend public catalogue reads exist; backend admin catalogue writes are not present. |
| Inquiry CRM | Partially implemented | Frontend CRM exists and backend inquiry CRM exists; frontend-backend wiring remains planned. |
| Booking operations | Partially implemented | Frontend booking operations exist. Backend booking API is not present. |
| Customer/user management | Partially implemented | Frontend super-admin UI and backend user/auth models exist. Dedicated backend user admin APIs are not fully present. |
| Media library | Partially implemented | Frontend media UI and backend media asset APIs exist. Media stores references, not binary files. |
| Events | Partially implemented | Frontend event management and backend event APIs exist. |
| Reviews/moderation | Partially implemented | Frontend moderation exists; backend review reads exist. Full backend moderation writes are not present. |
| Website CMS | Implemented | Frontend localStorage CMS for homepage, menu, footer, pages, contact, certificates, and travel info. |
| Search | Implemented | Admin in-page search overlay and backend `/api/v1/admin/global-search` exist with role filtering. |
| Print views | Implemented | Frontend controls and backend admin print projections exist. |
| Audit log | Partially implemented | Frontend demo audit overlay exists. Backend inquiry histories exist; full production audit access is planned. |

## Super-Admin Functions

| Feature | Status | Notes |
| --- | --- | --- |
| Super-admin role | Implemented | Backend role constant and frontend routing exist. |
| User and role management UI | Implemented | Frontend UI is present. |
| Protected settings UI | Implemented | Frontend UI is present. |
| Super-admin bootstrap | Implemented | Backend script exists and is guarded by environment flags. |
| Production recovery operations | Planned | Must be explicitly approved and audited before production use. |

## Excluded Functionality

| Feature | Status | Notes |
| --- | --- | --- |
| Online payments | Removed | No gateway, checkout, deposit, payment proof, invoice, refund, or payment status exists in active product scope. |
| Gmail/SMTP/backend email sending | Removed | Public email uses external compose links only. |
| Meta/social APIs | Removed | Social links are direct external links only. |
| Binary uploads | Deferred | Media and document records store metadata or references only. |
| Video storage in MongoDB | Removed | Videos/reels are local build assets or external/provider references. |
| Guide self-service dashboard | Deferred | Guide remains an admin-managed profile role. |
| Hotel/flight provider APIs | Deferred | Travel content may mention logistics, but no provider booking API is implemented. |
| Automated trip planner, loyalty, blockchain, AR/VR | Deferred | Not part of current product scope. |

## Payment-Free Scope

The product can display catalogue prices, price bases, currencies, discounts,
and quotation context. It must not collect or process payment information. Any
money, payment-method, refund, or proof-of-payment discussion belongs outside
the website's automated scope and must not become a payment flow.

## Direct External Contact Model

External contact actions open the user's chosen external service, such as an
email application, Gmail web compose, telephone dialer, WhatsApp, or social
profile. Opening a composer or external link is not proof that a message was
sent, delivered, or read. Staff may manually summarize known external
conversation outcomes when such a feature is implemented.

## Technology Stack

| Area | Status | Stack |
| --- | --- | --- |
| Frontend | Implemented | React 18, Vite, JavaScript, React Router, Tailwind CSS v4. |
| Frontend data | Implemented | Seed files under `frontend/src/data`, `dataClient`, localStorage overlay. |
| Backend API | Partially implemented | Node.js, Express 5, Mongoose, MongoDB. |
| Backend security | Implemented | Argon2id, Mongo-backed sessions, CSRF, CORS allowlist, Helmet, rate limiting. |
| Tests | Implemented | Frontend data/route/smoke checks, backend node:test and Supertest suites. |
| Deployment | Partially implemented | Frontend Vercel project metadata is present. Backend deployment config is not present. |

## Current Implementation Status

- Implemented: public frontend routes, customer demo area, admin UI, media
  galleries, events, in-page search, print controls, frontend data validation,
  backend public catalogue reads, auth, inquiry CRM, media/event APIs, search,
  print projections, and seed migration.
- Partially implemented: frontend-backend integration, production admin writes,
  customer API, private conversations, booking backend, production audit, and
  production media workflow.
- Planned: connect `dataClient` internals to backend APIs without changing its
  public signatures.
- Deferred: payments, file uploads, provider integrations, guide self-service,
  and advanced travel-provider modules.
- Removed: payment-specific draft wording, Gmail/SMTP/backend email delivery, and
  specialized staff roles beyond admin and super_admin.

## Planned But Unimplemented Modules

| Module | Status | Notes |
| --- | --- | --- |
| Frontend API client | Planned | No dedicated frontend request helper exists yet. |
| Booking API | Planned | Frontend has booking demo data; backend does not expose booking routes. |
| Customer API | Planned | Backend auth exists; customer dashboard APIs are not present. |
| Private conversation API | Planned | Frontend message UI exists; backend conversation module is not present. |
| Admin catalogue write APIs | Planned | Backend public catalogue reads exist; admin create/update/delete routes are not complete for all catalogue entities. |
| Production audit log | Planned | Frontend demo audit exists; backend append-only histories are scoped mainly to inquiries. |
| Media upload service | Deferred | References only until storage, scanning, access policy, and ownership are approved. |
| Email delivery service | Removed | External compose links remain the supported model. |
| Payment service | Removed | Payment-free scope remains active. |

## Production Goals

1. Replace browser demo data internals with real API calls while preserving
   `dataClient` public signatures and the standard response envelope.
2. Keep public browsing and inquiries available without forced login.
3. Connect frontend authentication to backend sessions and CSRF.
4. Complete backend booking, customer, conversation, CMS, and admin write APIs.
5. Approve production content, media, source/licence records, privacy policy
   version, retention policy, and recovery procedures.
6. Deploy the backend with validated environment variables, MongoDB access,
   CORS origins, session secrets, and monitoring.
7. Run manual responsive, accessibility, role, search, media, and print QA
   before public launch.
