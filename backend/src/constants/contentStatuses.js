// Publication state for editorial and catalogue content.
//
// Only `published` appears in the frontend seed data, but the admin panel
// writes all four, and docs/DATA_MODEL.md documents all four. Public reads must
// return `published` records only — enforced by services, not by the schema.
export const CONTENT_STATUSES = Object.freeze([
  'draft',
  'published',
  'hidden',
  'archived',
])

export const DEFAULT_CONTENT_STATUS = 'draft'

// Public catalogue endpoints filter on this, so it lives here rather than being
// re-typed in each service.
export const PUBLIC_CONTENT_STATUS = 'published'
