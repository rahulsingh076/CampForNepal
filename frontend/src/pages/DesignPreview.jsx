// Development-only screen showing the design system components and tokens.
import Container from '../components/common/Container.jsx'
import Section from '../components/common/Section.jsx'
import SectionHeader from '../components/common/SectionHeader.jsx'
import ScrollProgress from '../components/motion/ScrollProgress.jsx'
import ButtonsPreview from './design-preview/ButtonsPreview.jsx'
import BrandPreview from './design-preview/BrandPreview.jsx'
import ColorsPreview from './design-preview/ColorsPreview.jsx'
import FeedbackPreview from './design-preview/FeedbackPreview.jsx'
import FormPreview from './design-preview/FormPreview.jsx'
import LocalePreview from './design-preview/LocalePreview.jsx'
import MotionPreview from './design-preview/MotionPreview.jsx'
import SurfacesPreview from './design-preview/SurfacesPreview.jsx'
import TokensPreview from './design-preview/TokensPreview.jsx'
import TypographyPreview from './design-preview/TypographyPreview.jsx'
import usePageMeta from '../hooks/usePageMeta.js'
import NotFound from './NotFound.jsx'

const SECTIONS = [
  { id: 'brand', title: 'Brand', description: 'Approved logo assets and the light surfaces that keep them legible.', Component: BrandPreview },
  { id: 'colour', title: 'Colour', description: 'Every ramp, read straight from the CSS tokens.', Component: ColorsPreview },
  { id: 'typography', title: 'Typography', description: 'Fraunces for restrained headings and Manrope for UI and body copy.', Component: TypographyPreview },
  { id: 'buttons', title: 'Buttons', description: 'Three variants, three sizes, and their states.', Component: ButtonsPreview },
  { id: 'surfaces', title: 'Surfaces', description: 'Cards, image frames, badges, and trust markers.', Component: SurfacesPreview },
  { id: 'forms', title: 'Forms', description: 'Labelled controls with hints and errors.', Component: FormPreview },
  { id: 'feedback', title: 'Feedback', description: 'Loading, empty, and error states.', Component: FeedbackPreview },
  { id: 'tokens', title: 'Other tokens', description: 'Radius, shadow, spacing, and stacking order.', Component: TokensPreview },
  { id: 'motion', title: 'Motion', description: 'Calm reveals, image zooms, and lifts; optional pointer effects stay out of routine flows.', Component: MotionPreview },
  { id: 'locale', title: 'Locale', description: 'Country, language, and currency — and what changes with them.', Component: LocalePreview },
]

export default function DesignPreview() {
  usePageMeta('Design Preview', 'Internal preview of Camp for Nepal design tokens and components.')
  if (!import.meta.env.DEV) return <NotFound />
  return (
    <main id="design-preview-top">
      <ScrollProgress />
      <div className="bg-primary-900 py-16 text-sand-50 sm:py-24">
        <Container>
          <p className="text-small font-semibold uppercase tracking-widest text-amber-300">
            Internal preview
          </p>
          <h1 className="mt-3 font-display text-display text-white">Design system</h1>
          <p className="readable-text mt-6 text-body text-sand-200">
            Every token and base component in one place. This development-only screen
            exists to check the system.
          </p>
          <nav className="mt-8 flex flex-wrap gap-3" aria-label="Preview sections">
            {SECTIONS.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="rounded-full border border-primary-600 px-4 py-2 text-small text-sand-100 transition-colors duration-200 hover:bg-primary-800"
              >
                {section.title}
              </a>
            ))}
          </nav>
        </Container>
      </div>

      {SECTIONS.map((section, index) => {
        const { Component } = section
        return (
          <Section
            key={section.id}
            id={section.id}
            tone={index % 2 === 0 ? 'sand' : 'cream'}
            className="scroll-mt-8"
          >
            <SectionHeader
              eyebrow={String(index + 1).padStart(2, '0')}
              title={section.title}
              description={section.description}
            />
            <div className="mt-10">
              <Component />
            </div>
          </Section>
        )
      })}
    </main>
  )
}
