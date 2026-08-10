// One trip, shared by /packages/:slug, /trekking/:slug and /expeditions/:slug.
import { useLocation, useParams } from 'react-router-dom'
import Button from '../../components/common/Button.jsx'
import ErrorState from '../../components/common/ErrorState.jsx'
import ImageFrame from '../../components/common/ImageFrame.jsx'
import PrintButton from '../../components/common/PrintButton.jsx'
import RecordNotFound from '../../components/common/RecordNotFound.jsx'
import Section from '../../components/common/Section.jsx'
import SectionHeader from '../../components/common/SectionHeader.jsx'
import StructuredData from '../../components/common/StructuredData.jsx'
import { tripStructuredData } from '../../lib/structuredData.js'
import Reveal from '../../components/motion/Reveal.jsx'
import BookingSummary from '../../components/sections/BookingSummary.jsx'
import PackageCosts from '../../components/sections/PackageCosts.jsx'
import PackageDepartures from '../../components/sections/PackageDepartures.jsx'
import PackageAnchorNav from '../../components/sections/PackageAnchorNav.jsx'
import PackageFaq from '../../components/sections/PackageFaq.jsx'
import PackageFit from '../../components/sections/PackageFit.jsx'
import PackageGearPermits from '../../components/sections/PackageGearPermits.jsx'
import InquiryForm from '../../components/forms/InquiryForm.jsx'
import PackageHero from '../../components/sections/PackageHero.jsx'
import PackageHighlights from '../../components/sections/PackageHighlights.jsx'
import PackageItinerary from '../../components/sections/PackageItinerary.jsx'
import PackageQuickFacts from '../../components/sections/PackageQuickFacts.jsx'
import PackageReviews from '../../components/sections/PackageReviews.jsx'
import SimilarTrips from '../../components/sections/SimilarTrips.jsx'
import usePageMeta from '../../hooks/usePageMeta.js'
import useRecord from '../../hooks/useRecord.js'
import { primaryImageSrc } from '../../lib/media.js'
import { returnTarget } from '../../lib/returnTo.js'
import DetailSkeleton from './DetailSkeleton.jsx'

const DEFAULT_CONTEXT = { label: 'All trips', path: '/packages' }

// A block of page content with its own heading, revealed on scroll.
function Block({ id, title, description, children }) {
  return (
    <Reveal as="section" id={id} className="trip-detail-section mt-16 first:mt-0">
      <SectionHeader title={title} description={description} headingLevel="h2" />
      <div className="mt-8">{children}</div>
    </Reveal>
  )
}

export default function PackageDetail({ context = DEFAULT_CONTEXT }) {
  const { slug } = useParams()
  const location = useLocation()
  const { status, item, reload } = useRecord('packages', slug)

  usePageMeta(item?.seo?.metaTitle || item?.title, item?.seo?.metaDescription, primaryImageSrc(item))
  const structuredData = tripStructuredData(item, { path: location.pathname })

  if (status === 'loading') return <DetailSkeleton />

  if (status === 'error') {
    return (
      <Section width="narrow">
        <ErrorState
          title="We could not load this trip"
          description="Something went wrong on our side. Please try again."
          action={<Button onClick={reload}>Try again</Button>}
        />
      </Section>
    )
  }

  if (status === 'notFound' || item?.status !== 'published') {
    return (
      <RecordNotFound
        title="We do not run that trip"
        description="The link may be out of date. Everything we currently run is listed on the trips page."
        backLabel="See all trips"
        backPath="/packages"
      />
    )
  }

  const showsGear = item.gearList?.length > 0 || item.permits?.length > 0
  const resultsPath = returnTarget(location.state?.returnTo, context.path)
  const hasRouteMap = item.routeMap && !item.routeMap.startsWith('/images/packages/')

  return (
    <>
      <StructuredData data={structuredData} />
      <PackageHero item={item} context={context} returnTo={resultsPath}>
        <PackageQuickFacts item={item} />
      </PackageHero>
      <PackageAnchorNav showsGear={showsGear} />

      {/* pb on mobile reserves room for the fixed booking bar. */}
      <Section className="pb-32 lg:pb-24">
        <div className="grid gap-12 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Block id="overview" title="Overview">
              <div className="space-y-4">
                {item.overview.split('\n\n').map((paragraph) => (
                  <p key={paragraph.slice(0, 40)} className="readable-text text-body text-stone-700">
                    {paragraph}
                  </p>
                ))}
              </div>
            </Block>

            <Block title="Is this trip a good fit?">
              <PackageFit item={item} />
            </Block>

            <Block id="highlights" title="Highlights">
              <PackageHighlights highlights={item.highlights} />
            </Block>

            <Block
              id="itinerary"
              title="Itinerary"
              description={`${item.itinerary.length} stages over ${item.duration.days} days. Open any day for the detail.`}
            >
              <div className="mb-5">
                <PrintButton label="Print detailed itinerary" />
              </div>
              <PackageItinerary itinerary={item.itinerary} walkingPerDay={item.walkingPerDay} />
            </Block>

            <Block title="Route and local context">
              <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
                {hasRouteMap ? (
                  <figure>
                    <ImageFrame src={item.routeMap} ratio="wide" alt={`Route map for ${item.title}`} />
                    <figcaption className="mt-3 text-small text-stone-600">The day-by-day plan sets out the route, overnight stops, and elevation changes.</figcaption>
                  </figure>
                ) : (
                  <div className="flex aspect-video items-center rounded-xl border border-dashed border-stone-300 bg-sand-50 p-6 text-small text-stone-600">
                    A route-map visual is not included in this demo. Use the day-by-day plan for the route and overnight stops.
                  </div>
                )}
                <div className="space-y-4 rounded-xl border border-stone-200 bg-white p-5 text-small text-stone-700">
                  <p><span className="font-semibold text-stone-900">Region:</span> {item.region}</p>
                  <p><span className="font-semibold text-stone-900">Stays:</span> {item.accommodation}</p>
                  <p><span className="font-semibold text-stone-900">Meals:</span> {item.meals}</p>
                </div>
              </div>
            </Block>

            <Block id="includes" title="What is included">
              <PackageCosts includes={item.costIncludes} excludes={item.costExcludes} />
            </Block>

            <Block
              id="dates"
              title="Upcoming departures"
              description="Join a group on a fixed date, or ask us for private dates."
            >
              <PackageDepartures packageId={item.id} packageSlug={item.slug} />
            </Block>

            {showsGear && (
              <Block id="safety-permits" title="Gear, safety and permits">
                <PackageGearPermits gearList={item.gearList} permits={item.permits} />
              </Block>
            )}

            <Block id="faq" title="Common questions">
              <PackageFaq faq={item.faq} />
            </Block>

            <Block id="inquiry" title="Check availability">
              <InquiryForm trip={item} />
            </Block>

            <Block id="reviews" title="What travellers said">
              <PackageReviews packageId={item.id} summary={item.reviewsSummary} />
            </Block>
          </div>

          <div className="lg:col-span-1">
            <BookingSummary item={item} />
          </div>
        </div>
      </Section>

      <SimilarTrips item={item} />
    </>
  )
}
