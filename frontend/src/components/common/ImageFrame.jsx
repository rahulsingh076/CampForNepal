import { isSafeImageUrl } from '../../lib/urlSafety.js'

// Fixed-ratio image holder so cards and galleries stay visually aligned.
// Seed content keeps its intended media URL; this local image prevents a broken
// request from turning a card into a browser error icon in the standalone demo.
export const FALLBACK_IMAGE = '/images/himalayan-trail-fallback.jpg'

const SHIPPED_TOPIC_IMAGE = /^\/(?:images\/(?:activities|blog|destinations|home|packages|travel-updates)|media\/library)\//

function hasShippedTopicImage(src) {
  return Boolean(src && SHIPPED_TOPIC_IMAGE.test(src) && !src.endsWith('-route-map.jpg'))
}

function canRenderImage(src) {
  if (!isSafeImageUrl(src)) return false
  if (!src.startsWith('/images/')) return true
  return src === FALLBACK_IMAGE || hasShippedTopicImage(src)
}

export function resolveImageSrc(src) {
  // Topic imagery shipped with this frontend stays local. Demo records still
  // awaiting owner media, such as portraits, certificates, and route maps,
  // use the calm fallback instead of causing a failed browser request.
  if (!isSafeImageUrl(src)) return FALLBACK_IMAGE
  if (src === FALLBACK_IMAGE || !src.startsWith('/images/')) return src
  if (hasShippedTopicImage(src)) return src
  return FALLBACK_IMAGE
}

export function applyImageFallback(event) {
  const image = event.currentTarget
  if (image.dataset.fallbackApplied) {
    image.hidden = true
    return
  }
  image.dataset.fallbackApplied = 'true'
  image.src = FALLBACK_IMAGE
}

const RATIOS = {
  square: 'aspect-square',
  landscape: 'aspect-landscape',
  wide: 'aspect-video',
  portrait: 'aspect-portrait',
  hero: 'aspect-hero',
  editorial: 'aspect-editorial',
  document: 'aspect-document',
}

const DIMENSIONS = {
  square: { width: 1200, height: 1200 },
  landscape: { width: 1200, height: 900 },
  wide: { width: 1600, height: 900 },
  portrait: { width: 900, height: 1200 },
  hero: { width: 1600, height: 800 },
  editorial: { width: 1600, height: 900 },
  document: { width: 1414, height: 1000 },
}

const RADII = {
  none: '',
  md: 'rounded-lg',
  lg: 'rounded-xl',
}

export default function ImageFrame({
  src,
  alt = '',
  ratio = 'landscape',
  radius = 'lg',
  focalPosition = '50% 50%',
  className = '',
  srcSet,
  sizes,
  priority = false,
}) {
  const dimensions = DIMENSIONS[ratio] || DIMENSIONS.landscape
  const renderImage = canRenderImage(src)
  // V1 ships one asset per record, so there are no width variants to offer.
  // The pass-through is here so the V2 media library can supply a srcSet
  // without touching any call site. `sizes` alone would be a lie without it.
  const responsive = srcSet ? { srcSet, sizes } : {}

  return (
    <div
      className={`relative overflow-hidden bg-sand-200 ${RATIOS[ratio]} ${RADII[radius]} ${className}`}
    >
      {renderImage ? (
        <img
          src={resolveImageSrc(src)}
          {...responsive}
          width={dimensions.width}
          height={dimensions.height}
          alt={alt}
          onError={applyImageFallback}
          className="h-full w-full object-cover"
          style={{ objectPosition: focalPosition }}
          // Only a genuine LCP image should opt out of lazy loading; every
          // other frame on the page stays lazy.
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : undefined}
          decoding="async"
        />
      ) : (
        // No image yet: a calm placeholder rather than a broken image icon.
        // An empty alt means decorative, so the placeholder stays hidden too.
        <div
          className="flex h-full w-full items-center justify-center bg-sand-200"
          role={alt ? 'img' : undefined}
          aria-label={alt || undefined}
          aria-hidden={alt ? undefined : 'true'}
        >
          <svg
            className="h-8 w-8 text-sand-500"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <path d="M3 16l5-5 4 4 3-3 6 6" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <rect x="3" y="4" width="18" height="16" rx="2" />
          </svg>
        </div>
      )}
    </div>
  )
}
