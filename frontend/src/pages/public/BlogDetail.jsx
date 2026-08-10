// One article, set for reading rather than skimming.
import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import PackageCard from '../../components/cards/PackageCard.jsx'
import Badge from '../../components/common/Badge.jsx'
import Button from '../../components/common/Button.jsx'
import ErrorState from '../../components/common/ErrorState.jsx'
import PageHeader from '../../components/common/PageHeader.jsx'
import RecordNotFound from '../../components/common/RecordNotFound.jsx'
import Section from '../../components/common/Section.jsx'
import StructuredData from '../../components/common/StructuredData.jsx'
import { articleStructuredData } from '../../lib/structuredData.js'
import MotionImage from '../../components/motion/MotionImage.jsx'
import Reveal from '../../components/motion/Reveal.jsx'
import ArticleBody from '../../components/sections/ArticleBody.jsx'
import RelatedGrid from '../../components/sections/RelatedGrid.jsx'
import ShareLinks from '../../components/sections/ShareLinks.jsx'
import usePageMeta from '../../hooks/usePageMeta.js'
import { formatDate } from '../../lib/formatters.js'
import { getItem } from '../../lib/dataClient.js'
import { toFeedPost } from '../../lib/postFeed.js'
import { returnTarget } from '../../lib/returnTo.js'
import DetailSkeleton from './DetailSkeleton.jsx'

export default function BlogDetail() {
  const { slug } = useParams()
  const location = useLocation()
  const [record, setRecord] = useState({ status: 'loading', item: null })

  function load() {
    setRecord({ status: 'loading', item: null })
    Promise.all([getItem('blogPosts', slug), getItem('travelUpdates', slug)]).then(([blogResult, updateResult]) => {
      const match = blogResult.success
        ? toFeedPost(blogResult.data, 'blogPosts')
        : updateResult.success
          ? toFeedPost(updateResult.data, 'travelUpdates')
          : null
      setRecord({ status: match ? 'ready' : 'notFound', item: match })
    }).catch(() => setRecord({ status: 'error', item: null }))
  }

  useEffect(() => {
    load()
  }, [slug])

  const { status, item } = record

  usePageMeta(item?.seo?.metaTitle || item?.title, item?.seo?.metaDescription || item?.excerpt, item?.featuredImage)
  const structuredData = articleStructuredData(item, { path: `/blog/${slug}` })

  if (status === 'loading') return <DetailSkeleton />

  if (status === 'error') {
    return (
      <Section width="narrow">
        <ErrorState
          title="We could not load this article"
          description="Something went wrong on our side. Please try again."
          action={<Button onClick={load}>Try again</Button>}
        />
      </Section>
    )
  }

  if (status === 'notFound' || item?.status !== 'published') {
    return (
      <RecordNotFound
        title="We cannot find that article"
        description="The link may be out of date. Everything we have written is listed on the blog."
        backLabel="Read the blog"
        backPath="/blog"
      />
    )
  }

  const resultsPath = returnTarget(location.state?.returnTo, '/blog')

  return (
    <>
      <StructuredData data={structuredData} />
      <PageHeader
        title={item.title}
        description={item.excerpt}
        breadcrumbs={[
          { label: 'Home', path: '/' },
          { label: 'Blog', path: resultsPath },
          { label: item.title },
        ]}
      >
        <div className="flex flex-wrap items-center gap-3">
          <Badge tone="cta">{item.contentTypeLabel || item.category}</Badge>
          <span className="text-small text-sand-200">
            {item.author} · {formatDate(item.publishedAt)}{item.readingMinutes ? ` · ${item.readingMinutes} minute read` : ''}
          </span>
          <Link to={resultsPath} className="text-small font-semibold text-amber-300 underline underline-offset-4 hover:text-amber-200">Back to results</Link>
        </div>
      </PageHeader>

      <Section width="narrow">
        <Reveal>
          <MotionImage ratio="editorial" src={item.featuredImage} alt={item.featuredImageAlt || item.title} focalPosition={item.featuredImageFocalPosition} />
        </Reveal>

        <Reveal delay={100} className="mt-12">
          <ArticleBody content={item.content} />
        </Reveal>

        <div className="mt-12">
          <ShareLinks title={item.title} />
        </div>
      </Section>

      <RelatedGrid
        heading="Trips this article is about"
        entity="packages"
        ids={item.relatedPackageIds}
        card={PackageCard}
        tone="cream"
      />
    </>
  )
}
