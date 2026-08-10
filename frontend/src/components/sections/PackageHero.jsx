// Trip hero: breadcrumbs, title, badges, and the gallery strip beneath.
import { Link } from 'react-router-dom'
import { humanizeCode } from '../../lib/displayLabels.js'
import Badge from '../common/Badge.jsx'
import PageHeader from '../common/PageHeader.jsx'
import PrintButton from '../common/PrintButton.jsx'
import PublicMediaGallery from './PublicMediaGallery.jsx'

export default function PackageHero({ item, context, returnTo, children }) {
  return (
    <>
      <PageHeader
        title={item.title}
        description={item.shortDescription}
        breadcrumbs={[
          { label: 'Home', path: '/' },
          { label: context.label, path: returnTo || context.path },
          { label: item.title },
        ]}
      >
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="cta">{humanizeCode(item.type)}</Badge>
          <Badge tone="info">{item.region}</Badge>
          {returnTo && (
            <Link to={returnTo} className="ml-1 text-small font-semibold text-amber-300 underline underline-offset-4 hover:text-amber-200">
              Back to results
            </Link>
          )}
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <a
            href="#inquiry"
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-amber-600 px-6 py-3 text-body font-semibold text-white transition-colors duration-200 hover:bg-amber-700"
          >
            Check Availability
          </a>
          <Link
            to="/contact"
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-sand-200/40 px-6 py-3 text-body font-semibold text-white transition-colors duration-200 hover:bg-white/10"
          >
            Talk to a Trip Expert
          </Link>
          <PrintButton label="Print Package" className="border-sand-200/40 px-6 py-3 text-body text-white hover:bg-white/10 hover:text-white" />
        </div>
        <p className="mt-4 text-small text-sand-200">Availability is checked before confirmation. No payment is processed in this demo.</p>
      </PageHeader>

      {children}

      <PublicMediaGallery item={item} fallbackCaptions={item.highlights?.map((highlight) => `On this route: ${highlight}`)} />
    </>
  )
}
