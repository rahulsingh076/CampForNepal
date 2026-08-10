// The practical pages: visas, permits, altitude, packing, insurance.
import { Link, useLocation } from 'react-router-dom'
import Button from '../../components/common/Button.jsx'
import Card from '../../components/common/Card.jsx'
import ErrorState from '../../components/common/ErrorState.jsx'
import LoadingState from '../../components/common/LoadingState.jsx'
import PageHeader from '../../components/common/PageHeader.jsx'
import Section from '../../components/common/Section.jsx'
import SectionHeader from '../../components/common/SectionHeader.jsx'
import Reveal from '../../components/motion/Reveal.jsx'
import StaggerGroup from '../../components/motion/StaggerGroup.jsx'
import useCollection from '../../hooks/useCollection.js'
import usePageMeta from '../../hooks/usePageMeta.js'
import { locationTarget } from '../../lib/returnTo.js'

const TITLE = 'Travel information'
const DESCRIPTION =
  'The practical answers: visas, permits, altitude, what to pack, and what your insurance needs to cover before you fly.'

export default function TravelInfo() {
  usePageMeta(TITLE, DESCRIPTION)
  const location = useLocation()

  const { status, items, reload } = useCollection('travelInfoPages', {
    filters: { status: 'published' },
  })

  // Grouped by category so the page reads as a table of contents.
  const categories = [...new Set(items.map((item) => item.category))].sort()
  const detailState = { returnTo: locationTarget(location) }

  return (
    <>
      <PageHeader title={TITLE} description={DESCRIPTION} />

      <Section>
        {status === 'loading' && <LoadingState rows={6} label="Loading travel information" />}

        {status === 'error' && (
          <ErrorState
            title="We could not load these pages"
            description="Something went wrong on our side. Please try again."
            action={
              <Button variant="secondary" onClick={reload}>
                Try again
              </Button>
            }
          />
        )}

        {status === 'ready' &&
          categories.map((category, index) => (
            <div key={category} className={index > 0 ? 'mt-16' : ''}>
              <Reveal>
                <SectionHeader title={category.replace(/-/g, ' ')} headingLevel="h2" />
              </Reveal>

              <div className="mt-8">
                <StaggerGroup className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {items
                    .filter((item) => item.category === category)
                    .map((item) => (
                      <Card key={item.id} padding="lg" className="flex h-full flex-col">
                        <h3 className="text-h4 font-display text-stone-900">
                          <Link to={`/travel-info/${item.slug}`} state={detailState} className="hover:text-primary-700">
                            {item.title}
                          </Link>
                        </h3>
                        <p className="mt-2 text-small text-stone-700">{item.summary}</p>
                        <Link
                          to={`/travel-info/${item.slug}`}
                          state={detailState}
                          className="mt-auto pt-6 text-small font-semibold text-primary-700 hover:text-primary-800"
                        >
                          Read this
                        </Link>
                      </Card>
                    ))}
                </StaggerGroup>
              </div>
            </div>
          ))}
      </Section>
    </>
  )
}
