// Token values for the rare cases JavaScript needs them (charts, canvas, inline styles).
// The CSS in src/styles/tokens.css is the source of truth — keep these two in step.

// Colour ramps, listed so previews and future charts can iterate them.
export const colorRamps = {
  primary: 'Deep forest green — brand surfaces, headers, footers',
  sand: 'Warm parchment — page backgrounds',
  amber: 'Sunset amber — booking and inquiry calls to action',
  glacier: 'Glacier blue — info states and quiet accents',
  stone: 'Warm gray — all body and heading text',
  success: 'Confirmed and completed states',
  danger: 'Errors, cancellations, destructive actions',
}

export const rampSteps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]

// Reads a colour token at runtime, e.g. colorToken('primary', 700).
export function colorToken(ramp, step) {
  return `var(--color-${ramp}-${step})`
}

export const textStyles = ['display', 'h1', 'h2', 'h3', 'h4', 'body', 'small']

// The 4px spacing scale. Tailwind's --spacing base is 0.25rem, so step N = N * 4px.
export const spacingScale = [1, 2, 3, 4, 6, 8, 12, 16, 24, 32]

export const radii = ['sm', 'md', 'lg', 'xl', '2xl']

export const shadows = ['2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl']

// Stacking order. Mirrors the --z-* tokens.
export const zIndex = {
  base: 0,
  sticky: 10,
  header: 30,
  dropdown: 40,
  overlay: 50,
  modal: 60,
  toast: 70,
}

// Motion limits from the design rules. These mirror the --duration-*, --lift-*,
// --zoom-*, --parallax-* and --magnetic-* tokens in tokens.css — keep them in step.
export const motion = {
  durationFast: 180,
  durationNormal: 300,
  durationSlow: 600,
  revealDistances: { sm: 8, md: 16, lg: 24 },
  cardLiftPx: -6,
  cardScaleMax: 1.02,
  imageZoomMax: 1.08,
  parallaxMaxPx: 12,
  magneticMaxPx: 6,
}

// Colour pairs that are NOT safe, proven by contrast testing. Do not use these.
export const unsafePairs = [
  'dark text on amber-500 (3.55:1) — amber-500 takes white text only',
  'amber-500 as text on sand-50 (4.41:1) — use amber-600 or darker for text',
  'glacier-500 as text on sand-50 (4.47:1) — use glacier-600 or darker',
  'stone-500 on sand-200 or darker — step up to stone-600',
]
