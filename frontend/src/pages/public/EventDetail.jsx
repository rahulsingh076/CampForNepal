import { Link, useParams } from 'react-router-dom'
import PackageCard from '../../components/cards/PackageCard.jsx'
import DestinationCard from '../../components/cards/DestinationCard.jsx'
import Badge from '../../components/common/Badge.jsx'
import Button from '../../components/common/Button.jsx'
import ErrorState from '../../components/common/ErrorState.jsx'
import ImageFrame from '../../components/common/ImageFrame.jsx'
import PageHeader from '../../components/common/PageHeader.jsx'
import PrintButton from '../../components/common/PrintButton.jsx'
import RecordNotFound from '../../components/common/RecordNotFound.jsx'
import Section from '../../components/common/Section.jsx'
import Reveal from '../../components/motion/Reveal.jsx'
import CustomTripCta from '../../components/sections/CustomTripCta.jsx'
import PublicMediaGallery from '../../components/sections/PublicMediaGallery.jsx'
import RelatedGrid from '../../components/sections/RelatedGrid.jsx'
import usePageMeta from '../../hooks/usePageMeta.js'
import useRecord from '../../hooks/useRecord.js'
import { formatDate } from '../../lib/formatters.js'
import { primaryImageMedia } from '../../lib/media.js'
import { isSafeExternalUrl } from '../../lib/urlSafety.js'
import DetailSkeleton from './DetailSkeleton.jsx'

export default function EventDetail() {
  const { slug } = useParams()
  const { status, item, reload } = useRecord('events', slug)
  const image = primaryImageMedia(item)

  usePageMeta(item?.seo?.metaTitle || item?.title, item?.seo?.metaDescription || item?.shortDescription, image.imageSrc)

  if (status === 'loading') return <DetailSkeleton />
  if (status === 'error') {
    return (
      <Section width="narrow">
        <ErrorState title="We could not load this event" description="Something went wrong on our side. Please try again." action={<Button onClick={reload}>Try again</Button>} />
      </Section>
    )
  }
  if (status === 'notFound' || !['published', 'cancelled', 'completed'].includes(item?.status)) {
    return <RecordNotFound title="We cannot find that event" description="The link may be out of date. Public events are listed on the events page." backLabel="See events" backPath="/events" />
  }

  return (
    <>
      <PageHeader
        eyebrow={item.eventType?.replace(/_/g, ' ')}
        title={item.title}
        description={item.shortDescription}
        breadcrumbs={[
          { label: 'Home', path: '/' },
          { label: 'Events', path: '/events' },
          { label: item.title },
        ]}
      >
        <div className="flex flex-wrap items-center gap-3">
          <Badge tone={item.status === 'cancelled' ? 'danger' : item.status === 'completed' ? 'neutral' : 'cta'}>{item.status}</Badge>
          <PrintButton label="Print event details" className="border-sand-200/40 text-white hover:bg-white/10 hover:text-white" />
          <Link to="/events" className="text-small font-semibold text-amber-300 underline underline-offset-4 hover:text-amber-200">Back to events</Link>
        </div>
      </PageHeader>

      {image.imageSrc && (
        <div className="bg-sand-100 py-10">
          <Section className="py-0">
            <ImageFrame src={image.imageSrc} alt={image.alt || item.title} focalPosition={image.focalPosition} ratio="hero" />
          </Section>
        </div>
      )}

      <PublicMediaGallery item={item} />

      <Section>
        <div className="grid gap-10 lg:grid-cols-3">
          <Reveal className="lg:col-span-2">
            <div className="space-y-4">
              {item.fullDescription.split('\n\n').map((paragraph) => (
                <p key={paragraph.slice(0, 40)} className="readable-text text-body text-stone-700">{paragraph}</p>
              ))}
            </div>
          </Reveal>

          <Reveal delay={120}>
            <aside className="border border-stone-200 bg-white p-5 shadow-sm">
              <h2 className="text-h4 font-sans text-stone-900">Event details</h2>
              <dl className="mt-5 space-y-4 text-small text-stone-700">
                <div><dt className="font-semibold text-stone-900">Starts</dt><dd>{formatDate(item.startDateTime, { short: true })}</dd></div>
                {item.endDateTime && <div><dt className="font-semibold text-stone-900">Ends</dt><dd>{formatDate(item.endDateTime, { short: true })}</dd></div>}
                <div><dt className="font-semibold text-stone-900">Timezone</dt><dd>{item.timezone}</dd></div>
                <div><dt className="font-semibold text-stone-900">Venue</dt><dd>{item.venueName || 'To be confirmed'}</dd></div>
                <div><dt className="font-semibold text-stone-900">Location</dt><dd>{item.address || 'To be confirmed'}</dd></div>
              </dl>
              {item.mapLink && <a href={item.mapLink} target="_blank" rel="noreferrer" className="mt-5 inline-flex text-small font-semibold text-primary-800 underline underline-offset-4">Open map</a>}
              {item.ctaLink && (
                <div className="mt-6">
                  {isSafeExternalUrl(item.ctaLink) ? (
                    <a href={item.ctaLink} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary-700 px-4 py-2 text-small font-semibold text-white hover:bg-primary-800">{item.ctaLabel || 'Contact us'}</a>
                  ) : (
                    <Link to={item.ctaLink} className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary-700 px-4 py-2 text-small font-semibold text-white hover:bg-primary-800">{item.ctaLabel || 'Contact us'}</Link>
                  )}
                </div>
              )}
            </aside>
          </Reveal>
        </div>
      </Section>

      <RelatedGrid heading="Related trips" entity="packages" ids={item.relatedPackageIds} card={PackageCard} tone="cream" />
      <RelatedGrid heading="Related places" entity="destinations" ids={item.relatedDestinationIds} card={DestinationCard} />
      <CustomTripCta message="Questions about this event or travel window? Tell us what you need." />
    </>
  )
}
