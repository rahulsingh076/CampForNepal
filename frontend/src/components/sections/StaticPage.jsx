import ArticleBody from './ArticleBody.jsx'
import PageHeader from '../common/PageHeader.jsx'
import RecordNotFound from '../common/RecordNotFound.jsx'
import Section from '../common/Section.jsx'
import LoadingState from '../common/LoadingState.jsx'
import ErrorState from '../common/ErrorState.jsx'
import Button from '../common/Button.jsx'
import usePageMeta from '../../hooks/usePageMeta.js'
import useSingleton from '../../hooks/useSingleton.js'
import { formatDate } from '../../lib/formatters.js'

const PATHS = {
  about: { path: '/about', label: 'About us' },
  privacy: { path: '/privacy-policy', label: 'Privacy Policy' },
  terms: { path: '/terms-and-conditions', label: 'Terms and Conditions' },
  cancellation: { path: '/cancellation-policy', label: 'Cancellation Policy' },
}

// One renderer keeps the editable policy pages consistent and ensures draft
// copy has no public URL, even when someone knows it exists in the CMS.
export default function StaticPage({ pageKey }) {
  const pages = useSingleton('sitePages')
  const item = pages.data?.pages?.find((page) => page.key === pageKey)
  const fallback = PATHS[pageKey] || PATHS.about
  usePageMeta(item?.title || fallback.label, item?.intro)

  if (pages.status === 'loading') return <Section width="narrow"><LoadingState rows={5} label="Loading page" /></Section>
  if (pages.status === 'error') return <Section width="narrow"><ErrorState title="We could not load this page" description="Please try again." action={<Button onClick={pages.reload}>Try again</Button>} /></Section>
  if (!item || item.status !== 'published') return <RecordNotFound title="We cannot find that page" description="The page may no longer be published." backLabel="Go home" backPath="/" />

  return <>
    <PageHeader title={item.headline || item.title} description={item.intro} />
    <Section width="narrow">
      {item.updatedAt && (
        <p className="mb-6 text-small text-stone-600">
          {item.isDemo ? 'Demo content last updated' : 'Last updated'} {formatDate(item.updatedAt)}.
        </p>
      )}
      <ArticleBody sections={item.sections || []} />
    </Section>
  </>
}
