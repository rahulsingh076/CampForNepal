# Design System

Tokens live in `frontend/src/styles/tokens.css` inside a Tailwind v4 `@theme` block.
There is no `tailwind.config.js`. A few values are mirrored in
`frontend/src/config/designTokens.js` for the rare cases JavaScript needs them.

## Brand Assets

`frontend/src/config/siteIdentity.js` is the single source of brand identity. Application
shells render the logo through `frontend/src/components/layout/BrandLogo.jsx`.

| Export | Value | Used by |
| --- | --- | --- |
| `SITE_NAME` | Camp For Nepal | Page titles, shells, structured data |
| `SHORT_NAME` | Camp For Nepal | Compact headers and tight labels |
| `TAGLINE` | Small-group Himalayan journeys, run from Kathmandu. | Standing strapline |
| `BRAND_DESCRIPTION` | Small-group journeys, treks, and expeditions across Nepal with experienced local guides. | Default meta description |
| `BRAND_ASSETS.primary/white/icon` | see below | `BrandLogo`, favicon |
| `FAVICON` | `/brand/camp-for-nepal-icon.jpg` | `index.html` |
| `SOCIAL_SHARE_IMAGE` | `/brand/camp-for-nepal-logo.jpg` | `usePageMeta` fallback, static OG/Twitter tags |

Business-editable equivalents (`siteName`, contact details) live in the
`siteSettings` and `contactDetails` CMS records and win at runtime. These are the
defaults the app falls back to before those load.

| Asset | File | Rule |
| --- | --- | --- |
| Primary logo | `frontend/public/brand/camp-for-nepal-logo.jpg` | Use at its natural 1100×600 ratio on a light surface. Never stretch, recolour, or redraw it. |
| Dark-surface treatment | Same approved primary file | Place the unchanged logo inside a white inset. There is no approved white-on-transparent source asset. |
| Favicon crop | `frontend/public/brand/camp-for-nepal-icon.jpg` | Square crop from the supplied artwork, for favicon-scale use only. |
| Source artwork | `frontend/public/brand/camp-for-nepal-logo-original.jpg` | Preserve as the unmodified supplied source. |

The mark may not sit directly on photography or a dark surface. Header, admin,
customer, and footer layouts all use this shared rule.

**Owner content required — reversed logo.** `BRAND_ASSETS.white` currently points
at the primary file and carries `needsOwnerAsset: true`. There is no white or
transparent lockup in the supplied artwork, and inventing one by knocking out the
background or recolouring the mark is not permitted. Until the owner supplies a
reversed asset, dark bands keep the white-inset treatment.

## Colour

| Ramp | Role |
| --- | --- |
| `primary` 50–900 | Deep forest green. Brand surfaces, headers, footers |
| `sand` 50–900 | Warm parchment. `sand-50` is the page background |
| `amber` 50–900 | Sunset amber. Booking and inquiry CTAs only |
| `glacier` 50–900 | Glacier blue. Info states and quiet accents |
| `stone` 50–900 | Warm gray. All body and heading text |
| `success` / `danger` 50–900 | States only, never decoration |
| `cream` | Card surface, warmer than pure white |
| `hero-overlay-from/to` | Dark gradient over photography |

### Core brand values

The existing palette already matches the approved mark and is retained rather
than replaced. These are the reference values for shared surfaces and actions:

| Role | Token | Value |
| --- | --- | --- |
| Deep Himalayan forest | `primary-700` | `#253d2f` |
| Warm parchment page ground | `sand-50` | `#fbf7f0` |
| Cream surface | `cream` | `#fdfaf4` |
| Accessible sunset-amber action | `amber-600` | `#97470b` |
| Limited glacier information accent | `glacier-600` | `#226485` |
| Primary text | `stone-900` | `#211d19` |

`amber-600` uses white button text and darkens to `amber-700` on hover. These
pairs were contrast checked before the token system was adopted; do not use a
lighter amber as action text on parchment.

### Pairs that are NOT safe

These were computed, not estimated. Do not use them:

| Pair | Ratio | Use instead |
| --- | --- | --- |
| Dark text on `amber-500` | 3.55 | `amber-500` takes white text only |
| `amber-500` as text on `sand-50` | 4.41 | `amber-600` or darker for text |
| `glacier-500` as text on `sand-50` | 4.47 | `glacier-600` or darker |
| `stone-500` on `sand-200` or darker | < 4.5 | Step up to `stone-600` |
| `amber-600` as a focus ring on dark | 2.69 | The ring is `amber-500`, which clears 3:1 everywhere |

The CTA hover must always go **darker** (`amber-600` → `amber-700`).
Brightening it breaks AA.

### Status badge colours

| Status | Tone | Colour |
| --- | --- | --- |
| `booking_open` | success | green — seats available |
| `almost_full` | cta | amber — urgency |
| `guaranteed` | info | glacier blue — confirmed to run |
| `closed` / `draft` / `archived` | neutral | stone grey |
| `cancelled` | danger | red |
| `completed` / `trip_in_progress` | brand | forest green |
| `confirmed` | success | green |
| `pending` / `in_review` | cta | amber |
| `enquiry_received` / `details_confirmed` | info | glacier blue |

### Colour is never the only signal

`success-100` and `primary-100` collapse to ΔE 4.0 under deuteranopia, and
`danger-600` vs `amber-600` collapses to ΔE 3.6. So `StatusBadge` carries a
per-status **icon and a text label** — colour only supports the meaning, it
never carries it.

### Measured contrast

Computed from the built stylesheet on 2026-08-02. Text pairs are held to 4.5:1
(WCAG AA normal text); non-text pairs — focus rings and control borders — to
3:1 (1.4.11).

| Pair | Ratio | Needs |
| --- | --- | --- |
| White on `primary-700` (primary button) | 11.75 | 4.5 |
| White on `amber-600` (CTA button) | 6.52 | 4.5 |
| White on `primary-900` (text on forest) | 17.52 | 4.5 |
| `stone-700` on `sand-50` (body) | 8.57 | 4.5 |
| `stone-600` on `sand-50` (muted) | 5.98 | 4.5 |
| `stone-600` on white (muted on card) | 6.38 | 4.5 |
| `danger-700` on white (form error) | 9.20 | 4.5 |
| `success-700` on `success-100` (badge) | 7.08 | 4.5 |
| `danger-700` on `danger-50` (badge) | 8.44 | 4.5 |
| `amber-500` on `sand-50` (focus ring) | 4.41 | 3.0 |
| `amber-500` on `primary-900` (focus ring) | 3.72 | 3.0 |
| `stone-500` on white (control border) | 5.24 | 3.0 |

Text over photography is not a fixed pair — it depends on the image. It is
handled by the `hero-overlay` gradient rather than by a token, so any new
photographic band must keep that overlay.

Disabled controls use `disabled:opacity-60` on top of an already-passing pair.
Opacity reduces contrast, so a disabled control is deliberately **not** held to
4.5:1: it is non-interactive, and WCAG 1.4.3 exempts inactive controls. Disabled
state is never signalled by colour alone — every disabled control also carries
the `disabled` attribute, which assistive technology announces.

## Type

Fluid where it matters, so nothing overflows a 360px screen.

| Token | Size | Line height | Weight |
| --- | --- | --- | --- |
| `text-display` | clamp 2.5 → 4.5rem | 1.02 | 400 |
| `text-h1` | clamp 2 → 3rem | 1.06 | 500 |
| `text-h2` | clamp 1.625 → 2.125rem | 1.16 | 500 |
| `text-h3` | 1.5rem | 1.28 | 600 |
| `text-h4` | 1.1875rem | 1.4 | 600 |
| `text-body-lg` | 1.1875rem | 1.65 | 400 |
| `text-body` | 1.0625rem | 1.7 | 400 |
| `text-small` | 0.875rem | 1.5 | 500 |
| `text-caption` | 0.8125rem | 1.45 | 500 |
| `text-button` | 0.875rem | 1.2 | 600 |
| `text-nav` | 0.875rem | 1.2 | 500 |

`text-body-lg` is for a lead paragraph or page intro — one step above body, never
large enough to compete with a heading. `text-caption` is for metadata, credits,
and timestamps. `text-button` and `text-nav` share a size so a button beside a
nav link lines up.

Two families, loaded once in `index.html` with `preconnect` and
`font-display=swap`: `Fraunces` (`font-display`) and `Manrope` (`font-sans`).
Both have system fallbacks. Only four weights are requested across both families.

**Where each face is allowed:**

| Surface | Face |
| --- | --- |
| Public display, hero, section and editorial headings | Fraunces |
| Body copy, navigation, buttons, form fields and labels | Manrope |
| **Every heading in `/admin/*` and in form cards** | **Manrope** |
| Tables, dense data, small labels, long paragraphs | Manrope |

**The base layer sets `h1`–`h4` to Fraunces**, so a heading that must be Manrope
needs an explicit `font-sans` — removing `font-display` is not enough, because
there is nothing to remove. Every heading under `frontend/src/components/admin`,
`frontend/src/components/forms`, and `frontend/src/pages/admin` carries `font-sans` for this
reason; the operational UI is dense and functional and reads better in one
family. Verify with:

```sh
grep -rn '<h[1-4]' frontend/src/components/admin frontend/src/components/forms frontend/src/pages/admin | grep -v font-sans
```

That command must return nothing.

## Spacing, radius, shadow

- `--spacing` is `0.25rem`, so `p-1` = 4px and the whole 4px scale is native:
  4, 8, 12, 16, 24, 32, 48, 64, 96, 128
- Radius: `sm` 0.25 · `md` 0.5 · `lg` 0.75 · `xl` 1 · `2xl` 1.5rem
- Shadows are warm-tinted (`rgb(58 47 37 / …)`), never black — a black
  shadow on sand looks cheap. All seven Tailwind steps are redefined
  (`2xs` `xs` `sm` `md` `lg` `xl` `2xl`); leaving any at its default would
  let a black shadow back in
- The `@theme` block is declared `static` so every token is emitted as a CSS
  variable. Without it Tailwind drops tokens no utility class references, and
  anything reading a token at runtime via `var(--…)` silently resolves to nothing
- `max-w-screen-xl` (1280px) for most content
- Section spacing uses the shared `tight` (48/64px), `default` (64/96px), and
  `loose` (96/128px) steps; page-specific spacing should not introduce a new rhythm

## Utilities added on top of Tailwind

`readable-text` (68ch measure) · `hero-overlay` (the photo contrast overlay) ·
`topographic-contours` (subtle hero-only contour lines) ·
`z-base` `z-sticky` `z-header` `z-dropdown` `z-overlay` `z-modal` `z-toast`

## Base components

In `frontend/src/components/common/`: Container, Section, SectionHeader, Button,
Badge, Card, ImageFrame, TrustBadge, StatusBadge, EmptyState, LoadingState,
ErrorState, FormField.

## Native Selects

`FormField` is the shared control for the public, customer, and admin native
selects. The project deliberately preserves native selects: each current list
is short, text-only, and benefits from the operating system's dependable mobile
picker. The component provides the branded closed state, a persistent label,
chevron, 48px minimum height, error and disabled states, visible focus, and
optional `optgroup` rendering. There are no custom listboxes or comboboxes in
V1; richer media metadata uses ordinary labelled fields and native selects.

## Image Frames

`ImageFrame` owns the media ratio, fallback, lazy loading, explicit dimensions,
cover fit, and focal position. Use the named ratios so changing art direction
does not destabilise a card grid.

| Context | Ratio | Rule |
| --- | --- | --- |
| Hero | `hero` (2:1) | Cinematic crop with the protected text area on the left and image focal point to the right by default. |
| Package and destination cards | `landscape` (4:3) | Shared card ratio. |
| Package gallery | `wide` (16:9) | Panoramic supporting photography. |
| Guide | `portrait` (3:4) | Consistent person-first frame. |
| Editorial card and cover | `editorial` (16:9) | Shared article crop. |
| Certificate and permit preview | `document` (1.414:1, A4 landscape) | A document is meant to be read. The 4:3 card frame cropped through the middle of a certificate's text. |
| Square | `square` (1:1) | Avatars and compact marks. |

Use descriptive alt text for content imagery and an empty alt for decorative
hero backgrounds. A missing URL falls back to the local trail image; a missing
image value uses an accessible calm placeholder instead of a broken icon.

`frontend/src/lib/media.js` normalises both legacy gallery strings and richer
media objects. Structured media may provide captions, focal position, public
credits, source URLs, licence URLs, and external video/reel links. Public
gallery components render image items and their approved captions/credits; they
do not invent missing metadata from the source map.

Every frame reserves its space from explicit `width`/`height` plus the aspect
ratio, so nothing shifts as images arrive. `loading="lazy"` is the default and
only a genuine LCP image passes `priority` (the homepage hero, which is
`fetchPriority="high"` and not lazy). `srcSet`/`sizes` pass through for the V2
media library; V1 ships one asset per record, so there are no widths to declare
yet — see BACKEND_HANDOFF.md.

Topic imagery shipped in Final Touch 13 is local, resized JPEG media with its
licence record in `docs/IMAGE_SOURCE_MAP.md`. Data continues to carry the image
path; `ImageFrame` only permits known shipped topic paths and deliberately
falls back for owner-required portraits, certificates, and route maps.

## Motion

CSS-first — no animation library. Tokens in `tokens.css`, the transition
rules in the `@layer components` block of `index.css`, and the components in
`frontend/src/components/motion/`.

| Token | Value | Used by |
| --- | --- | --- |
| `--ease-soft` | `cubic-bezier(0.22, 1, 0.36, 1)` | everything; also the default for every Tailwind transition utility |
| `--duration-fast` | 180ms | optional magnetic settle |
| `--duration-normal` | 300ms | card lift, optional parallax |
| `--duration-slow` | 600ms | reveal, image zoom |
| `--reveal-sm/md/lg` | 8 / 16 / 24px | reveal travel |
| `--lift-y` / `--lift-scale` | -6px / 1.02 | `MotionCard` — the ceiling, never raise |
| `--zoom-scale` | 1.08 | `MotionImage` |
| `--parallax-max` | 12px | opt-in `MouseParallax` |
| `--magnetic-max` | 6px | opt-in `MagneticButton` |

### Components

`Reveal` · `StaggerGroup` · `MotionCard` · `MotionImage` ·
`MagneticButton` · `MouseParallax` · `ScrollProgress`

### The rules that keep it safe

- Only `transform` and `opacity` animate, so motion never shifts layout
- Hover effects sit behind `@media (hover: hover)`, so a tap does not leave a
  phone stuck in a hover state
- `MouseParallax` needs `(min-width: 1024px) and (hover: hover)` and a hero
  must explicitly set `enableParallax: true` — off on mobile, off on touch,
  and off by default
- `MagneticButton` is opt-in and must never sit on a routine booking or form
  action; it is reserved for a single editorial or hero CTA
- `useReveal` triggers on *any* intersection, not a percentage. A percentage
  threshold can never be met by a block taller than the viewport, which would
  leave it invisible forever
- If reduced motion is set, or `IntersectionObserver` is missing, `Reveal`
  renders visible immediately — content can never get stuck hidden
- The reduced-motion block neutralises the inline transitions on
  `MagneticButton` and `MouseParallax` too: author `!important` outranks a
  normal inline style in the cascade
