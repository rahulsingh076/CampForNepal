// Maps each CMS section key to the component that renders it. A key with no
// entry here is skipped, so the CMS can never crash the page with a new one.
import { toPublicGuide } from '../lib/publicGuide.js'
import ActivityCard from '../components/cards/ActivityCard.jsx'
import DestinationCard from '../components/cards/DestinationCard.jsx'
import GuideCard from '../components/cards/GuideCard.jsx'
import PackageCard from '../components/cards/PackageCard.jsx'
import PostCard from '../components/cards/PostCard.jsx'
import ReviewCard from '../components/cards/ReviewCard.jsx'
import CertificatesSection from '../components/sections/CertificatesSection.jsx'
import CollectionSection from '../components/sections/CollectionSection.jsx'
import ContactCtaSection from '../components/sections/ContactCtaSection.jsx'
import FixedDeparturesSection from '../components/sections/FixedDeparturesSection.jsx'
import FeaturedReviewsSection from '../components/sections/FeaturedReviewsSection.jsx'
import PostFeedHighlightsSection from '../components/sections/PostFeedHighlightsSection.jsx'
import WhyChooseUs from '../components/sections/WhyChooseUs.jsx'

// Most sections are a picked list in a grid, so they share one component.
const collection = (config) =>
  function CollectionEntry({ section, lookups }) {
    return (
      <CollectionSection
        section={section}
        {...config}
        cardProps={{ ...config.cardProps, ...(config.needsLookups ? lookups : {}) }}
      />
    )
  }

const HOME_SECTIONS = {
  featuredPackages: collection({ entity: 'packages', card: PackageCard, columns: 3 }),

  popularDestinations: collection({
    entity: 'destinations',
    card: DestinationCard,
    filters: { status: 'published' },
    columns: 4,
  }),

  thingsToDo: collection({
    entity: 'activities',
    card: ActivityCard,
    filters: { status: 'published' },
    columns: 4,
  }),

  whyChooseUs: WhyChooseUs,

  fixedDepartures: FixedDeparturesSection,

  meetOurGuides: collection({
    entity: 'guides',
    card: GuideCard,
    filters: { publicProfile: true },
    columns: 3,
    needsLookups: true,
    // Cards only ever see the public projection of a guide.
    mapItem: toPublicGuide,
  }),

  trekkingHighlights: collection({
    entity: 'packages',
    card: PackageCard,
    filters: { type: 'trekking' },
    columns: 3,
  }),

  expeditions: collection({
    entity: 'packages',
    card: PackageCard,
    filters: { type: 'expedition' },
    columns: 3,
  }),

  customerReviews: FeaturedReviewsSection,

  travelUpdates: collection({
    entity: 'travelUpdates',
    card: PostCard,
    filters: { status: 'published' },
    cardProps: { basePath: '/blog' },
    columns: 4,
  }),

  certificatesAndTrust: CertificatesSection,

  blogHighlights: PostFeedHighlightsSection,

  planYourTripCta: ContactCtaSection,
}

export default HOME_SECTIONS
