# Inquiry API Scope

The backend inquiry API is documented in
[`backend/docs/INQUIRY_API.md`](../backend/docs/INQUIRY_API.md). This root note
records the product-level behavior the frontend integration must preserve.

## Submission flow

1. The customer submits a website inquiry form.
2. The backend validates the request.
3. The backend stores the Inquiry record in MongoDB.
4. The backend returns a public random reference code, status, and timestamp.
5. The website shows a saved confirmation.
6. The website may offer external continuation choices.

The public response must not expose a MongoDB ObjectId. The reference code is
what the customer can paste into Gmail, WhatsApp, private chat, or a phone call.

## Confirmation wording

Use:

> Your inquiry has been saved. No email has been sent yet. Open your email
> application, review the prepared message, and press Send.

Do not use:

- "Email sent successfully."
- "We received your email."
- "Gmail connected."
- "Gmail integration."

The website may truthfully say "Your inquiry has been saved."

## External continuation

After a save, the website may offer:

- Open Email App;
- Open Gmail;
- Continue on WhatsApp;
- Start Private Chat when dedicated private chat exists.

The website must not claim that any external message was sent. Opening a
composer or external link proves only that the action was opened.

## Stored information

The Inquiry record remains the official structured record. It stores the
validated inquiry data, contact fields, travel preferences, snapshot fields,
status, priority, assignment, follow-up, internal notes, status history, and
timestamps according to the backend inquiry API.

A future `ExternalContactEvent` may record privacy-safe external actions such as
composer opened, external link opened, and email address copied. It must not
automatically record message sent, delivered, or read.

External email, WhatsApp, Facebook, Messenger, Instagram, and phone
conversations are not automatically synchronized. Staff may manually summarize
external conversations in the CRM when they have real knowledge of them.

## Prefilled email and WhatsApp content

Generated subject and body text must be based on server-validated or
database-backed information. Include the inquiry reference where available.

Allowed:

- inquiry reference;
- package, departure, or guide title;
- preferred travel date;
- number of travellers;
- short customer-written message.

Not allowed:

- passport or identity numbers;
- card details, CVV, bank credentials, passwords, PINs, or OTP codes;
- confidential medical information;
- internal staff notes;
- private guide information.

All subject and body values must be encoded safely before constructing links,
and the configured company email must be validated before creating email links.
