// Preview scaffolding: shows every text style in the type scale.
import Card from '../../components/common/Card.jsx'

const STEPS = [
  { token: 'text-display', name: 'Display', note: 'Hero headlines only, one per page' },
  { token: 'text-h1', name: 'Heading 1', note: 'Page title' },
  { token: 'text-h2', name: 'Heading 2', note: 'Section title' },
  { token: 'text-h3', name: 'Heading 3', note: 'Card and block title' },
  { token: 'text-h4', name: 'Heading 4', note: 'Small title, list heading' },
]

export default function TypographyPreview() {
  return (
    <div className="space-y-8">
      <Card padding="lg">
        <div className="space-y-6">
          {STEPS.map((step) => (
            <div key={step.token} className="border-b border-stone-200 pb-6 last:border-0 last:pb-0">
              <p className="text-small font-mono text-stone-500">
                {step.token} — {step.note}
              </p>
              <p className={`${step.token} mt-2 font-display text-stone-900`}>
                Trek to the roof of the world
              </p>
            </div>
          ))}

          <div className="border-b border-stone-200 pb-6">
            <p className="text-small font-mono text-stone-500">text-body-lg — lead paragraph, page intro</p>
            <p className="readable-text mt-2 text-body-lg text-stone-700">
              One step above body, for the opening paragraph of an article or a page
              introduction. Never large enough to compete with the heading above it.
            </p>
          </div>

          <div className="border-b border-stone-200 pb-6">
            <p className="text-small font-mono text-stone-500">text-body — default paragraph</p>
            <p className="readable-text mt-2 text-body text-stone-700">
              This paragraph is capped by the readable-text utility so a line never runs
              past a comfortable measure. Long blocks of copy stay easy to scan on a wide
              screen, which is what makes a page feel calm and considered rather than
              cramped and cheap.
            </p>
          </div>

          <div className="border-b border-stone-200 pb-6">
            <p className="text-small font-mono text-stone-500">text-small — hints, secondary detail</p>
            <p className="mt-2 text-small text-stone-600">
              Small text is for hints and secondary detail — never for body copy.
            </p>
          </div>

          <div className="border-b border-stone-200 pb-6">
            <p className="text-small font-mono text-stone-500">text-caption — metadata, credits, timestamps</p>
            <p className="mt-2 text-caption text-stone-600">
              Photograph by the guiding team · Last checked 12 March 2026
            </p>
          </div>

          <div>
            <p className="text-small font-mono text-stone-500">text-button / text-nav — interface roles</p>
            <div className="mt-2 flex flex-wrap items-center gap-4">
              <span className="inline-flex min-h-11 items-center rounded-lg bg-primary-700 px-4 text-button text-white">
                Plan my trip
              </span>
              <span className="text-nav text-stone-700">Destinations</span>
              <span className="text-nav text-stone-700">Fixed departures</span>
            </div>
            <p className="mt-2 text-small text-stone-600">
              Both are 14px so a button beside a nav link lines up, and both are Manrope.
            </p>
          </div>
        </div>
      </Card>

      <Card padding="lg">
        <h3 className="text-h4 font-display text-stone-900">Two families</h3>
        <div className="mt-4 grid gap-6 sm:grid-cols-2">
          <div>
            <p className="text-small font-mono text-stone-500">Fraunces / font-display — headings</p>
            <p className="mt-2 font-display text-h3 text-stone-900">Annapurna Circuit</p>
          </div>
          <div>
            <p className="text-small font-mono text-stone-500">Manrope / font-sans — interface and body</p>
            <p className="mt-2 font-sans text-h3 text-stone-900">Annapurna Circuit</p>
          </div>
        </div>

        <p className="readable-text mt-6 text-small text-stone-600">
          The base layer sets <span className="font-mono">h1</span>–<span className="font-mono">h4</span> to
          Fraunces, so a heading that must be Manrope needs an explicit{' '}
          <span className="font-mono">font-sans</span> — there is no class to remove. Every
          heading in the admin panel and inside a form card carries it: that UI is dense
          and functional, and reads better in one family.
        </p>
      </Card>
    </div>
  )
}
