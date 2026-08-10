// Builds JSON-LD from real record values only. Every builder returns null when
// a required field is missing, so a partial record emits nothing rather than a
// half-true claim. Callers must also skip these while demoMode is on.
import { SITE_NAME } from '../config/siteIdentity.js'
import { primaryImageSrc } from './media.js'

const absolute = (path) => (typeof window === 'undefined' ? path : `${window.location.origin}${path}`)

function imageUrl(src) {
  if (!src) return undefined
  return src.startsWith('http') ? src : absolute(src)
}

// A trip page. Rating is included only when there is a real aggregate behind
// it; price is a "from" figure, so it is published as a lowPrice offer.
export function tripStructuredData(record, { path, priceCurrency = 'USD' } = {}) {
  if (!record?.title || !path) return null

  const data = {
    '@context': 'https://schema.org',
    '@type': 'TouristTrip',
    name: record.title,
    url: absolute(path),
  }

  if (record.shortDescription) data.description = record.shortDescription
  const image = primaryImageSrc(record)
  if (image) data.image = imageUrl(image)
  if (record.duration?.days) data.itinerary = { '@type': 'ItemList', numberOfItems: record.duration.days }

  if (typeof record.price === 'number' && record.price > 0) {
    data.offers = {
      '@type': 'Offer',
      price: record.discountPrice ?? record.price,
      priceCurrency,
      availability: 'https://schema.org/InStock',
      url: absolute(path),
    }
  }

  const rating = record.reviewsSummary
  if (rating?.averageRating > 0 && rating?.totalReviews > 0) {
    data.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: rating.averageRating,
      reviewCount: rating.totalReviews,
      bestRating: 5,
      worstRating: 1,
    }
  }

  return data
}

export function articleStructuredData(post, { path } = {}) {
  if (!post?.title || !path || !post.publishedAt) return null

  const data = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    url: absolute(path),
    datePublished: post.publishedAt,
    publisher: { '@type': 'Organization', name: SITE_NAME },
  }

  if (post.excerpt) data.description = post.excerpt
  if (post.author) data.author = { '@type': 'Person', name: post.author }
  if (post.featuredImage) data.image = imageUrl(post.featuredImage)

  return data
}

// The organisation block carries contact details, so it is only built from a
// contactDetails record and skipped entirely when those values are fictional.
export function organisationStructuredData(contact, { siteName = SITE_NAME } = {}) {
  if (!contact?.email && !contact?.phone) return null

  const data = {
    '@context': 'https://schema.org',
    '@type': 'TravelAgency',
    name: siteName,
    url: absolute('/'),
  }

  if (contact.email) data.email = contact.email
  if (contact.phone) data.telephone = contact.phone
  if (contact.addressLines?.length) {
    data.address = { '@type': 'PostalAddress', streetAddress: contact.addressLines.join(', '), addressCountry: 'NP' }
  }

  return data
}
