// The single source of brand identity: names, standing copy, and the approved
// logo assets. Editable business content still lives in the `siteSettings` and
// `contactDetails` CMS records — these are the defaults the app falls back to
// before those load, plus the fixed asset paths the CMS does not control.

export const SITE_NAME = 'Camp For Nepal'

// Used where the full lockup will not fit: compact headers and tight labels.
export const SHORT_NAME = 'Camp For Nepal'

export const TAGLINE = 'Small-group Himalayan journeys, run from Kathmandu.'

export const BRAND_DESCRIPTION =
  'Small-group journeys, treks, and expeditions across Nepal with experienced local guides.'

export const BRAND_ASSETS = {
  primary: {
    src: '/brand/camp-for-nepal-logo.jpg',
    width: 1100,
    height: 600,
  },
  // The approved source is a light-background raster lockup, so there is no
  // true reversed artwork to use. On dark bands the primary logo sits inside a
  // white surface rather than being recoloured, inverted, or redrawn. A proper
  // reversed asset is owner content — see docs/DESIGN_SYSTEM.md.
  white: {
    src: '/brand/camp-for-nepal-logo.jpg',
    width: 1100,
    height: 600,
    needsOwnerAsset: true,
  },
  // A square crop of the supplied mark, for favicon-sized and compact contexts.
  icon: {
    src: '/brand/camp-for-nepal-icon.jpg',
    width: 800,
    height: 800,
  },
}

export const FAVICON = BRAND_ASSETS.icon.src

// The fallback preview image for a shared link that has no image of its own.
// Records with real photography pass their own image to usePageMeta instead.
export const SOCIAL_SHARE_IMAGE = BRAND_ASSETS.primary.src
