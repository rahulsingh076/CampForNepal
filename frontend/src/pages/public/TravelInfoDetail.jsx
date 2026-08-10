// One travel-information page, set for reading, with its sections as headings.
import { Link, useLocation, useParams } from 'react-router-dom'
import PackageCard from '../../components/cards/PackageCard.jsx'
import Button from '../../components/common/Button.jsx'
import ErrorState from '../../components/common/ErrorState.jsx'
import PageHeader from '../../components/common/PageHeader.jsx'
import RecordNotFound from '../../components/common/RecordNotFound.jsx'
import Section from '../../components/common/Section.jsx'
import Reveal from '../../components/motion/Reveal.jsx'
import ArticleBody from '../../components/sections/ArticleBody.jsx'
import CustomTripCta from '../../components/sections/CustomTripCta.jsx'
import RelatedGrid from '../../components/sections/RelatedGrid.jsx'
import usePageMeta from '../../hooks/usePageMeta.js'
import useRecord from '../../hooks/useRecord.js'
import { formatDate } from '../../lib/formatters.js'
import { returnTarget } from '../../lib/returnTo.js'
import DetailSkeleton from './DetailSkeleton.jsx'

export default function TravelInfoDetail() {
  const { slug } = useParams()
  const location = useLocation()
  const { status, item, reload } = useRecord('travelInfoPages', slug)

  usePageMeta(item?.seo?.metaTitle || item?.title, item?.seo?.metaDescription || item?.summary)

  if (status === 'loading') return <DetailSkeleton />

  if (status === 'error') {
    return (
      <Section width="narrow">
        <ErrorState
          title="We could not load this page"
          description="Something went wrong on our side. Please try again."
          action={<Button onClick={reload}>Try again</Button>}
        />
      </Section>
    )
  }

  if (status === 'notFound' || item?.status !== 'published') {
    return (
      <RecordNotFound
        title="We cannot find that page"
        description="The link may be out of date. Everything practical is listed under travel information."
        backLabel="See travel information"
        backPath="/travel-info"
      />
    )
  }

  const resultsPath = returnTarget(location.state?.returnTo, '/travel-info')

  return (
    <>
      <PageHeader
        eyebrow={item.category.replace(/-/g, ' ')}
        title={item.title}
        description={item.summary}
        breadcrumbs={[
          { label: 'Home', path: '/' },
          { label: 'Travel info', path: resultsPath },
          { label: item.title },
        ]}
      >
        <Link to={resultsPath} className="text-small font-semibold text-amber-300 underline underline-offset-4 hover:text-amber-200">Back to results</Link>
      </PageHeader>

      <Section width="narrow">
        <Reveal>
          <ArticleBody content={item.content} sections={item.sections} />
        </Reveal>

        <p className="mt-12 border-t border-stone-200 pt-6 text-small text-stone-600">
          Last checked {formatDate(item.updatedAt)}. Rules and fees do change — ask us if your
          trip is close.
        </p>
      </Section>

      <RelatedGrid
        heading="Trips this applies to"
        entity="packages"
        ids={item.relatedPackageIds}
        card={PackageCard}
        tone="cream"
      />

      <CustomTripCta message="Still not sure how this applies to your trip? Ask us directly." />
    </>
  )
}
