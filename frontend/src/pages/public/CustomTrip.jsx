// Tell us what you want and we will build it.
import PageHeader from '../../components/common/PageHeader.jsx'
import Section from '../../components/common/Section.jsx'
import TrustBadge from '../../components/common/TrustBadge.jsx'
import CustomTripForm from '../../components/forms/CustomTripForm.jsx'
import Reveal from '../../components/motion/Reveal.jsx'
import usePageMeta from '../../hooks/usePageMeta.js'

const TITLE = 'Plan a custom trip'
const DESCRIPTION =
  'Use the guided form to outline your dates, pace, and budget. It is a browser-only demo with no payment or obligation.'

const PROMISES = [
  {
    icon: 'support',
    label: 'A clear trip brief',
    description: 'Share dates, pace, interests, and budget so you can compare possible routes calmly.',
  },
  {
    icon: 'check',
    label: 'Keep control of the details',
    description:
      'Review and change your preferences before you submit. This preview does not ask for travel documents.',
  },
  {
    icon: 'shield',
    label: 'No payment in this demo',
    description: 'This request is saved only in this browser. Nothing is sent or charged.',
  },
]

export default function CustomTrip() {
  usePageMeta(TITLE, DESCRIPTION)

  return (
    <>
      <PageHeader title={TITLE} description={DESCRIPTION} />

      <Section>
        <div className="grid gap-10 lg:grid-cols-3">
          <Reveal className="lg:col-span-2">
            <CustomTripForm />
          </Reveal>

          <Reveal delay={120}>
            <div className="space-y-6">
              {PROMISES.map((promise) => (
                <TrustBadge
                  key={promise.label}
                  icon={promise.icon}
                  label={promise.label}
                  description={promise.description}
                />
              ))}
            </div>
          </Reveal>
        </div>
      </Section>
    </>
  )
}
