// The lead article: wider, calmer, and given room to breathe.
import { Link, useLocation } from 'react-router-dom'
import { formatDate } from '../../lib/formatters.js'
import { locationTarget } from '../../lib/returnTo.js'
import Badge from '../common/Badge.jsx'
import MotionImage from '../motion/MotionImage.jsx'
import Reveal from '../motion/Reveal.jsx'

export default function FeaturedPost({ post }) {
  const location = useLocation()
  const detailState = location.pathname === '/blog' ? { returnTo: locationTarget(location) } : undefined

  return (
    <Reveal>
      <article className="grid items-center gap-8 lg:grid-cols-2">
        <Link to={`/blog/${post.slug}`} state={detailState} className="block">
          <MotionImage ratio="landscape" src={post.featuredImage} alt={post.title} />
        </Link>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="cta">Latest</Badge>
            <Badge tone="neutral">{post.contentTypeLabel || post.category}</Badge>
            <span className="text-small text-stone-500">{formatDate(post.publishedAt)}</span>
          </div>

          <h2 className="mt-4 text-h2 font-display text-stone-900">
            <Link to={`/blog/${post.slug}`} state={detailState} className="hover:text-primary-700">
              {post.title}
            </Link>
          </h2>

          <p className="readable-text mt-4 text-body text-stone-700">{post.excerpt || post.summary}</p>

          <p className="mt-4 text-small text-stone-600">
            {post.author} · {post.readingMinutes} minute read
          </p>

          <Link
            to={`/blog/${post.slug}`}
            state={detailState}
            className="mt-6 inline-flex items-center gap-2 text-body font-semibold text-primary-700 hover:text-primary-800"
          >
            Read the article
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </article>
    </Reveal>
  )
}
