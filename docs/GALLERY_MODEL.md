# Gallery Model

Packages, destinations, activities, events, posts, and selected homepage
sections can use gallery media. Existing URL-only gallery entries remain valid;
new entries can carry richer metadata.

## Gallery Item Shape

The frontend accepts legacy strings:

```js
'/images/packages/everest.jpg'
```

and structured objects:

```js
{
  type: 'image',
  sourceType: 'local_asset',
  src: '/images/packages/everest.jpg',
  thumbnailSrc: '/images/packages/everest-thumb.jpg',
  alt: 'Trekker on a mountain trail',
  caption: 'Morning on the trail',
  focalPosition: '50% 25%',
  photographer: 'Owner-approved name',
  sourceName: 'Owner-approved source',
  sourceReference: 'Internal source reference',
  licenceName: 'Owner-approved licence',
  licenceUrl: 'https://example.com/licence',
  mediaId: 'media-001',
  day: 3,
  season: 'Autumn'
}
```

## Ordering

Ordering is array order. The admin gallery editor supports move up/down actions
and preserves order on save.

## Cover And Hero

Public package, destination, activity, and event pages select their primary
image from cover/hero media first, then gallery media, then older image fields.
Only genuine media should be marked as seasonal or before/after.

## Itinerary Day Media

Package itinerary days can carry `media[]`. Public itinerary accordions render
day media with captions, credits, and video/reel poster links.

## Public Safety

Draft, hidden, and archived media-library assets are not selectable from shared
gallery pickers. Public lists and detail pages still enforce the content
record's own publication status.
