// Preview scaffolding: every motion component, with its limit written next to it.
import Button from '../../components/common/Button.jsx'
import Card from '../../components/common/Card.jsx'
import MagneticButton from '../../components/motion/MagneticButton.jsx'
import MotionCard from '../../components/motion/MotionCard.jsx'
import MotionImage from '../../components/motion/MotionImage.jsx'
import MouseParallax from '../../components/motion/MouseParallax.jsx'
import Reveal from '../../components/motion/Reveal.jsx'
import StaggerGroup from '../../components/motion/StaggerGroup.jsx'

const DISTANCES = ['sm', 'md', 'lg']
const STAGGER_ITEMS = ['Everest region', 'Annapurna region', 'Langtang region']

export default function MotionPreview() {
  return (
    <div className="space-y-8">
      <Card padding="lg">
        <h3 className="text-h4 font-display text-stone-900">Reveal</h3>
        <p className="mt-2 text-small text-stone-600">
          Fade plus a small upward drift, once, when the block scrolls in. Three
          distances: 8, 16, and 24px.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {DISTANCES.map((distance) => (
            <Reveal key={distance} distance={distance}>
              <div className="rounded-lg bg-sand-100 p-6 text-center">
                <p className="font-mono text-small text-stone-700">distance {distance}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Card>

      <Card padding="lg">
        <h3 className="text-h4 font-display text-stone-900">StaggerGroup</h3>
        <p className="mt-2 text-small text-stone-600">
          The same reveal, 90ms apart, so a row of cards arrives in sequence.
        </p>
        <StaggerGroup className="mt-6 grid gap-4 sm:grid-cols-3">
          {STAGGER_ITEMS.map((item) => (
            <div key={item} className="h-full rounded-lg bg-primary-50 p-6">
              <p className="text-body font-semibold text-primary-800">{item}</p>
            </div>
          ))}
        </StaggerGroup>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card padding="lg">
          <h3 className="text-h4 font-display text-stone-900">MotionCard</h3>
          <p className="mt-2 text-small text-stone-600">
            Hover lift, capped at -6px and scale 1.02. Tab to it — focus lifts it too.
          </p>
          <div className="mt-6">
            <MotionCard padding="lg">
              <p className="text-body font-semibold text-stone-900">Hover or focus me</p>
              <p className="mt-2 text-small text-stone-600">
                The shadow deepens as the card rises.
              </p>
              <div className="mt-4">
                <Button size="sm" variant="secondary">
                  Focusable child
                </Button>
              </div>
            </MotionCard>
          </div>
        </Card>

        <Card padding="lg">
          <h3 className="text-h4 font-display text-stone-900">MotionImage</h3>
          <p className="mt-2 text-small text-stone-600">
            Hover zoom capped at scale 1.08 over 600ms, clipped by the frame. With no
            photography loaded yet, the placeholder itself zooms so the effect is
            still visible.
          </p>
          <div className="mt-6">
            <MotionImage ratio="wide" alt="Zoom demonstration placeholder" />
          </div>
        </Card>
      </div>

      <Card padding="lg">
        <h3 className="text-h4 font-display text-stone-900">MagneticButton</h3>
        <p className="mt-2 text-small text-stone-600">
          An opt-in hero or editorial CTA can lean up to 6px toward a precise pointer.
          It is never used in routine booking or form flows.
        </p>
        <div className="mt-6">
          <MagneticButton>
            <Button>Check availability</Button>
          </MagneticButton>
        </div>
      </Card>

      <Card padding="none" className="overflow-hidden">
        <MouseParallax className="bg-primary-900 px-6 py-16">
          <div className="text-center">
            <h3 className="text-h3 font-display text-white">MouseParallax</h3>
            <p className="mx-auto mt-3 max-w-md text-small text-sand-200">
              Opt-in hero content can drift up to 12px. It is off below 1024px, off
              for touch, and off for reduced motion.
            </p>
          </div>
        </MouseParallax>
      </Card>

      <Card padding="lg">
        <h3 className="text-h4 font-display text-stone-900">ScrollProgress</h3>
        <p className="mt-2 text-small text-stone-600">
          Already running — the amber bar pinned to the very top of this page fills as
          you scroll. It is marked decorative, so screen readers skip it.
        </p>
      </Card>
    </div>
  )
}
