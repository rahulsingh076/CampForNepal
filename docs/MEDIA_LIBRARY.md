# Media Library

The media library is a reference system, not a file store. Records may point to
approved shipped local assets, safe external image/video URLs, or supported
provider links. No video binary is stored in MongoDB, and the current scope does
not add direct cloud uploads.

## Record Shape

Media records use:

`title`, `slug`, `type`, `sourceType`, `sourceUrl`, `embedUrl`,
`thumbnailUrl`, `alt`, `caption`, `width`, `height`, `durationSeconds`,
`focalPosition`, `tags`, `sourceName`, `sourceReference`,
`photographerOrCreator`, `licence`, `attributionRequired`, `verifiedAt`,
`status`, and `usageLocations`.

`type` is `image`, `video`, or `reel`.

`sourceType` is `local_asset`, `external_url`, `youtube`, `vimeo`,
`instagram`, or `facebook`.

`status` is `draft`, `published`, `hidden`, or `archived`. Public surfaces use
only `published`.

## Local Assets

Local images, videos, and reels are represented as site-relative paths such as:

```text
/media/library/demo-khumbu-briefing.mp4
```

The admin file picker fills this reference path only. It does not copy, upload,
or persist the selected file. Before production, the owner must place the file
in `frontend/public/media/library/` or another shipped public folder with the
same path.

This keeps the project payment-free and storage-free while still allowing
approved local build assets.

## Usage And Deletion

Shared assets are not deleted when a package, destination, activity, event, or
post changes. Deletion is blocked while `usageLocations` has entries; detach or
replace the asset first. Archive is the preferred cleanup action for unused
media.

## Owner Actions

- Replace demo image references with approved production images.
- Add real alt text, captions, focal positions, source names, and licences.
- Put approved local files into `frontend/public/media/library/`.
- Keep videos/reels as references unless a future storage-provider module is
  approved.
- Do not publish third-party media without permission or source evidence.
