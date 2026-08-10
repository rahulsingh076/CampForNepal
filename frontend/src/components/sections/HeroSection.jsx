// Full-bleed opening band: imagery, dark overlay, revealed text, gentle parallax.
import { Link } from 'react-router-dom'
import Container from '../common/Container.jsx'
import MouseParallax from '../motion/MouseParallax.jsx'
import Reveal from '../motion/Reveal.jsx'
import { applyImageFallback, resolveImageSrc } from '../common/ImageFrame.jsx'
import { safeInternalPath } from '../../lib/urlSafety.js'

export default function HeroSection({ hero }) {
  if (!hero) return null
  const ContentFrame = hero.enableParallax ? MouseParallax : 'div'
  const trustPoints = hero.trustPoints?.slice(0, 3) || []
  const primaryCtaPath = safeInternalPath(hero.primaryCtaLink)
  const secondaryCtaPath = safeInternalPath(hero.secondaryCtaLink)

  return (
    <section className="on-dark relative isolate overflow-hidden bg-primary-900">
      {/* The photograph sits behind everything; the gradient keeps text legible. */}
      {hero.backgroundImage && (
        <img
          src={resolveImageSrc(hero.backgroundImage)}
          alt={hero.imageAlt || ''}
          aria-hidden={hero.imageAlt ? undefined : 'true'}
          width="1920"
          height="960"
          fetchpriority="high"
          decoding="async"
          onError={applyImageFallback}
          className="absolute inset-0 -z-10 h-full w-full object-cover"
          style={{ objectPosition: hero.focalPosition || '60% 50%' }}
        />
      )}
      <div className="hero-overlay absolute inset-0 -z-10" aria-hidden="true" />
      <div className="topographic-contours pointer-events-none absolute inset-0 -z-10" aria-hidden="true" />

      <ContentFrame className="py-16 sm:py-28 lg:py-36">
        <Container>
          <Reveal distance="lg">
            <h1 className="max-w-3xl font-display text-display text-white">{hero.headline}</h1>
          </Reveal>

          <Reveal distance="lg" delay={120}>
            <p className="readable-text mt-6 text-body text-sand-100">{hero.subheadline}</p>
          </Reveal>

          <Reveal delay={220}>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {hero.primaryCtaLabel && primaryCtaPath && (
                <Link
                  to={primaryCtaPath}
                  className="inline-flex min-h-11 items-center justify-center rounded-lg bg-amber-600 px-6 py-3 text-body font-semibold text-white transition-colors duration-200 hover:bg-amber-700"
                >
                  {hero.primaryCtaLabel}
                </Link>
              )}
              {hero.secondaryCtaLabel && secondaryCtaPath && (
                <Link
                  to={secondaryCtaPath}
                  className="inline-flex min-h-11 items-center justify-center rounded-lg border border-sand-200/40 px-6 py-3 text-body font-semibold text-white transition-colors duration-200 hover:bg-white/10"
                >
                  {hero.secondaryCtaLabel}
                </Link>
              )}
            </div>
          </Reveal>

          {trustPoints.length > 0 && (
            <Reveal delay={320}>
              <ul className="mt-8 grid gap-2 sm:grid-cols-3">
                {trustPoints.map((point) => (
                  <li key={point} className="flex items-start gap-2 text-small text-sand-100">
                    <svg className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                      <path d="M4 12.5l5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {point}
                  </li>
                ))}
              </ul>
            </Reveal>
          )}
        </Container>
      </ContentFrame>
    </section>
  )
}
