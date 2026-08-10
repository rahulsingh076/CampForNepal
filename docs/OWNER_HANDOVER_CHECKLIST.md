# Owner Handover Checklist

Do not put passwords, recovery codes, private keys, session secrets, or live
connection strings in Git, README files, issue comments, or ordinary chat logs.

## Owner Access

- [ ] Invite developer to the private GitHub repository with appropriate role.
- [ ] Invite developer to MongoDB Atlas project with least privilege.
- [ ] Provide backend hosting access when selected.
- [ ] Provide frontend hosting access if Vercel deployment remains active.
- [ ] Provide registrar/DNS access or coordinate DNS changes.
- [ ] Confirm domain ownership.
- [ ] Provide media-provider access if one is selected later.
- [ ] Provide business email administration access only if needed.
- [ ] Provide social-page access only if needed for public links/content.

## Secure Credential Handover

- [ ] Use a password manager or secure one-time secret channel.
- [ ] Create named developer accounts where possible.
- [ ] Avoid shared credentials.
- [ ] Use least privilege.
- [ ] Rotate shared credentials after handover.
- [ ] Store recovery codes with the owner.
- [ ] Confirm `.env` values are never committed.

## Owner Content

- [ ] Final logo and brand assets.
- [ ] Legal business name.
- [ ] Phone, WhatsApp, email, support email, emergency contact wording.
- [ ] Office address and hours.
- [ ] Social links.
- [ ] Package prices and price basis.
- [ ] Itineraries, inclusions, exclusions, permits, safety notes.
- [ ] Guide information and approved public portraits.
- [ ] Approved images, source links, and licence records.
- [ ] Approved videos and reels.
- [ ] Event details.
- [ ] Real reviews and moderation approvals.
- [ ] Privacy policy.
- [ ] Terms and conditions.
- [ ] Cancellation policy.
- [ ] Data retention decision.

## Owner Approvals

- [ ] Active role migration and final role list.
- [ ] Production seed/import.
- [ ] Production super-admin bootstrap.
- [ ] Domain connection.
- [ ] Launch decision.
- [ ] Backup policy.
- [ ] Restore procedure.
- [ ] Data retention period.
- [ ] Privacy request handling.
- [ ] Destructive recovery actions.
- [ ] Whether customer document metadata remains in scope.

## Developer Work The Owner Should Not Do Directly

- Implement backend booking/customer/conversation APIs.
- Change model fields or database indexes.
- Run production migrations.
- Run destructive reset commands.
- Alter auth/session/CSRF behavior.
- Add payment or removed integrations.
