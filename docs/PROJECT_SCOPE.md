# Project Scope — Version 1

Current implementation combines the React/Vite frontend with Express/Mongoose
backend foundations. The frontend still uses a browser data facade for many
customer/admin workflows while backend API wiring is completed.

## In scope
- Country + language first screen, and a localized public site
- Public pages: Home, Destinations, Things To Do, Packages, Trekking,
  Expeditions, Fixed Departures, Guides, Custom Trip, Plan Your Trip,
  Blog/Updates, Reviews, About, Certificates, Travel Info, Contact
- Customer dashboard with optional login: bookings with simple status,
  wishlist, messages, documents (metadata only), reviews, profile
- Admin panel: dashboard, catalog CRUD, posts feed, website builder CMS,
  reviews moderation, bookings and inquiry CRM, users and roles, settings,
  read-only audit log
- Notifications (mock), external email/contact actions, SEO basics, performance
  and accessibility polish

## Out of scope (Version 2)
- Payment in any form — no gateway, no payment proof, no deposit fields,
  no payment screens
- Real file uploads, binary document storage, media transcoding, and provider
  booking integrations
- Gmail integration, Gmail login, SMTP, backend email sending, email inbox
  synchronization, and automatic WhatsApp/social message delivery
- Automated trip planner, mobile app, loyalty system, flight/hotel provider
  APIs

The simplified booking lifecycle uses non-payment status behavior only:
`booked` and `cancelled`. Further trip details should be discussed through
private customer-service messages or external manual contact.

## Roles (mocked)
All accounts and role checks are frontend-only demo behavior, not a security
boundary. `customer` can use public and customer routes. `guide` remains a
seed/data-contract placeholder with no self-service portal. `admin` can access
normal content, operations, media, search, and print modules; `super_admin`
additionally controls Users and Roles and Settings. Visitor planning, search,
inquiry, and booking request flows must remain usable without login.

`siteSettings.demoMode` is the single demo switch. When enabled, all public
requests and operational records stay in this browser and must be labelled as
demo data rather than live services or evidence.
