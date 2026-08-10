# Current Business Scope

Camp For Nepal is a travel inquiry and operations system. It records structured
website inquiries and lets staff manage them in the CRM. It does not send email,
does not integrate Gmail, and does not process payments.

## Communication decision

Email contact is external-compose only.

Camp For Nepal must not:

- embed Gmail or any other webmail client;
- show a Gmail login form;
- request Google account permissions;
- store email credentials;
- use Gmail OAuth, Gmail API, Gmail SMTP, or app passwords;
- install Nodemailer or a paid email provider for this scope;
- send email from the frontend or backend;
- read customer email or synchronize external conversations.

If a visitor chooses Gmail and is not signed in, Google handles that sign-in on
Google's site in a separate browser tab. Camp For Nepal does not see or handle
that authentication.

## Public inquiry behavior

Package inquiries, custom trips, fixed-departure seat requests, contact forms,
callback requests, and guide requests keep the website form flow:

1. The customer completes the form.
2. The backend validates the payload.
3. The backend stores the inquiry in MongoDB.
4. The backend returns a random public reference code such as
   `CFN-2026-7K9Q2M`.
5. The website confirms the inquiry was saved.
6. The website may offer external next steps: Open Email App, Open Gmail,
   Continue on WhatsApp, and Start Private Chat when that feature exists.
7. The customer chooses the external channel and presses Send outside the site.

The correct confirmation is:

> Your inquiry has been saved. No email has been sent yet. Open your email
> application, review the prepared message, and press Send.

Never use wording such as "Email sent successfully", "We received your email",
"Gmail connected", "Login with Gmail", or "Send Through Gmail".

## Direct email behavior

A simple Email Us action opens the reusable external email chooser and does not
create an inquiry automatically. The chooser offers:

- Open Email App: a normal `mailto:` link;
- Open Gmail: Gmail web compose in a new browser tab;
- Copy Email Address: clipboard copy with visible and screen-reader feedback.

The configured company email comes from contact settings, not JSX.

## Database records

The Inquiry record remains the official structured inquiry record. It may hold:

- `referenceCode`;
- `userId`;
- `type`;
- package, fixed departure, or guide references;
- customer contact fields;
- travel preferences;
- preferred contact method;
- status, priority, assignment, follow-up, internal notes, and status history;
- created and updated timestamps.

Opening a composer is not a sent message. A later `ExternalContactEvent` record
may track privacy-safe actions such as `composer_opened`,
`external_link_opened`, and `email_address_copied`, but it must not automatically
create `message_sent`, `message_delivered`, or `message_read`.

## External channels

WhatsApp, Facebook, Messenger, Instagram, and phone actions are direct external
links only. The system may prefill a short WhatsApp message with the inquiry
reference, but it does not use WhatsApp, Facebook, Messenger, or Instagram APIs
and does not claim delivery.

Staff may manually add an external-contact summary when they have real knowledge
of a reply or conversation.

## Private website chat

Private website chat is the only future communication channel whose complete
message history is automatically stored in MongoDB. It belongs to a dedicated
communication module and must not be implemented as Gmail synchronization.

When private chat exists, it must show this persistent warning:

> Do not share card numbers, card security codes, PINs, OTP codes, passwords,
> bank-login credentials, passport scans, identity documents, or confidential
> medical documents in chat.

Payment amount and payment-method discussion may occur, but payment processing,
card storage, CVV storage, bank-login credential storage, and automatic paid
status changes remain excluded.

## Revised backend roadmap responsibilities

| Area | Responsibility |
| --- | --- |
| Inquiry CRM | Public inquiries, CRM list/detail, assignment, internal notes, follow-up, priority, controlled inquiry statuses, no email sending, no Gmail integration |
| Communication | Private website conversations, unified company inbox, direct contact settings, external-contact event records, manual external-contact summaries, no Gmail API, no Gmail SMTP |
| Company management | Protected company management for packages, destinations, activities, guides, departures, reviews, website content, and contact settings |
| Booking | Inquiry-to-booking conversion, booking records, customer booking view, guide assignment, payment discussion only, no online payment |
| Frontend API integration | Connect frontend dataClient functions to real APIs, implement the external email chooser, preserve existing function signatures, avoid broad UI rewrites |
