// One guide's public profile, plus a request to check their availability.
import { Link, useLocation, useParams } from 'react-router-dom'
import PackageCard from '../../components/cards/PackageCard.jsx'
import Button from '../../components/common/Button.jsx'
import ErrorState from '../../components/common/ErrorState.jsx'
import PageHeader from '../../components/common/PageHeader.jsx'
import RecordNotFound from '../../components/common/RecordNotFound.jsx'
import Section from '../../components/common/Section.jsx'
import SectionHeader from '../../components/common/SectionHeader.jsx'
import GuideAvailabilityForm from '../../components/forms/GuideAvailabilityForm.jsx'
import Reveal from '../../components/motion/Reveal.jsx'
import StaggerGroup from '../../components/motion/StaggerGroup.jsx'
import GuideProfile from '../../components/sections/GuideProfile.jsx'
import GuideReviews from '../../components/sections/GuideReviews.jsx'
import useCollection from '../../hooks/useCollection.js'
import usePageMeta from '../../hooks/usePageMeta.js'
import useRecord from '../../hooks/useRecord.js'
import useSingleton from '../../hooks/useSingleton.js'
import { isPubliclyListed, toPublicGuide } from '../../lib/publicGuide.js'
import { returnTarget } from '../../lib/returnTo.js'
import DetailSkeleton from './DetailSkeleton.jsx'

const NOT_FOUND = {
  title: 'We do not have that guide',
  description:
    'The link may be out of date, or this guide may no longer take public bookings. The whole team is listed on the guides page.',
  backLabel: 'Meet the team',
  backPath: '/guides',
}

export default function GuideDetail() {
  const { slug } = useParams()
  const location = useLocation()
  const record = useRecord('guides', slug)
  const languages = useCollection('languages', {})
  const packages = useCollection('packages', {})
  const settings = useSingleton('siteSettings')
  const demoMode = settings.data?.demoMode !== false

  const guide = record.item && isPubliclyListed(record.item) ? toPublicGuide(record.item) : null

  usePageMeta(guide?.fullName, guide ? `${guide.fullName}, ${guide.guideType} guide.` : undefined)

  if (record.status === 'loading') return <DetailSkeleton />

  if (record.status === 'error') {
    return (
      <Section width="narrow">
        <ErrorState
          title="We could not load this guide"
          description="Something went wrong on our side. Please try again."
          action={<Button onClick={record.reload}>Try again</Button>}
        />
      </Section>
    )
  }

  // A record that exists but is not public is a 404 to a visitor, not an error.
  if (!guide) return <RecordNotFound {...NOT_FOUND} />

  const resultsPath = returnTarget(location.state?.returnTo, '/guides')
  const languageNames = Object.fromEntries(languages.items.map((row) => [row.code, row.name]))

  // Trips in the regions this guide actually works.
  const relatedTrips = packages.items
    .filter((trip) => trip.status === 'published')
    .filter((trip) => guide.regions.some((region) => trip.region?.includes(region.split(' ')[0])))
    .slice(0, 3)

  return (
    <>
      <PageHeader
        eyebrow={demoMode ? 'Sample guide profile' : guide.guideType}
        title={guide.fullName}
        description={`${demoMode ? 'Sample profile: ' : ''}${guide.experienceYears} years guiding in ${guide.regions.join(' and ')}.`}
        breadcrumbs={[
          { label: 'Home', path: '/' },
          { label: 'Our guides', path: resultsPath },
          { label: guide.fullName },
        ]}
      >
        <Link to={resultsPath} className="text-small font-semibold text-amber-300 underline underline-offset-4 hover:text-amber-200">Back to results</Link>
      </PageHeader>

      <Section>
        <GuideProfile guide={guide} languageNames={languageNames} />
      </Section>

      <Section tone="cream">
        <Reveal>
          <SectionHeader title={`What travellers said about ${guide.fullName}`} />
        </Reveal>
        <div className="mt-10">
          <GuideReviews guideId={guide.id} totalReviews={guide.totalReviews} />
        </div>
      </Section>

      {relatedTrips.length > 0 && (
        <Section>
          <Reveal>
            <SectionHeader
              title="Trips in these regions"
              description={`Itineraries ${guide.fullName} knows well.`}
            />
          </Reveal>
          <div className="mt-10">
            <StaggerGroup className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {relatedTrips.map((trip) => (
                <PackageCard key={trip.id} item={trip} />
              ))}
            </StaggerGroup>
          </div>
        </Section>
      )}

      <Section id="guide-request" tone="cream" width="narrow">
        <GuideAvailabilityForm guide={guide} />
      </Section>
    </>
  )
}
