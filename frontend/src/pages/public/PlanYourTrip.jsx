// How planning works, when to come, what it costs, and where to start.
import { useEffect, useState } from 'react'
import Button from '../../components/common/Button.jsx'
import Card from '../../components/common/Card.jsx'
import ErrorState from '../../components/common/ErrorState.jsx'
import LoadingState from '../../components/common/LoadingState.jsx'
import PageHeader from '../../components/common/PageHeader.jsx'
import Section from '../../components/common/Section.jsx'
import SectionHeader from '../../components/common/SectionHeader.jsx'
import Reveal from '../../components/motion/Reveal.jsx'
import StaggerGroup from '../../components/motion/StaggerGroup.jsx'
import usePageMeta from '../../hooks/usePageMeta.js'
import { getSingleton } from '../../lib/dataClient.js'

export default function PlanYourTrip() {
  const [page, setPage] = useState({ status: 'loading', data: null })

  usePageMeta('Plan your trip', page.data?.intro)

  useEffect(() => {
    let active = true
    getSingleton('planYourTripPage').then((result) => {
      if (active) setPage({ status: result.success ? 'ready' : 'error', data: result.data })
    })
    return () => {
      active = false
    }
  }, [])

  if (page.status === 'loading') {
    return (
      <Section width="narrow">
        <LoadingState rows={6} label="Loading planning notes" />
      </Section>
    )
  }

  if (page.status === 'error') {
    return (
      <Section width="narrow">
        <ErrorState
          title="We could not open the planning notes"
          description="No trip details were changed. You can try again or browse the available trips instead."
          action={<Button href="/packages" variant="secondary">Browse trips</Button>}
        />
      </Section>
    )
  }

  const plan = page.data

  return (
    <>
      <PageHeader title={plan.headline} description={plan.intro}>
        <Button href="/custom-trip" size="lg">
          Plan My Trip
        </Button>
      </PageHeader>

      <Section>
        <Reveal>
          <SectionHeader title="How it works" />
        </Reveal>

        <div className="mt-10">
          <StaggerGroup className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {plan.steps.map((step, index) => (
              <Card key={step.title} padding="lg" className="h-full">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-50 text-body font-semibold text-primary-800">
                  {index + 1}
                </span>
                <h3 className="mt-4 text-h4 font-display text-stone-900">{step.title}</h3>
                <p className="mt-2 text-small text-stone-700">{step.body}</p>
              </Card>
            ))}
          </StaggerGroup>
        </div>
      </Section>

      <Section tone="cream">
        <Reveal>
          <SectionHeader
            title="When to come"
            description="Nepal has two great seasons and two that suit particular trips."
          />
        </Reveal>

        <div className="mt-10">
          <StaggerGroup className="grid gap-6 sm:grid-cols-2">
            {plan.seasonHints.map((hint) => (
              <Card key={hint.season} padding="lg" className="h-full">
                <h3 className="text-h4 font-display text-stone-900">{hint.season}</h3>
                <p className="mt-2 text-body text-stone-700">{hint.body}</p>
              </Card>
            ))}
          </StaggerGroup>
        </div>
      </Section>

      <Section>
        <Reveal>
          <SectionHeader
            title="What it costs"
            description="Rough bands, per person, so you can see where your trip is likely to sit."
          />
        </Reveal>

        <div className="mt-10">
          <StaggerGroup className="grid gap-6 sm:grid-cols-2">
            {plan.budgetHints.map((hint) => (
              <Card key={hint.band} padding="lg" className="h-full">
                <h3 className="text-h4 font-display text-stone-900">{hint.band}</h3>
                <p className="mt-2 text-body text-stone-700">{hint.body}</p>
              </Card>
            ))}
          </StaggerGroup>
        </div>

        <p className="readable-text mt-8 text-small text-stone-600">{plan.reassurance}</p>
      </Section>

      <Section tone="primary" spacing="tight">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-body text-sand-100">
            Ready to start? Tell us roughly what you have in mind.
          </p>
          <Button href="/custom-trip">Plan a custom trip</Button>
        </div>
      </Section>
    </>
  )
}
