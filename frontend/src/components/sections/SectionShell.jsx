// Every homepage section looks the same from the outside: heading, revealed
// content, a CTA, and honest loading, empty and error states.
import { Link } from 'react-router-dom'
import Button from '../common/Button.jsx'
import EmptyState from '../common/EmptyState.jsx'
import ErrorState from '../common/ErrorState.jsx'
import LoadingState from '../common/LoadingState.jsx'
import Section from '../common/Section.jsx'
import SectionHeader from '../common/SectionHeader.jsx'
import Reveal from '../motion/Reveal.jsx'
import DemoNotice from '../common/DemoNotice.jsx'
import { safeInternalPath } from '../../lib/urlSafety.js'

export default function SectionShell({
  section,
  tone = 'sand',
  spacing = 'default',
  status = 'ready',
  isEmpty = false,
  onRetry,
  emptyTitle = 'Nothing to show here yet',
  children,
}) {
  const ctaPath = safeInternalPath(section.ctaLink)
  return (
    <Section tone={section.tone || tone} spacing={section.spacing || spacing}>
      <Reveal>
        <SectionHeader
          eyebrow={section.eyebrow}
          title={section.heading}
          description={section.subtext}
          onDark={(section.tone || tone) === 'primary'}
        />
      </Reveal>

      <div className="mt-10">
        {status === 'loading' && <LoadingState rows={4} label={`Loading ${section.heading}`} />}

        {status === 'error' && (
          <ErrorState
            title="We could not load this section"
            description="Something went wrong on our side. The rest of the page is fine."
            action={
              onRetry ? (
                <Button variant="secondary" onClick={onRetry}>
                  Try again
                </Button>
              ) : null
            }
          />
        )}

        {status === 'ready' && isEmpty && <EmptyState title={emptyTitle} />}

        {status === 'ready' && !isEmpty && (
          <>
            {section.demoNotice && <DemoNotice context={section.demoNotice} className="mb-6" />}
            {children}
          </>
        )}
      </div>

      {section.ctaLabel && ctaPath && status === 'ready' && !isEmpty && (
        <Reveal className="mt-10">
          <Link
            to={ctaPath}
            className={`inline-flex items-center gap-2 text-body font-semibold transition-colors duration-200 ${
              (section.tone || tone) === 'primary'
                ? 'text-amber-300 hover:text-amber-200'
                : 'text-primary-700 hover:text-primary-800'
            }`}
          >
            {section.ctaLabel}
            <span aria-hidden="true">→</span>
          </Link>
        </Reveal>
      )}
    </Section>
  )
}
