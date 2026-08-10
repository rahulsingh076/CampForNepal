// One-off content migrations for the localStorage overlay.
//
// These are deliberately non-destructive: a value is replaced only when it is
// still character-for-character an old demo default, so a real CMS edit is
// never overwritten. Nothing here deletes a key or drops a collection.
import { COLLECTIONS, SINGLETONS } from './entities.js'
import { normalizeBookingStatus } from '../config/bookingStatuses.js'

// These exact strings were earlier demo defaults. Updating only an exact match
// lets the safer copy reach existing demo sessions without replacing CMS edits.
const LEGACY_DEMO_COPY = {
  footer: {
    contactHeading: 'Talk with the Kathmandu team',
    contactBody: 'Questions about a route, fitness, or dates? Speak with the people who will organise the trip.',
    newsletterHeading: 'Trail notes, four times a year',
    newsletterSubtext: 'One short email at the start of each season: permit changes, honest weather outlooks for the passes, and the departures that still have space. No noise, and you can leave any time.',
    copyrightLine: '© 2026 Camp for Nepal Treks and Expeditions Pvt. Ltd., Thamel, Kathmandu. Licensed by the Government of Nepal, Department of Tourism. Demonstration site — all contact details are fictional.',
  },
  contact: {
    tagline: 'Himalayan treks, peak climbs and cultural journeys, run from Kathmandu by Nepali mountain people.',
    officeHours: 'Sunday to Friday, 9:00 to 18:00 Nepal Time (GMT+5:45). Closed Saturdays and on Nepali public holidays. The emergency line is answered 24 hours a day while any of our groups are on the trail.',
  },
  footerFinalTouch: {
    contactBody: 'This is a demo contact panel. Use the route details to compare options, or record a question in the browser; no message is transmitted.',
    newsletterHeading: 'Planning notes, shown as a demo',
    newsletterSubtext: 'Sample seasonal questions for permits, weather, and dates. Check current information directly before making travel plans.',
    trustStatement: 'This frontend-only demonstration uses sample records. Confirm current dates, availability, travel requirements, and booking details directly before making plans.',
  },
  planYourTrip: {
    headline: 'How planning a trip with us actually works',
    intro: 'No payment request to talk to us, no pressure, and no itinerary until we understand what you actually want. Here is the whole process.',
    steps: [
      { title: 'Tell us roughly what you want', body: 'A sentence is enough to start. Where you are drawn to, how long you have, and how hard you want to work.' },
      { title: 'We come back with a draft', body: 'Usually within one working day, with a day-by-day plan, an honest difficulty rating, and what it will cost.' },
      { title: 'We change it until it fits', body: 'Most trips go through two or three revisions. Slower, shorter, a different valley, an extra rest day — all normal.' },
      { title: 'You confirm, we handle the rest', body: 'Permits, domestic flights, lodges and your guide. You bring your passport and your boots.' },
    ],
    reassurance: 'Nothing on this page is a quote and nothing here is charged. Prices are in US dollars and confirmed in writing before anything is booked.',
  },
}

const LEGACY_CERTIFICATE_COPY = {
  'cert-001': {
    title: 'Trekking Agency Licence',
    issuer: 'Government of Nepal, Ministry of Culture, Tourism and Civil Aviation',
    description: 'The licence that permits us to organise trekking in Nepal and to apply for trekking permits on behalf of our clients. It is renewed on a fixed cycle and audited against our staffing and insurance records.',
    verificationNote: 'The licence number can be checked against the Department of Tourism register in Bhrikutimandap, Kathmandu.',
  },
  'cert-002': {
    title: 'Nepal Tourism Board Registration',
    issuer: 'Nepal Tourism Board',
    description: 'Registration with the national tourism authority, which lists us as a recognised inbound operator and holds our company records, tax registration, and the details of our licensed guiding staff.',
    verificationNote: 'Registered operators are listed publicly by the Nepal Tourism Board.',
  },
  'cert-003': {
    title: 'TAAN Membership',
    issuer: 'Trekking Agencies Association of Nepal',
    description: 'Membership of the national trekking industry body. TAAN sets the standards we work to on guide pay, porter weight limits, and insurance for every member of the crew who walks with you.',
    verificationNote: 'Membership status is searchable on the TAAN member directory by registration number.',
  },
  'cert-004': {
    title: 'Nepal Mountaineering Association Membership',
    issuer: 'Nepal Mountaineering Association',
    description: 'Required to run peak climbing and expedition programmes. The NMA issues climbing permits for trekking peaks such as Island Peak and Mera Peak, and certifies the climbing guides who lead them.',
    verificationNote: 'Climbing permits issued under this membership carry the same reference number.',
  },
  'cert-005': {
    title: 'Crew Insurance Cover',
    issuer: 'Himalayan General Insurance (demo partner)',
    description: 'Annual group cover for every guide, assistant guide, cook, and porter we employ, including helicopter rescue at altitude. No member of our crew walks uninsured, and we will show you the schedule on request.',
    verificationNote: 'A copy of the current schedule is available at our Thamel office and by email.',
  },
  'cert-006': {
    title: 'Kathmandu Chamber of Commerce Membership',
    issuer: 'Kathmandu Chamber of Commerce and Industry',
    description: 'Local business registration confirming our company address, ownership, and standing with the Kathmandu business community.',
    verificationNote: 'Held on file at our registered office in Thamel, Kathmandu.',
  },
}

// Homepage edits are stored in the browser. These are the original demo
// defaults, kept here so an unchanged demo can receive safer copy without
// overwriting an owner-authored heading, CTA, order, visibility, or picked ID.
const LEGACY_HOMEPAGE_COPY = {
  hero: {
    headline: 'Walk the Himalaya with people who call it home',
    subheadline: 'Small-group treks, peak climbs and cultural journeys across Nepal, led by licensed Nepali guides who have spent their lives on these trails. Honest route notes, sensible acclimatisation, and a team in Kathmandu that answers the phone.',
    primaryCtaLabel: 'Explore Trips',
    secondaryCtaLabel: 'Plan a Custom Trip',
    trustPoints: [
      'Government-licensed Nepali guides',
      'Maximum 12 trekkers per departure',
      'Permits, TIMS and logistics handled for you',
      'Fair porter wages and insured mountain crew',
    ],
  },
  sections: {
    featuredPackages: {
      heading: 'The trips we are proudest of',
      subtext: 'Six journeys that show what we do best, from a fourteen-day walk to Everest Base Camp to the walled city of Lo Manthang behind the Annapurnas.',
      ctaLabel: 'View all packages',
    },
    popularDestinations: {
      heading: 'Where in Nepal will you go',
      subtext: 'From the Khumbu icefall to the sal forests of the Terai, Nepal packs eight of the world’s fourteen highest peaks and a subtropical jungle into a country you can cross in a morning’s flight.',
      ctaLabel: 'Browse destinations',
    },
    thingsToDo: {
      heading: 'More than mountains',
      subtext: 'Teahouse trails and 6,000-metre summits, yes, but also rhino tracking in Chitwan, paragliding off Sarangkot, and morning puja in a Newar courtyard older than most European cathedrals.',
      ctaLabel: 'See all activities',
    },
    whyChooseUs: {
      heading: 'Why travellers trust Camp for Nepal',
      subtext: 'We are a Kathmandu company staffed by mountain people. Our guides carry pulse oximeters, our itineraries build in real acclimatisation days, and nobody on our crew walks in borrowed boots.',
      ctaLabel: 'About our team',
      ctaLink: '/about',
    },
    fixedDepartures: {
      heading: 'Join a group that is already going',
      subtext: 'Confirmed dates for autumn 2026 and spring 2027, the two windows when Himalayan skies are clearest. Join solo and you still pay the group rate.',
      ctaLabel: 'See departure dates',
    },
    meetOurGuides: {
      heading: 'The people who will walk beside you',
      subtext: 'Between them our lead guides have more than ninety seasons in the high Himalaya, from Khumbu icefall crossings to birding transects in Bardia. Every one is licensed and wilderness first-aid trained.',
      ctaLabel: 'Meet the full team',
    },
    trekkingHighlights: {
      heading: 'Classic treks, walked properly',
      subtext: 'Teahouse routes graded honestly, with the sleeping altitudes and rest days written into every itinerary rather than squeezed out of it. Expect 5 to 7 hours of walking on a normal day.',
    },
    expeditions: {
      heading: 'When the trail runs out',
      subtext: 'Rope, crampons and a summit push. Island Peak and Mera are honest first Himalayan climbs; Everest is a two-month commitment we only take on with climbers who are genuinely ready.',
    },
    customerReviews: {
      heading: 'In their own words',
      subtext: 'Unedited notes from travellers who came back down. We publish the three-star reviews too, because you deserve to know what a hard day on the Thorong La actually feels like.',
      ctaLabel: 'Read all reviews',
    },
    travelUpdates: {
      heading: 'What is happening on the ground',
      subtext: 'Permit fee changes, Lukla flight patterns, monsoon landslide reports and pass conditions, posted by our operations desk in Thamel as they happen.',
      ctaLabel: 'All travel updates',
    },
    certificatesAndTrust: {
      heading: 'Licensed, registered, accountable',
      subtext: 'Registered with the Nepal Tourism Board, members of TAAN and the Nepal Mountaineering Association, and insured for every guide and porter who works with us.',
      ctaLabel: 'View our credentials',
    },
    blogHighlights: {
      heading: 'Notes from the trail',
      subtext: 'Practical writing from our guides and office team: what altitude sickness really feels like at 4,400 metres, how to pack for a teahouse trek, and why October fills up first.',
      ctaLabel: 'Read the journal',
    },
    planYourTripCta: {
      heading: 'Tell us what you have in mind',
      subtext: 'Fixed dates that do not suit you, a family with different fitness levels, or three weeks and no idea where to start. Send us the rough shape of it and a trip planner in Kathmandu will come back with a real itinerary.',
      ctaLabel: 'Start planning',
    },
  },
}

// The original menu shipped before the public navigation was grouped around
// how a traveller explores, chooses, plans, and gets support. Match it in full
// so an owner-edited menu is never replaced by this demo compatibility update.
const LEGACY_MAIN_MENU = [
  {
    label: 'Explore',
    path: '/destinations',
    children: [
      { label: 'Destinations', path: '/destinations', children: [] },
      { label: 'Things To Do', path: '/things-to-do', children: [] },
      { label: 'Our Guides', path: '/guides', children: [] },
    ],
  },
  {
    label: 'Trips',
    path: '/packages',
    children: [
      { label: 'All Trips', path: '/packages', children: [] },
      { label: 'Trekking', path: '/trekking', children: [] },
      { label: 'Expeditions', path: '/expeditions', children: [] },
      { label: 'Fixed Departures', path: '/fixed-departures', children: [] },
    ],
  },
  {
    label: 'Plan',
    path: '/plan-your-trip',
    children: [
      { label: 'Custom Trip', path: '/custom-trip', children: [] },
      { label: 'Travel Info', path: '/travel-info', children: [] },
    ],
  },
  {
    label: 'Stories',
    path: '/about',
    children: [
      { label: 'About Camp For Nepal', path: '/about', children: [] },
      { label: 'Certificates', path: '/certificates', children: [] },
      { label: 'Reviews', path: '/reviews', children: [] },
      { label: 'Blog', path: '/blog', children: [] },
    ],
  },
  { label: 'Contact', path: '/contact', children: [] },
]

const LEGACY_STAFF_ROLES = new Set(['support_staff', 'content_manager', 'booking_manager', 'finance_manager'])

function replaceLegacyValue(value, legacy, replacement) {
  return value === legacy ? replacement : value
}

function sameValue(left, right) {
  return JSON.stringify(left) === JSON.stringify(right)
}

function migrateLegacyHomepage(homepage) {
  if (!homepage) return homepage

  const seed = SINGLETONS.cmsHomepage.seed
  const legacyHero = LEGACY_HOMEPAGE_COPY.hero
  const hasLegacyHero = homepage.hero?.headline === legacyHero.headline
  const hero = {
    ...homepage.hero,
    headline: replaceLegacyValue(homepage.hero?.headline, legacyHero.headline, seed.hero.headline),
    subheadline: replaceLegacyValue(homepage.hero?.subheadline, legacyHero.subheadline, seed.hero.subheadline),
    primaryCtaLabel: replaceLegacyValue(homepage.hero?.primaryCtaLabel, legacyHero.primaryCtaLabel, seed.hero.primaryCtaLabel),
    secondaryCtaLabel: replaceLegacyValue(homepage.hero?.secondaryCtaLabel, legacyHero.secondaryCtaLabel, seed.hero.secondaryCtaLabel),
    ...(sameValue(homepage.hero?.trustPoints, legacyHero.trustPoints) && { trustPoints: seed.hero.trustPoints }),
  }

  const sections = (homepage.sections || []).map((section) => {
    const legacy = LEGACY_HOMEPAGE_COPY.sections[section.key]
    const current = seed.sections.find((item) => item.key === section.key)
    if (!legacy || !current) return section

    const isLegacySection = section.heading === legacy.heading
    return {
      ...section,
      heading: replaceLegacyValue(section.heading, legacy.heading, current.heading),
      subtext: replaceLegacyValue(section.subtext, legacy.subtext, current.subtext),
      ...(legacy.ctaLabel !== undefined && {
        ctaLabel: replaceLegacyValue(section.ctaLabel, legacy.ctaLabel, current.ctaLabel),
      }),
      ...(legacy.ctaLink !== undefined && {
        ctaLink: replaceLegacyValue(section.ctaLink, legacy.ctaLink, current.ctaLink),
      }),
      ...(isLegacySection && !section.eyebrow && current.eyebrow && { eyebrow: current.eyebrow }),
      ...(isLegacySection && !section.tone && current.tone && { tone: current.tone }),
      ...(isLegacySection && !section.spacing && current.spacing && { spacing: current.spacing }),
      ...(isLegacySection && !section.demoNotice && current.demoNotice && { demoNotice: current.demoNotice }),
      ...(isLegacySection && !section.reassuranceItems && current.reassuranceItems && { reassuranceItems: current.reassuranceItems }),
      ...(isLegacySection && !section.whatsappLabel && current.whatsappLabel && { whatsappLabel: current.whatsappLabel }),
      ...(isLegacySection && !section.inquiryLabel && current.inquiryLabel && { inquiryLabel: current.inquiryLabel }),
      ...(isLegacySection && !section.inquiryLink && current.inquiryLink && { inquiryLink: current.inquiryLink }),
      ...(isLegacySection && !section.reassurance && current.reassurance && { reassurance: current.reassurance }),
    }
  })

  const next = {
    ...homepage,
    hero,
    ...(hasLegacyHero && !homepage.quickExplore && { quickExplore: seed.quickExplore }),
    sections,
  }
  return sameValue(next, homepage) ? homepage : next
}

function migrateLatestPlanYourTripCopy(page) {
  if (!page) return page

  const legacy = LEGACY_DEMO_COPY.planYourTrip
  const seed = SINGLETONS.planYourTripPage.seed
  const steps = (page.steps || []).map((step, index) => {
    const oldStep = legacy.steps[index]
    const replacement = seed.steps[index]
    if (!oldStep || !replacement) return step
    return {
      ...step,
      title: replaceLegacyValue(step.title, oldStep.title, replacement.title),
      body: replaceLegacyValue(step.body, oldStep.body, replacement.body),
    }
  })

  const next = {
    ...page,
    headline: replaceLegacyValue(page.headline, legacy.headline, seed.headline),
    intro: replaceLegacyValue(page.intro, legacy.intro, seed.intro),
    steps,
    reassurance: replaceLegacyValue(page.reassurance, legacy.reassurance, seed.reassurance),
  }
  return sameValue(next, page) ? page : next
}

function migrateLegacyCertificates(rows) {
  if (!Array.isArray(rows)) return rows

  const seedById = new Map(COLLECTIONS.certificates.seed.map((item) => [item.id, item]))
  const next = rows.map((record) => {
    const legacy = LEGACY_CERTIFICATE_COPY[record.id]
    const replacement = seedById.get(record.id)
    if (!legacy || !replacement) return record

    const isUnchangedDemoRecord = ['title', 'issuer', 'description', 'verificationNote']
      .every((field) => record[field] === legacy[field])

    return isUnchangedDemoRecord
      ? {
          ...record,
          title: replacement.title,
          issuer: replacement.issuer,
          description: replacement.description,
          verificationNote: replacement.verificationNote,
        }
      : record
  })

  return sameValue(next, rows) ? rows : next
}

function migrateSimplifiedBookingStatuses(rows) {
  if (!Array.isArray(rows)) return rows

  const next = rows.map((record) => {
    const normalized = normalizeBookingStatus(record.status)
    const statusHistory = Array.isArray(record.statusHistory)
      ? record.statusHistory.map((entry) => ({ ...entry, status: normalizeBookingStatus(entry.status) }))
      : record.statusHistory
    const changed = record.status !== normalized || !sameValue(statusHistory, record.statusHistory)

    return changed ? { ...record, status: normalized, ...(statusHistory !== undefined && { statusHistory }) } : record
  })

  return sameValue(next, rows) ? rows : next
}

function migrateSimplifiedUserRoles(rows) {
  if (!Array.isArray(rows)) return rows

  const next = rows.map((record) => {
    if (!LEGACY_STAFF_ROLES.has(record.role)) return record
    return {
      ...record,
      role: 'admin',
      status: record.status === 'active' ? 'suspended' : record.status,
    }
  })

  return sameValue(next, rows) ? rows : next
}

export function migrateLegacyDemoCopy(overlay) {
  const demoMode = overlay.singletons.siteSettings?.demoMode ?? SINGLETONS.siteSettings.seed.demoMode
  if (demoMode === false) return overlay

  const storedFooter = overlay.singletons.footer
  const storedContact = overlay.singletons.contactDetails
  const storedHomepage = overlay.singletons.cmsHomepage
  const storedPlanYourTrip = overlay.singletons.planYourTripPage
  const storedMenu = overlay.singletons.menu
  const storedCertificates = overlay.collections.certificates
  const storedBookings = overlay.collections.bookings
  const storedUsers = overlay.collections.users
  let footer = storedFooter
  let contact = storedContact
  let homepage = storedHomepage
  let planYourTrip = storedPlanYourTrip
  let menu = storedMenu
  let certificates = storedCertificates
  let bookings = storedBookings
  let users = storedUsers

  if (storedFooter) {
    const seedFooter = SINGLETONS.footer.seed
    const contactBlock = storedFooter.contactBlock || {}
    const nextContactBlock = {
      ...contactBlock,
      heading: replaceLegacyValue(contactBlock.heading, LEGACY_DEMO_COPY.footer.contactHeading, seedFooter.contactBlock.heading),
      body: replaceLegacyValue(contactBlock.body, LEGACY_DEMO_COPY.footer.contactBody, seedFooter.contactBlock.body),
    }
    const nextFooter = {
      ...storedFooter,
      contactBlock: nextContactBlock,
      newsletterHeading: replaceLegacyValue(storedFooter.newsletterHeading, LEGACY_DEMO_COPY.footer.newsletterHeading, seedFooter.newsletterHeading),
      newsletterSubtext: replaceLegacyValue(storedFooter.newsletterSubtext, LEGACY_DEMO_COPY.footer.newsletterSubtext, seedFooter.newsletterSubtext),
      copyrightLine: replaceLegacyValue(storedFooter.copyrightLine, LEGACY_DEMO_COPY.footer.copyrightLine, seedFooter.copyrightLine),
      legalLinks: (storedFooter.legalLinks || []).map((link) =>
        link.path === '/booking-policy' && link.label === 'Booking and Cancellation Policy'
          ? { ...link, label: 'Cancellation Policy', path: '/cancellation-policy' }
          : link
      ),
    }
    nextFooter.contactBlock.body = replaceLegacyValue(
      nextFooter.contactBlock.body,
      LEGACY_DEMO_COPY.footerFinalTouch.contactBody,
      seedFooter.contactBlock.body
    )
    nextFooter.newsletterHeading = replaceLegacyValue(
      nextFooter.newsletterHeading,
      LEGACY_DEMO_COPY.footerFinalTouch.newsletterHeading,
      seedFooter.newsletterHeading
    )
    nextFooter.newsletterSubtext = replaceLegacyValue(
      nextFooter.newsletterSubtext,
      LEGACY_DEMO_COPY.footerFinalTouch.newsletterSubtext,
      seedFooter.newsletterSubtext
    )
    nextFooter.trustStatement = replaceLegacyValue(
      nextFooter.trustStatement,
      LEGACY_DEMO_COPY.footerFinalTouch.trustStatement,
      seedFooter.trustStatement
    )
    if (!storedFooter.trustStatement && storedFooter.copyrightLine === LEGACY_DEMO_COPY.footer.copyrightLine) {
      nextFooter.trustStatement = seedFooter.trustStatement
    }
    if (JSON.stringify(nextFooter) !== JSON.stringify(storedFooter)) footer = nextFooter
  }

  if (storedContact) {
    const seedContact = SINGLETONS.contactDetails.seed
    const nextContact = {
      ...storedContact,
      tagline: replaceLegacyValue(storedContact.tagline, LEGACY_DEMO_COPY.contact.tagline, seedContact.tagline),
      officeHours: replaceLegacyValue(storedContact.officeHours, LEGACY_DEMO_COPY.contact.officeHours, seedContact.officeHours),
    }
    if (!storedContact.responseTime && storedContact.officeHours === LEGACY_DEMO_COPY.contact.officeHours) {
      nextContact.responseTime = seedContact.responseTime
    }
    if (JSON.stringify(nextContact) !== JSON.stringify(storedContact)) contact = nextContact
  }

  if (storedHomepage) {
    const copyUpdatedHomepage = migrateLegacyHomepage(storedHomepage)
    const nextHomepage = {
      ...copyUpdatedHomepage,
      sections: (copyUpdatedHomepage.sections || []).map((section) => ({
        ...section,
        ...(section.supportLinks && {
          supportLinks: section.supportLinks.map((link) =>
            link.path === '/booking-policy' && link.label === 'Cancellation policy'
              ? { ...link, path: '/cancellation-policy' }
              : link
          ),
        }),
      })),
    }
    if (JSON.stringify(nextHomepage) !== JSON.stringify(storedHomepage)) homepage = nextHomepage
  }

  if (storedPlanYourTrip) {
    const nextPlanYourTrip = migrateLatestPlanYourTripCopy(storedPlanYourTrip)
    if (!sameValue(nextPlanYourTrip, storedPlanYourTrip)) planYourTrip = nextPlanYourTrip
  }

  if (storedCertificates) {
    const nextCertificates = migrateLegacyCertificates(storedCertificates)
    if (!sameValue(nextCertificates, storedCertificates)) certificates = nextCertificates
  }

  if (storedBookings) {
    const nextBookings = migrateSimplifiedBookingStatuses(storedBookings)
    if (!sameValue(nextBookings, storedBookings)) bookings = nextBookings
  }

  if (storedUsers) {
    const nextUsers = migrateSimplifiedUserRoles(storedUsers)
    if (!sameValue(nextUsers, storedUsers)) users = nextUsers
  }

  if (storedMenu && JSON.stringify(storedMenu.mainMenu) === JSON.stringify(LEGACY_MAIN_MENU)) {
    menu = { ...storedMenu, mainMenu: SINGLETONS.menu.seed.mainMenu }
  }

  if (
    footer === storedFooter &&
    contact === storedContact &&
    homepage === storedHomepage &&
    planYourTrip === storedPlanYourTrip &&
    menu === storedMenu &&
    certificates === storedCertificates &&
    bookings === storedBookings &&
    users === storedUsers
  ) return overlay
  return {
    ...overlay,
    collections: {
      ...overlay.collections,
      ...(certificates !== storedCertificates && { certificates }),
      ...(bookings !== storedBookings && { bookings }),
      ...(users !== storedUsers && { users }),
    },
    singletons: {
      ...overlay.singletons,
      ...(footer !== storedFooter && { footer }),
      ...(contact !== storedContact && { contactDetails: contact }),
      ...(homepage !== storedHomepage && { cmsHomepage: homepage }),
      ...(planYourTrip !== storedPlanYourTrip && { planYourTripPage: planYourTrip }),
      ...(menu !== storedMenu && { menu }),
    },
  }
}
