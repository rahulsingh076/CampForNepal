// One destination: gallery, overview, seasons, map details, and what to book there.
import { Link, useLocation, useParams } from 'react-router-dom'
import GuideCard from '../../components/cards/GuideCard.jsx'
import PackageCard from '../../components/cards/PackageCard.jsx'
import Button from '../../components/common/Button.jsx'
import ErrorState from '../../components/common/ErrorState.jsx'
import PageHeader from '../../components/common/PageHeader.jsx'
import PrintButton from '../../components/common/PrintButton.jsx'
import RecordNotFound from '../../components/common/RecordNotFound.jsx'
import Section from '../../components/common/Section.jsx'
import Reveal from '../../components/motion/Reveal.jsx'
import CustomTripCta from '../../components/sections/CustomTripCta.jsx'
import DestinationFacts from '../../components/sections/DestinationFacts.jsx'
import PublicMediaGallery from '../../components/sections/PublicMediaGallery.jsx'
import RelatedGrid from '../../components/sections/RelatedGrid.jsx'
import useCollection from '../../hooks/useCollection.js'
import usePageMeta from '../../hooks/usePageMeta.js'
import useRecord from '../../hooks/useRecord.js'
import { toPublicGuide } from '../../lib/publicGuide.js'
import { returnTarget } from '../../lib/returnTo.js'
import DetailSkeleton from './DetailSkeleton.jsx'

export default function DestinationDetail() {
  const { slug } = useParams()
  const location = useLocation()
  const { status, item, reload } = useRecord('destinations', slug)
  const languages = useCollection('languages', {})

  usePageMeta(item?.seo?.metaTitle || item?.title, item?.seo?.metaDescription)

  if (status === 'loading') return <DetailSkeleton />

  if (status === 'error') {
    return (
      <Section width="narrow">
        <ErrorState
          title="We could not load this destination"
          description="Something went wrong on our side. Please try again."
          action={<Button onClick={reload}>Try again</Button>}
        />
      </Section>
    )
  }

  if (status === 'notFound' || item?.status !== 'published') {
    return (
      <RecordNotFound
        title="We do not have that destination"
        description="The link may be out of date. Every region we run trips in is listed on the destinations page."
        backLabel="See all destinations"
        backPath="/destinations"
      />
    )
  }

  const resultsPath = returnTarget(location.state?.returnTo, '/destinations')

  return (
    <>
      <PageHeader
        eyebrow={item.region}
        title={item.title}
        description={item.shortDescription}
        breadcrumbs={[
          { label: 'Home', path: '/' },
          { label: 'Destinations', path: resultsPath },
          { label: item.title },
        ]}
      >
        <div className="flex flex-wrap items-center gap-3">
          <PrintButton label="Print destination" className="border-sand-200/40 text-white hover:bg-white/10 hover:text-white" />
          <Link to={resultsPath} className="text-small font-semibold text-amber-300 underline underline-offset-4 hover:text-amber-200">Back to results</Link>
        </div>
      </PageHeader>

      <PublicMediaGallery item={item} ratio="landscape" />

      <Section>
        <div className="grid gap-10 lg:grid-cols-3">
          <Reveal className="lg:col-span-2">
            <h2 className="text-h2 font-display text-stone-900">About {item.title}</h2>
            <div className="mt-6 space-y-4">
              {item.fullDescription.split('\n\n').map((paragraph) => (
                <p key={paragraph.slice(0, 40)} className="readable-text text-body text-stone-700">
                  {paragraph}
                </p>
              ))}
            </div>
          </Reveal>

          <Reveal delay={120}>
            <DestinationFacts item={item} />
          </Reveal>
        </div>
      </Section>

      <RelatedGrid
        heading={`Trips that go to ${item.title}`}
        description="Every itinerary we run in this region."
        entity="packages"
        ids={item.relatedPackageIds}
        card={PackageCard}
        tone="cream"
      />

      <RelatedGrid
        heading="Guides who work this region"
        description="The people who would be with you on the trail."
        entity="guides"
        ids={item.relatedGuideIds}
        card={GuideCard}
        mapItem={toPublicGuide}
        cardProps={{
          languageNames: Object.fromEntries(languages.items.map((row) => [row.code, row.name])),
        }}
      />

      <CustomTripCta message="Not sure which trip suits you? Tell us what you have in mind." />
    </>
  )
}
