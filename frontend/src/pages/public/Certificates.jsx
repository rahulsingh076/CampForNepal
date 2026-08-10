// Licences, memberships and insurance — the paperwork behind the promises.
import Button from '../../components/common/Button.jsx'
import Card from '../../components/common/Card.jsx'
import Badge from '../../components/common/Badge.jsx'
import DemoNotice from '../../components/common/DemoNotice.jsx'
import ErrorState from '../../components/common/ErrorState.jsx'
import ImageFrame from '../../components/common/ImageFrame.jsx'
import LoadingState from '../../components/common/LoadingState.jsx'
import PageHeader from '../../components/common/PageHeader.jsx'
import Section from '../../components/common/Section.jsx'
import StaggerGroup from '../../components/motion/StaggerGroup.jsx'
import useCollection from '../../hooks/useCollection.js'
import usePageMeta from '../../hooks/usePageMeta.js'
import useSingleton from '../../hooks/useSingleton.js'
import { formatDate } from '../../lib/formatters.js'

const TITLE = 'Sample certificates'
const DESCRIPTION =
  'Sample certificate records for this browser-only demonstration. They are not official Camp For Nepal evidence.'

export default function Certificates() {
  usePageMeta(TITLE, DESCRIPTION)

  const { status, items, reload } = useCollection('certificates', {
    filters: { status: 'published' },
    sort: 'displayOrder',
    direction: 'asc',
  })
  const settings = useSingleton('siteSettings')
  const demoMode = settings.data?.demoMode !== false

  return (
    <>
      <PageHeader title={TITLE} description={DESCRIPTION} />

      <Section>
        <DemoNotice context="evidence" className="mb-6" />
        {status === 'loading' && <LoadingState rows={6} label="Loading certificates" />}

        {status === 'error' && (
          <ErrorState
            title="We could not load the certificates"
            description="Something went wrong on our side. Please try again."
            action={
              <Button variant="secondary" onClick={reload}>
                Try again
              </Button>
            }
          />
        )}

        {status === 'ready' && (
          <StaggerGroup className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <Card key={item.id} padding="none" className="flex h-full flex-col">
                {/* A document frame, not a trip-card frame: a 4:3 crop cut
                    through the middle of a certificate's text. */}
                <ImageFrame ratio="document" radius="none" src={item.image} alt={item.imageAlt || item.title} focalPosition={item.imageFocalPosition} />

                <div className="flex flex-1 flex-col p-6">
                  {demoMode && <Badge tone="info" size="sm">Sample certificate</Badge>}
                  <h2 className="text-h4 font-display text-stone-900">{item.title}</h2>
                  <p className="mt-1 text-small text-stone-600">{item.issuer}</p>
                  <p className="mt-3 text-small text-stone-700">{item.description}</p>

                  <dl className="mt-auto space-y-1 pt-6 text-small">
                    <div className="flex justify-between gap-4">
                      <dt className="text-stone-600">Issued</dt>
                      <dd className="text-stone-900">{formatDate(item.issuedDate)}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-stone-600">Valid until</dt>
                      <dd className="text-stone-900">
                        {item.expiryDate ? formatDate(item.expiryDate) : 'No expiry'}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-stone-600">{demoMode ? 'Demo reference' : 'Number'}</dt>
                      <dd className="font-mono text-stone-900">{item.registrationNumber}</dd>
                    </div>
                  </dl>

                  <p className="mt-4 border-t border-stone-200 pt-4 text-small text-stone-600">
                    {item.verificationNote}
                  </p>
                </div>
              </Card>
            ))}
          </StaggerGroup>
        )}
      </Section>
    </>
  )
}
