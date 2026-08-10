// One activity: what it involves, how hard it is, safety, permits, and where to do it.
import { Link, useLocation, useParams } from 'react-router-dom'
import DestinationCard from '../../components/cards/DestinationCard.jsx'
import PackageCard from '../../components/cards/PackageCard.jsx'
import Button from '../../components/common/Button.jsx'
import ErrorState from '../../components/common/ErrorState.jsx'
import PageHeader from '../../components/common/PageHeader.jsx'
import RecordNotFound from '../../components/common/RecordNotFound.jsx'
import Section from '../../components/common/Section.jsx'
import Reveal from '../../components/motion/Reveal.jsx'
import ActivityFacts from '../../components/sections/ActivityFacts.jsx'
import CustomTripCta from '../../components/sections/CustomTripCta.jsx'
import PublicMediaGallery from '../../components/sections/PublicMediaGallery.jsx'
import RelatedGrid from '../../components/sections/RelatedGrid.jsx'
import usePageMeta from '../../hooks/usePageMeta.js'
import useRecord from '../../hooks/useRecord.js'
import { returnTarget } from '../../lib/returnTo.js'
import DetailSkeleton from './DetailSkeleton.jsx'

export default function ActivityDetail() {
  const { slug } = useParams()
  const location = useLocation()
  const { status, item, reload } = useRecord('activities', slug)

  usePageMeta(item?.seo?.metaTitle || item?.title, item?.seo?.metaDescription)

  if (status === 'loading') return <DetailSkeleton />

  if (status === 'error') {
    return (
      <Section width="narrow">
        <ErrorState
          title="We could not load this activity"
          description="Something went wrong on our side. Please try again."
          action={<Button onClick={reload}>Try again</Button>}
        />
      </Section>
    )
  }

  if (status === 'notFound' || item?.status !== 'published') {
    return (
      <RecordNotFound
        title="We do not offer that activity"
        description="The link may be out of date. Everything we run is listed on the things to do page."
        backLabel="See everything you can do"
        backPath="/things-to-do"
      />
    )
  }

  const resultsPath = returnTarget(location.state?.returnTo, '/things-to-do')

  return (
    <>
      <PageHeader
        eyebrow={item.category}
        title={item.title}
        description={item.shortDescription}
        breadcrumbs={[
          { label: 'Home', path: '/' },
          { label: 'Things To Do', path: resultsPath },
          { label: item.title },
        ]}
      >
        <Link to={resultsPath} className="text-small font-semibold text-amber-300 underline underline-offset-4 hover:text-amber-200">Back to results</Link>
      </PageHeader>

      <PublicMediaGallery item={item} className="grid gap-4 lg:grid-cols-2" />

      <Section>
        <div className="grid gap-10 lg:grid-cols-3">
          <Reveal className="lg:col-span-2">
            <div className="space-y-4">
              {item.fullDescription.split('\n\n').map((paragraph) => (
                <p key={paragraph.slice(0, 40)} className="readable-text text-body text-stone-700">
                  {paragraph}
                </p>
              ))}
            </div>

            <h2 className="mt-12 text-h3 font-display text-stone-900">Staying safe</h2>
            <ul className="mt-6 space-y-4">
              {item.safetyNotes.map((note) => (
                <li key={note.slice(0, 40)} className="flex gap-3">
                  <svg className="mt-1 h-5 w-5 shrink-0 text-primary-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
                    <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="readable-text text-body text-stone-700">{note}</span>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={120}>
            <ActivityFacts item={item} />
          </Reveal>
        </div>
      </Section>

      <RelatedGrid
        heading="Where you can do this"
        entity="destinations"
        ids={item.relatedDestinationIds}
        card={DestinationCard}
        tone="cream"
      />

      <RelatedGrid
        heading="Trips that include it"
        entity="packages"
        ids={item.relatedPackageIds}
        card={PackageCard}
      />

      <CustomTripCta message="Want this built into a trip of your own? We can do that." />
    </>
  )
}
