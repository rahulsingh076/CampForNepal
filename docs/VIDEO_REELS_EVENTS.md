# Videos, Reels, And Events

Videos and reels are references only. This project does not add social login,
Meta APIs, YouTube APIs, OAuth, SMTP, payment, ticketing, autoplay with sound,
or binary storage.

## Supported Media Sources

- YouTube URL
- Vimeo URL
- Instagram reel URL
- Facebook video/reel URL
- Safe external HTTPS/HTTP URL
- Approved local build asset path included in the production build

Provider-specific records are validated against provider hosts on the backend.
Unsupported embeds should open externally from a poster or thumbnail.

## Event Scope

Events support:

`title`, `slug`, `eventType`, `shortDescription`, `fullDescription`,
`startDateTime`, `endDateTime`, `timezone`, `venueName`, `address`, `mapLink`,
`organizer`, `coverMedia`, `gallery`, `videos`, `relatedPackageIds`,
`relatedDestinationIds`, `ctaLabel`, `ctaLink`, `status`, `featured`, and
`seo`.

`status` is `draft`, `published`, `cancelled`, `completed`, or `archived`.
Public pages show only `published`, `cancelled`, and `completed`; draft and
archived events are hidden.

## Demo Content

The seed event and draft media records are demo scaffolding for testing the
workflow. Owner-approved production event details must replace or verify them
before launch.
