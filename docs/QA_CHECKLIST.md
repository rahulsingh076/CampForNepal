# V1 Manual QA Checklist

Run this matrix against a production-like build, using a clean browser profile and a second profile with the demo localStorage overlay intact. Record browser/version, device emulation, tester, date, and result for each run.

## Automated Checks

Run `npm run check` first — it is the gate, and it must be green before manual
QA is worth anyone's time. It runs, in order:

| Command | What it proves |
| --- | --- |
| `npm run build` | The production bundle compiles. |
| `npm run validate:data` | 180 seed records across 21 collections pass integrity rules: unique ids and public slugs, every relation resolves, statuses/history are in vocabulary, dates are ordered, prices have a clear basis and are non-negative, `bookedSeats <= totalSeats` and within package group size, emails/CMS/internal links/images/media are safe, published records carry SEO fields, public routes reject non-published content, and no string looks like a live credential. Read-only — it never writes a file or touches storage. |
| `npm run check:routes` | Every route in the manifest has a page module with a default export, every dynamic route resolves against real seed data, and every internal link in the CMS menu, footer, and hard-coded source matches a real route. |
| `npm run smoke` | All 71 registered route modules mount inside the real provider stack and route guards without throwing. |

Data validation prints warnings that do not fail the run — currently 38, all
metadata length or the derived-guide-metadata gap. Warnings are visible on
purpose; they are not passes.

## Baseline Build And Console

- [ ] Run `npm run build` with no warnings or errors.
- [ ] Run `npm run preview` and repeat the critical path against the built bundle.
- [ ] With the console open, visit every route group below. There must be no uncaught errors, failed module loads, broken image requests for bundled assets, or React warnings.
- [ ] Confirm an unknown route renders the friendly 404 page.
- [ ] Force a render failure in a local QA branch and confirm the global error boundary offers Reload page and Return home.
- [ ] Clear localStorage, verify seed data returns, then use Admin Settings to reset demo content data. Confirm the content overlay, registered demo users, and audit additions reset; saved trips, sign-in state, and locale preferences intentionally remain in this browser.

## Responsive Matrix

At each width, test the route groups in the next section. Use height sufficient to inspect the full page and test both portrait scroll and modal/drawer behavior.

| Viewport width | Result |
| --- | --- |
| 320px | [ ] |
| 360px | [ ] |
| 390px | [ ] |
| 430px | [ ] |
| 768px | [ ] |
| 1024px | [ ] |
| 1366px | [ ] |
| 1440px | [ ] |
| 1920px | [ ] |

At every width, verify no clipped text, horizontal page scrolling, overlapping controls, unstable card dimensions, or inaccessible off-canvas content. Test the public mobile menu, customer horizontal dashboard navigation, admin mobile sidebar, dropdowns, all modals, detail drawers, and table overflow.

## Route Matrix

| Area | Routes to verify | Check |
| --- | --- | --- |
| Entry and auth | `/welcome`, `/login`, `/register`, `/admin/login`, unmatched path | Metadata, validation, redirects, demo-account picker, error copy, 404. |
| Public discovery | `/`, `/destinations`, `/destinations/:slug`, `/things-to-do`, `/things-to-do/:slug`, `/packages`, `/packages/:slug`, `/trekking`, `/trekking/:slug`, `/expeditions`, `/expeditions/:slug`, `/fixed-departures` | Published-only data, cards, filters, detail skeleton/error/404 behavior, CTA links, lazy images. |
| Public guidance | `/guides`, `/guides/:slug`, `/custom-trip`, `/plan-your-trip`, `/blog`, `/blog/:slug`, `/reviews`, `/about`, `/certificates`, `/travel-info`, `/travel-info/:slug`, `/contact`, `/terms-and-conditions`, `/privacy-policy`, `/cancellation-policy`, `/booking-policy` | Visible published content only, empty states, inquiry forms, metadata, canonical/OG tags. |
| Customer | `/customer`, `/customer/bookings`, `/customer/bookings/:id`, `/customer/wishlist`, `/customer/messages`, `/customer/documents`, `/customer/reviews`, `/customer/profile`, `/customer/notifications` | Auth redirect, customer-only records, status timeline, local messages/reviews/wishlist, loading/error/empty state. |
| Admin overview | `/admin`, `/admin/content`, `/admin/notifications`, `/admin/audit-log` | Role protection, breadcrumb, search placeholder, unread bell count, read-only audit filters. |
| Admin catalogue | `/admin/destinations`, `/admin/activities`, `/admin/packages`, `/admin/fixed-departures`, `/admin/guides` | Loading/error/empty table state, search/sort/pagination/actions, validation, unsaved-change warning, confirmation dialog, audit record, public visibility. |
| Admin editorial | `/admin/posts`, `/admin/reviews` | Composer draft/publish/archive/delete flow, keyboard menu, inline edit, filters, moderation, public feed update. |
| Admin operations | `/admin/inquiries`, `/admin/bookings`, `/admin/bookings/:id` | Detail drawer focus trap, notes, assignment, allowed transitions, conversion, documents, notifications, customer reflection. |
| Admin website | `/admin/website`, `/admin/website/homepage`, `/admin/website/menu`, `/admin/website/footer`, `/admin/website/pages`, `/admin/website/contact`, `/admin/website/certificates`, `/admin/website/travel-info`, `/admin/users`, `/admin/settings` | Singleton loading/error state, keyboard reordering, publication controls, reset confirmation, role restrictions, locked Payments V2 tab. |

For every page, verify an intentional title and description through `usePageMeta`, an `og:title`, `og:description`, `og:url`, canonical URL, and a clean public slug where the route is content-addressed.

## Forms And Data Mutations

- [ ] Public package inquiry, custom trip, contact, callback, emergency, and guide request forms: required fields, invalid email/phone, honeypot, minimum completion time, success state, new inquiry, notification, and audit entry. With demo mode enabled, every successful public request must say “Your demo request was saved in this browser. No message was sent to Camp For Nepal.” It must also show the external email actions: Open Email App, Open Gmail, and Copy Email Address, with copy feedback and no claim that email was sent.
- [ ] Login, admin login, and registration: blank fields, invalid credentials, suspended account, customer denied from admin login, duplicate email, valid demo-account picker.
- [ ] Customer profile: required name, country, language, and currency preferences update LocaleContext and persist locally.
- [ ] Customer booking change, message reply, wishlist toggle, document metadata display, and review submission: confirm visible immediate update, validation, moderation status, notification, and audit entry where applicable.
- [ ] Catalogue forms: destination, activity, package, departure, and guide required fields; numeric bounds; seat counts; package itinerary add/remove/reorder; status and featured changes; delete confirmation; unsaved-change warning.
- [ ] Posts: title/content required, clean generated slug, duplicate slug handling, cover preview, draft excludes public feed, publish/unpublish/archive/delete behavior, inline edit, and audit entry.
- [ ] Website builder: hero, all 13 homepage sections, show/hide, CTA fields, featured picks, keyboard up/down reorder, menu child rows, footer, pages, contact, certificates, travel info, and visible public update.
- [ ] CRM: inquiry filters, follow-up, staff assignment, notes, only allowed status transitions, conversion only from Quoted, booking history, guide assignment, document checklist, cancel side state, closed terminal state, and notifications.
- [ ] Reviews/users/settings: moderation, feature toggle, self-protection from demotion/suspension, locale defaults, template editing, reset confirmation, and locked Payments V2 content.

## Role Access

Log in through `/admin/login` as each active seed account. Verify direct URL access as well as sidebar visibility.

| Role | Must see | Must not see |
| --- | --- | --- |
| Visitor | Public browse, search, plan trip, inquiry, and booking request flows | Customer and admin dashboards. |
| Customer | Optional customer area only after `/login` | All `/admin/*` routes. |
| Admin | All content and operations, audit log, Notifications | Users and Roles, Settings. |
| Super Admin | Every admin module, including Users and Roles and Settings | No additional admin module should be hidden. |

## Accessibility And Motion

Target: **WCAG 2.2 AA**, plus a 44x44 comfortable tap target on touch pointers.
Two items below are deliberate, documented exceptions rather than passes — see
*Known exceptions* at the end of this section.

### Static evidence recorded 2026-08-02 (Final Touch 10)

Verified by source and built-CSS inspection plus 29 automated markup assertions.
`[x]` means checked and passing at the time of writing; `[ ]` still needs a human
at a real browser.

| Area | Evidence |
| --- | --- |
| Skip link | `SkipLink.jsx` stays `position: fixed` and translates in on focus. The previous `focus:not-sr-only` won on specificity and reset the link to `position: static; padding: 0`, shifting the page on first Tab. Its click handler now focuses `#main` after native hash navigation, so the link moves focus as well as scrolling. |
| Landmark focus | All three shells give `<main id="main">` `tabIndex={-1}`, so the skip link moves focus and not only scroll position (Safari and Firefox do not focus a plain `<main>`). A denied nested admin route now renders a labelled `section`, avoiding a second main landmark inside `AdminLayout`. |
| Dialog focus | `Modal` and `DetailDrawer` hold `onClose` in a ref and depend on `[open]` alone. Previously every parent re-render re-ran the trap and pulled the caret out of the field being typed in — reachable in the admin editors, `Users` role dialog, and the customer cancel/reschedule form. |
| Drawers and mobile navigation | `MobileFilterDrawer` now includes inputs, selects, textareas, and custom tab stops in its focus loop, so a search field cannot be skipped by Shift+Tab. `AdminMobileNav` has a Tab trap, Escape, focus restore, `role="dialog"`, a decorative backdrop, and safe-area panel padding. `DetailDrawer` also respects top and bottom safe areas. |
| Menus | The desktop navigation chevron is now 44px wide as well as 44px tall. `UserMenu` now restores focus to its trigger on Escape and uses `aria-controls` without claiming an incompatible menu role. Post card overflow actions are each at least 44px tall. |
| Toast announcements | Both live regions stay mounted and empty in `Toast.jsx`. A region inserted at the same moment as its text is frequently never announced. Errors use a separate `aria-live="assertive"` region instead of retuning one shared region. |
| Notification panel | `role="menu"`/`role="menuitem"` removed: the panel holds headings, descriptive paragraphs, and a "Mark as read" button beside each link, which the menu pattern cannot represent. Now a disclosure with `aria-expanded`, and Escape returns focus to the bell. |
| Error focus scoping | `ModalForm` focuses the first invalid field **inside the dialog**; the document-wide query could focus a field on the page behind it. |
| Language and direction | `LocaleContext` writes `documentElement.lang` and `dir` on every language change, with an RTL set. |
| Reduced motion | Global `prefers-reduced-motion` block neutralises animation, transition, scroll behaviour, reveals, and card/image transforms with `!important`. `useReveal` also fails open when `IntersectionObserver` is missing, so content is never stuck hidden. |
| Zoom | No `user-scalable=no` and no `maximum-scale`; page zoom to 200% is not blocked. |
| Safe areas | `viewport-fit=cover` added to the viewport meta — without it every `env(safe-area-inset-*)` rule in the stylesheet silently computed to zero. `body` now also insets left/right for landscape notches. |
| Headings | Every route reaches an `<h1>` through `PageHeader`, `AdminPageHeader`, `HeroSection`, `StaticPage`, or `RecordNotFound`; no page renders without one. |
| Tables | Every `<table>` sits in an `overflow-x-auto` wrapper, has a `<caption>`, `scope="col"` headers, and `aria-sort` on sortable columns. |
| Status colour | `StatusBadge` pairs every tone with its own glyph and a text label, so no state is colour-only. |
| Customer navigation | Customer sidebar and compact navigation links now use a 44px minimum height, including the mobile horizontal navigation. |

### Keyboard and screen reader — run per route group

- [ ] Tab through each route group in the Route Matrix. Tab order follows reading order, focus is always visible, and no control is reachable only by pointer.
- [ ] Press Tab on a fresh page load. Skip to content appears at the top left **without shifting the page**, and activating it moves focus into `<main>`.
- [ ] Open and close every modal dialog and drawer: public callback modal, mobile menu, listing filter sheet, admin mobile navigation, catalogue editor, confirm dialog, inquiry and booking detail drawers, review form, and booking change form. Each traps Tab, closes on Escape, and returns focus to the control that opened it.
- [ ] Open the non-modal locale settings popover. It closes on Escape and returns focus to its trigger; normal Tab navigation continues through the page instead of being trapped behind a compact header control.
- [ ] Type a full sentence into the cancel/reschedule reason box and into an admin editor field. Every character lands and the caret never jumps out.
- [ ] Trigger a save toast and an error toast with a screen reader running. Both are announced without moving focus.
- [ ] Open the notification bell, Tab through it, press Escape, and confirm focus returns to the bell.
- [ ] Submit an admin form with invalid fields. The summary appears, and focus lands on the first invalid field inside the dialog, never behind it.
- [ ] Confirm every control has an accessible name and every form control a visible label, required indication, and error association.
- [ ] Inspect image alt text: meaningful images describe themselves, decorative ones use empty alt.

### Responsive and touch — run at each width

Run 320, 360, 390, 430, 768, 1024, 1366, 1440, and 1920, plus landscape phone.

- [ ] No horizontal page scrolling and no clipped text at any width. 320px is the narrowest supported and must be checked explicitly.
- [ ] On a touch device, buttons are at least 44px tall; icon-only controls are 44x44.
- [ ] Landscape on a notched phone: no content sits under the cutout, and the mobile action bar and WhatsApp button clear the home indicator.
- [ ] With a mobile keyboard open, the focused field stays visible and no sticky action bar covers it.
- [ ] Zoom to 200% and then 400%. Content reflows, nothing is cut off, and no control becomes unreachable.
- [ ] Long-translation stress: switch locale and confirm no clipped labels, prices, or dates.

### Motion

- [ ] Enable `prefers-reduced-motion: reduce`. Reveals are visible, card/image hover transforms stop, magnetic/parallax behavior stops, the scroll-progress strip is absent, and no action is delayed by motion.
- [ ] Confirm nothing autoplays and no content is reachable only on hover.

### Known Exceptions And Manual Gaps

1. **Standard text buttons are 36px tall on fine pointers.** `px-4 py-2 text-small` is the design system's button across roughly 96 call sites. It clears the WCAG 2.2 AA minimum (2.5.8, 24x24) but not the 44px enhanced target (2.5.5, AAA). Rather than restyle every button, a base rule raises buttons to 44px under `@media (pointer: coarse)`, so touch users get the full target and the desktop visual language is unchanged. Revisit if 2.5.5 becomes a requirement on desktop.
2. **Global admin search requires role-matrix manual QA.** The in-page admin search exists, but automated route checks cannot prove every staff role sees exactly the right result types. Run [GLOBAL_SEARCH_QA.md](GLOBAL_SEARCH_QA.md) and [ROLE_QA.md](ROLE_QA.md) before release.

### Remaining Accessibility And Responsive Follow-Up

These are confirmed verification gaps or product limitations, not defects that were hidden by this pass.

| Route / scope | File | Severity | Reason | Suggested future fix |
| --- | --- | --- | --- | --- |
| All public, customer, and admin routes at 320/360/390/430/768/1024/1366/1440/1920, landscape, 200% zoom, and real mobile keyboard states | `docs/QA_CHECKLIST.md` | P2 | Source inspection and the connected 1280px browser confirm shared responsive safeguards, but the required physical-device/viewport matrix cannot be proven from this fixed-viewport browser connection. | Complete the matrix above in current Safari iOS, Chrome Android, Firefox, and desktop browsers; record pass/fail and screenshots before release. |
| Route-render smoke harness | `frontend/scripts/smoke-render.mjs` | P2 | The 65-route smoke pass emits React `useLayoutEffect` SSR warnings from `MemoryRouter`. The Vite application is client-rendered, so this is test-output noise rather than a browser console failure. | Keep this renderer as a crash smoke or switch the harness to a client-capable DOM runner if console-clean server test output becomes a release criterion. |

## Performance And SEO

- [x] `usePageMeta` emits absolute runtime Open Graph/Twitter image URLs, strips query/hash values from canonicals, and sets `noindex, nofollow` for dashboards, sign-in, welcome, and design-preview routes. The Design Preview route returns the standard not-found experience outside Vite development.
- [x] CMS URLs are allowlisted at the dataClient write boundary and guarded again at render points: internal links are site-relative; social, map, and image URLs use HTTPS (or a site-relative image path); malformed overlay values fall back to no link or the shared image state.
- [x] The dataClient write validator rejects duplicate shared blog/update slugs, bad relations/statuses/dates/seat math, negative prices, malformed relevant emails, unsafe URLs, and invalid singleton navigation before a demo data or audit entry is made. Overlay recovery may still stamp its empty versioned envelope on first read.
- [x] Build measurement (2026-08-02): 136 JavaScript chunks plus one CSS asset; `dataClient` is 490.76 kB raw / 155.04 kB gzip because all demo seeds are bundled. Route splitting works, but replacing the seed facade with the API is the only meaningful cure for that initial data payload.
- [ ] Inspect the production network waterfall: route navigation loads a route chunk only when needed and below-fold images use `loading="lazy"`.
- [ ] Verify the hero remains the deliberate eager image and uses a constrained crop; inspect remote CMS images for appropriate source dimensions before production upload.
- [ ] Verify legacy seed `/images/...` URLs resolve directly to the local `himalayan-trail-fallback.jpg` image without a broken request or icon. Replace fallback usage with approved per-record media before production.
- [ ] Verify package, destination, and activity media accepts legacy URL strings and owner-approved media objects with captions, alt text, focal position, source, and licence metadata.
- [ ] Verify print preview manually: private admin/customer shells are suppressed, public trip content remains readable, and no browser print is claimed complete without human confirmation.
- [ ] Confirm every list shows a skeleton or loading message, a retryable error state, and a friendly empty state.
- [ ] Confirm no draft package, destination, guide, certificate, travel-info page, or post is discoverable on a public list/detail URL.
- [ ] Confirm production deployment provides `robots.txt` and a generated `sitemap.xml` limited to canonical published public URLs.

## Execution Record

- [x] `npm run build` completed successfully after the hardening changes; Vite emitted route-level chunks for public, customer, and admin screens.
- [x] Focused local browser smoke completed: public title/description/Open Graph/canonical tags, skip landmark, zero rendered broken images, image fallback, desktop hero layout, admin booking-detail metadata, booking timeline, and absence of V2 payment states.
- [x] Static review completed: shared skeletons, metadata hook, image loading attributes, error boundary, focus visibility, reduced-motion handling, table semantics, drawer focus trap, and data-client contract.
- [ ] Full cross-browser manual matrix: run before launch on the target browsers/devices and record results above.
- [ ] Production deployment checks: canonical domain, `robots.txt`, `sitemap.xml`, CSP, monitoring, and real error reporting are deployment work, not available in local V1.
