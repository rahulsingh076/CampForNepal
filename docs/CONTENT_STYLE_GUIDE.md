# Content Style Guide

## Purpose

Camp For Nepal writes with warmth, calm local knowledge, and practical honesty.
The aim is to help a visitor make a considered next decision, not to pressure
them into one. This guide applies to CMS records, notifications, forms, and
future translated UI copy.

## Voice

- Start with the feeling or purpose of a journey, then give the practical fact.
- Use short labels, plain English, active voice, and one idea per sentence.
- Put reassurance beside a decision: dates beside availability, risk beside an
  inquiry action, and policy links beside change or cancellation choices.
- Be specific about uncertainty. Say `availability is checked before
  confirmation`, not `book now` or `guaranteed`.
- Name local places, routes, and practices only when the source record supports
  them. Write respectfully about communities, culture, guides, and landscapes.

Avoid superlatives, countdowns, fear, guilt, scarcity, unverified affiliations,
and corporate filler such as `world-class`, `seamless`, `unlock`, or `best`.

## Content Order

Use this order for public-facing CMS copy and reusable UI content:

1. **Emotion:** name the place, feeling, or purpose without exaggeration.
2. **Useful facts:** give duration, effort, season, inclusions, price basis, or
   the next practical detail.
3. **Trust evidence:** show only a sourced record. Label any sample record
   before it can be mistaken for proof.
4. **Reassurance:** explain uncertainty, availability checks, policy links, or
   direct support.
5. **Low-pressure action:** invite a visitor to compare, ask, or plan.

This sequence applies to page headers, cards, trip summaries, and action
sections. Keep the emotional line short enough that the practical information
stays visible without scrolling on a phone.

## Public Page Checklist

Before publishing a public page, make sure it answers the questions relevant
to that page without making a visitor hunt for them:

- Why visit, and who is the route, place, activity, or story suited to?
- How long does it take, how demanding is it, and when is it normally suited?
- What is included, what may cost extra, and what is the displayed price basis?
- Which permits, altitude preparation, or local rules are relevant?
- Who can guide the trip, and is any displayed guide evidence real or sample?
- What happens after an inquiry, how can someone contact us, and where is the
  Cancellation Policy?

Do not force an answer when the record does not support one. Link to the
relevant planning, permit, contact, or policy page instead of inventing it.

## Content Boundaries

- Do not overwrite owner-approved trip, legal, editorial, destination, or guide
  copy. Revise only content explicitly marked demo, sample, or placeholder.
- Demo records must say they are samples before a visitor could rely on them.
  This includes reviews, credentials, guide profiles, verification, years of
  experience, availability, seat counts, and response-time statements.
- Never invent customer names, official affiliations, permits, reviews, awards,
  response times, or safety outcomes for a public launch.
- Do not ask for passport, payment, health, or identity-document information in
  V1 forms. Documents remain metadata-only until a backend exists.

## Reusable Patterns

| Situation | Preferred | Avoid |
| --- | --- | --- |
| Heading | `Choose a route that suits your pace` | `Discover the best of Nepal` |
| Card | `12 days · Strenuous · Best in Oct-Nov` | `An unforgettable adventure` |
| CTA | `Check availability` | `Book now` |
| Validation | `Email is needed.` | `Invalid input` |
| Inquiry success | `Saved in this browser. No message was transmitted.` | `We will be in touch soon.` |
| Inquiry continuation | `Your inquiry has been saved. No email has been sent yet. Open your email application, review the prepared message, and press Send.` | `Email sent successfully.` |
| 404 | `We do not run that trip. See all trips.` | `Page not found` |
| Empty results | `No trips match those filters. Clear filters or browse all trips.` | `No data` |
| Safety note | `This route spends time above 5,000m. Read the itinerary and prepare for the stated effort.` | `Safe for everyone` |
| Demo disclosure | `Sample credential record. Do not treat it as current proof.` | `Licensed and verified` |

## Ready-to-Use Examples

| Use | Preferred example |
| --- | --- |
| Hero headline | `Find the Nepal that fits the way you travel` |
| Section headline | `Choose with more of the picture` |
| Card description | `12 days in the Khumbu with stated walking days, season, and price basis.` |
| Primary CTA | `Check Availability` |
| Secondary CTA | `Talk to a Trip Expert` |
| Inquiry help | `Tell us your dates and pace. This demo saves the brief only in this browser.` |
| Validation | `Email is needed.` |
| Demo success | `Your demo request was saved in this browser. No message was sent to Camp For Nepal.` |
| External email actions | `Open Email App`, `Open Gmail`, `Copy Email Address` |
| Empty results | `No trips match those filters. Clear filters, browse all trips, or plan a custom route.` |
| 404 | `We cannot find that page. The link may be out of date; nothing is broken on your side.` |
| Safety note | `This route reaches 5,000m. Read the stated itinerary, permits, and effort before deciding whether to inquire.` |
| Cancellation reassurance | `Availability and cancellation terms are checked before anything is confirmed. Read the Cancellation Policy.` |
| Guide request | `Request this guide` with `Availability is checked before anything is confirmed.` |
| Responsible travel | `Follow local guidance, ask before photographing people, and leave trails and lodges as you found them.` |

## Decision Microcopy

- **Currency:** non-USD displays are approximate, use a fixed demo rate, and
  retain the USD price basis.
- **Availability:** a date or seat is a planning signal. Confirm trip, party,
  and route details before a booking is confirmed.
- **Email:** never say Gmail is connected or an email was sent. Use external
  compose labels only: `Open Email App`, `Open Gmail`, `Copy Email Address`.
- **Cancellation:** link to the policy beside a booking-change action; do not
  promise an outcome before supplier, permit, and date details are checked.
- **Permits and altitude:** use the route record to explain requirements and
  effort. Never make a medical assessment or promise that a traveller is fit.
- **Support:** make Call and WhatsApp visible for urgent support. In demo mode,
  state that contact details are placeholders and not an emergency service.
- **Guide verification:** say `Sample verification` in demo mode. Use
  `Verified guide` only after a real, current verification source is connected.
- **Documents:** say `Documents are metadata-only in V1. Uploads arrive with
  the backend.` Never request passport scans, payment proof, bank details, or
  medical documents through a public form.

## Responsible Travel

Use careful, supported language: invite visitors to respect local guidance,
communities, culture, trail conditions, and guide welfare. Do not claim a
carbon benefit, conservation outcome, ethical certification, or community
impact unless its source record provides evidence.

## Translation

- UI copy uses stable keys in `frontend/src/config/translations.js`; do not translate
  business content in JSX.
- Keep labels brief enough for Korean, Nepali, Japanese, Hindi, and Chinese.
- Missing locale keys fall back to English. This is a fallback, not a claim that
  long-form CMS content has been localized.
- Add a complete key in English before adding locale variants; preserve the key
  name across every locale.

## State Copy

- **Loading:** name the thing being loaded, for example `Loading departures`.
- **Error:** say what did not load and offer the lowest-risk action, usually
  `Try again` or a route back to the catalogue. State when no visitor data was
  changed or lost.
- **Empty:** explain whether filters, dates, or unpublished content caused the
  empty state, then offer a clear escape path.
- **Success:** state exactly what was saved and where. In demo mode, always say
  it stayed in the browser and was not transmitted.

## Translation Readiness

- Put repeatable interface strings in translation keys rather than writing a
  second version in JSX. Keep IDs and key names stable.
- Prefer short labels such as `Clear filters`, `Try again`, and `Check
  availability`; Korean, Nepali, Japanese, Hindi, and Chinese variants may be
  longer.
- Date, number, and currency labels should use locale formatters. In this V1,
  display currency is approximate and does not change the USD data basis.
- English is a clear fallback only. Do not imply that long-form trip, legal,
  or editorial content is translated when it is still shown in English.
