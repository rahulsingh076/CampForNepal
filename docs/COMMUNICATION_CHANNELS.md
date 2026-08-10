# Communication Channels

This document defines how Camp For Nepal may help a customer continue a saved
inquiry outside the website.

## Company contact settings

Public contact components must receive these values through the existing
`dataClient` and future API boundary. Do not hard-code contact details in JSX.

The contact settings model should include:

- `publicEmail`;
- `emailEnabled`;
- WhatsApp number and `whatsappEnabled`;
- Facebook Page URL and enabled state;
- Facebook Messenger URL and enabled state;
- Instagram URL and enabled state;
- office phone and enabled state;
- office address;
- business hours;
- emergency-contact wording;
- enabled state for every public channel.

V1 stores this as the `contactDetails` singleton. Future backend work should
move the same shape into protected company contact settings.

## Email

Email is external-compose only. The site offers exactly these email actions:

- Open Email App: `mailto:` with encoded subject and body.
- Open Gmail: `https://mail.google.com/mail/?view=cm&fs=1...` in a new tab.
- Copy Email Address: copies the configured public email and announces success.

The site does not send email and does not authenticate with Gmail. Gmail login,
if needed, happens only on Google's site.

Subjects and bodies must be built from server-validated or database-backed
values. Include the inquiry reference when one exists:

```text
Camp For Nepal Inquiry - CFN-2026-7K9Q2M - Annapurna Base Camp Trek
```

Allowed body details are narrow:

- inquiry reference;
- package, departure, or guide title;
- preferred travel date;
- number of travellers;
- a short customer-written message when it does not contain sensitive content.

Do not include passport numbers, identity numbers, card details, CVV, bank
credentials, passwords, OTP codes, confidential medical information, internal
staff notes, or private guide information.

## WhatsApp

WhatsApp uses a normal `wa.me` link. A message may be prefilled with a short safe
summary and the inquiry reference. The site does not use the WhatsApp API and
does not claim the message was delivered or read.

## Facebook, Messenger, and Instagram

Facebook, Messenger, and Instagram actions are simple external links to the
configured company URLs. The site does not use Facebook Login, Messenger API,
Instagram Login, or Instagram Messaging API. It does not embed social
authentication and does not claim a direct message was sent.

## Phone

Phone links use `tel:` with the configured office or emergency phone number.
Call completion is outside the website and is not automatically recorded.

## ExternalContactEvent concept

A future communication module may add an `ExternalContactEvent` collection. It
should be privacy-safe and event-based rather than pretending to own external
message delivery.

Suggested fields:

- `inquiryId`;
- `customerId` when authenticated;
- `channel`;
- `action`;
- `createdAt`;
- `createdByUserId` when staff records it;
- optional staff summary;
- optional next action.

Allowed channel values:

- `email_app`;
- `gmail`;
- `whatsapp`;
- `facebook`;
- `messenger`;
- `instagram`;
- `phone`.

Allowed automated action values:

- `composer_opened`;
- `external_link_opened`;
- `email_address_copied`.

Do not automatically create:

- `message_sent`;
- `message_delivered`;
- `message_read`.

Staff may manually record:

- `contact_received`;
- `staff_replied`;
- `customer_replied`;
- `external_conversation_summary`.

## Private website chat

Private website chat is separate from external links. It is the only planned
channel whose full message history is automatically stored in MongoDB.

It must support customer and assigned-staff participants, inquiry relationship,
package relationship, future booking relationship, plain-text messages, unread
state, read timestamps, internal notes separated from customer-visible messages,
server-enforced participant authorization, searchable company inbox, and
follow-up management.

It must not synchronize Gmail or any external inbox.
