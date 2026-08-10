// Keeps the document title, description, canonical URL, and share tags in sync
// with the active route. The same hook works for public and authenticated pages.
import { useEffect } from 'react'
import { BRAND_DESCRIPTION, SITE_NAME, SOCIAL_SHARE_IMAGE } from '../config/siteIdentity.js'
import { NOINDEX_PREFIXES } from '../config/routes.js'
import { isSafeImageUrl } from '../lib/urlSafety.js'

const DEFAULT_DESCRIPTION = BRAND_DESCRIPTION

function findOrCreateMeta(selector, attributes) {
  let tag = document.querySelector(selector)
  if (!tag) {
    tag = document.createElement('meta')
    Object.entries(attributes).forEach(([name, value]) => tag.setAttribute(name, value))
    document.head.appendChild(tag)
  }
  return tag
}

function findOrCreateCanonical() {
  let tag = document.querySelector('link[rel="canonical"]')
  if (!tag) {
    tag = document.createElement('link')
    tag.setAttribute('rel', 'canonical')
    document.head.appendChild(tag)
  }
  return tag
}

function absoluteImageUrl(value) {
  const image = isSafeImageUrl(value) ? value : SOCIAL_SHARE_IMAGE
  return new URL(image, window.location.origin).href
}

export default function usePageMeta(title, description, image) {
  useEffect(() => {
    // Nothing is set until the real title is known, so a detail page does not
    // briefly announce the wrong name while it loads.
    if (!title) return

    const fullTitle = title === SITE_NAME || title.endsWith(`| ${SITE_NAME}`) ? title : `${title} | ${SITE_NAME}`
    const pageDescription = description || DEFAULT_DESCRIPTION
    // Query and hash never identify a different page here, so the canonical
    // URL drops them rather than inviting duplicate-URL indexing of filters.
    const url = `${window.location.origin}${window.location.pathname}`
    const isPrivate = NOINDEX_PREFIXES.some(
      (prefix) => window.location.pathname === prefix || window.location.pathname.startsWith(`${prefix}/`)
    )

    const previousTitle = document.title
    document.title = fullTitle

    const descriptionTag = findOrCreateMeta('meta[name="description"]', { name: 'description' })
    const ogTitle = findOrCreateMeta('meta[property="og:title"]', { property: 'og:title' })
    const ogDescription = findOrCreateMeta('meta[property="og:description"]', { property: 'og:description' })
    const ogUrl = findOrCreateMeta('meta[property="og:url"]', { property: 'og:url' })
    const ogImage = findOrCreateMeta('meta[property="og:image"]', { property: 'og:image' })
    const twitterCard = findOrCreateMeta('meta[name="twitter:card"]', { name: 'twitter:card' })
    const twitterTitle = findOrCreateMeta('meta[name="twitter:title"]', { name: 'twitter:title' })
    const twitterDescription = findOrCreateMeta('meta[name="twitter:description"]', { name: 'twitter:description' })
    const twitterImage = findOrCreateMeta('meta[name="twitter:image"]', { name: 'twitter:image' })
    const robots = findOrCreateMeta('meta[name="robots"]', { name: 'robots' })
    const canonical = findOrCreateCanonical()

    const tags = [descriptionTag, ogTitle, ogDescription, ogUrl, ogImage, twitterCard, twitterTitle, twitterDescription, twitterImage, robots, canonical]
    const previous = tags.map((tag) => tag.getAttribute('content') ?? tag.getAttribute('href'))

    descriptionTag.setAttribute('content', pageDescription)
    ogTitle.setAttribute('content', fullTitle)
    ogDescription.setAttribute('content', pageDescription)
    ogUrl.setAttribute('content', url)
    twitterTitle.setAttribute('content', fullTitle)
    twitterDescription.setAttribute('content', pageDescription)

    // A page without its own photography still shares with the brand image
    // rather than an empty card.
    const shareImage = absoluteImageUrl(image)
    twitterCard.setAttribute('content', 'summary_large_image')
    ogImage.setAttribute('content', shareImage)
    twitterImage.setAttribute('content', shareImage)

    // Sign-in, dashboards, and the design preview must never be indexed, and
    // must not advertise a canonical URL that invites a crawl either.
    robots.setAttribute('content', isPrivate ? 'noindex, nofollow' : 'index, follow')
    if (isPrivate) canonical.removeAttribute('href')
    else canonical.setAttribute('href', url)

    return () => {
      document.title = previousTitle
      tags.forEach((tag, index) => {
        const attribute = tag === canonical ? 'href' : 'content'
        if (previous[index] === null) tag.removeAttribute(attribute)
        else tag.setAttribute(attribute, previous[index])
      })
    }
  }, [title, description, image])
}
