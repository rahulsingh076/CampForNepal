// Short-lived travel notices: permits, weather, route conditions, and flight disruption.
const travelUpdates = [
  {
    id: 'upd-001',
    title: 'Lukla flights moving to Ramechhap for the autumn season',
    slug: 'lukla-flights-ramechhap-autumn-2026',
    category: 'flight',
    severity: 'advisory',
    author: 'Camp for Nepal Operations',
    summary:
      'From late September, most Lukla flights depart from Ramechhap (Manthali) instead of Kathmandu. Budget an extra pre-dawn drive of four to five hours.',
    content:
      'Every autumn, when Kathmandu air traffic peaks, the Civil Aviation Authority shifts most Lukla services to Ramechhap airport at Manthali, about 132km east of Kathmandu. The road transfer takes four to five hours and departs between 01:00 and 02:00 so you reach the airport for the first-light flying window.\n\nWe build this transfer into every Everest-region departure from 25 September to 10 December, with a private vehicle and a packed breakfast. You do not need to arrange anything separately, but you should expect a short night before your flight and plan to sleep on the drive.\n\nMountain flying is weather-dependent and delays of a day or more do happen. We hold a contingency day on all Everest itineraries, and where a group loses more than one day we discuss a helicopter transfer with you before committing to it.',
    featuredImage: '/images/travel-updates/lukla-flights-ramechhap-autumn-2026.jpg',
    relatedDestinationIds: ['dest-001'],
    relatedPackageIds: ['pkg-001', 'pkg-007', 'pkg-008', 'pkg-013'],
    seo: {
      metaTitle: 'Lukla flights moving to Ramechhap for the autumn season | Camp for Nepal',
      metaDescription:
        'From late September, most Lukla flights depart from Ramechhap (Manthali) instead of Kathmandu. Budget an extra pre-dawn drive of four to five hours.',
      keywords: ['lukla flight', 'ramechhap manthali', 'everest base camp trek', 'nepal domestic flights'],
    },
    status: 'published',
    publishedAt: '2026-07-18',
    expiresAt: '2026-12-15',
  },
  {
    id: 'upd-002',
    title: 'ACAP permit fee revised for foreign trekkers',
    slug: 'acap-permit-fee-revision-2026',
    category: 'permit',
    severity: 'info',
    author: 'Camp for Nepal Operations',
    summary:
      'The Annapurna Conservation Area Project entry fee has been revised. The new rate is already included in our published package prices.',
    content:
      'The National Trust for Nature Conservation has revised the Annapurna Conservation Area Project entry permit fee for foreign nationals. SAARC nationals continue to pay a reduced rate, and children under ten remain free.\n\nIf you have already booked with us, nothing changes for you. Our quoted prices include every trekking permit named in the package, and we absorb mid-season fee revisions on confirmed bookings rather than passing them on.\n\nPermits are issued in Kathmandu or Pokhara against your passport and two photographs. We handle the paperwork; you only need to bring the passport you will travel on.',
    featuredImage: '/images/travel-updates/acap-permit-fee-revision-2026.jpg',
    relatedDestinationIds: ['dest-002', 'dest-005'],
    relatedPackageIds: ['pkg-002', 'pkg-003', 'pkg-012'],
    seo: {
      metaTitle: 'ACAP permit fee revised for foreign trekkers | Camp for Nepal',
      metaDescription:
        'The Annapurna Conservation Area Project entry fee has been revised. The new rate is already included in our published package prices.',
      keywords: ['acap permit fee', 'annapurna conservation area', 'nepal trekking permits'],
    },
    status: 'published',
    publishedAt: '2026-06-30',
    expiresAt: null,
  },
  {
    id: 'upd-003',
    title: 'Thorong La conditions and the safe crossing window',
    slug: 'thorong-la-crossing-conditions',
    category: 'route',
    severity: 'advisory',
    author: 'Pemba Sherpa, Lead Guide',
    summary:
      'Thorong La (5416m) crosses best between 04:00 and 09:00. Afternoon wind and fresh snow close the pass at short notice.',
    content:
      'The high point of the Annapurna Circuit is a long, exposed crossing with no shelter between High Camp and Muktinath. Our groups leave High Camp between 04:00 and 05:00 so the pass is behind them before the wind builds through the middle of the day.\n\nAfter heavy snowfall the pass can be genuinely dangerous, and it is closed from time to time in December and January. Our guides carry a satellite communicator and take the daily call with our Kathmandu operations desk. If the pass is not safe, we turn the group around and take the Jomsom road option instead.\n\nA cancelled pass crossing is disappointing but it is never negotiable. Please come with that understanding, and with insurance that covers a change of itinerary at altitude.',
    featuredImage: '/images/travel-updates/thorong-la-crossing-conditions.jpg',
    relatedDestinationIds: ['dest-002'],
    relatedPackageIds: ['pkg-003'],
    seo: {
      metaTitle: 'Thorong La conditions and the safe crossing window | Camp for Nepal',
      metaDescription:
        'Thorong La (5416m) crosses best between 04:00 and 09:00. Afternoon wind and fresh snow close the pass at short notice.',
      keywords: ['thorong la pass', 'annapurna circuit', 'high pass conditions'],
    },
    status: 'published',
    publishedAt: '2026-07-05',
    expiresAt: null,
  },
  {
    id: 'upd-004',
    title: 'Monsoon landslides on the Manaslu approach road',
    slug: 'manaslu-approach-road-monsoon-landslides',
    category: 'safety',
    severity: 'urgent',
    author: 'Camp for Nepal Safety Desk',
    summary:
      'The road to Machhakhola is subject to landslides until the monsoon clears in mid-September. Manaslu departures resume from 20 September.',
    content:
      'The drive from Kathmandu to Machhakhola crosses several active slide zones along the Budhi Gandaki. During the monsoon these can close the road for hours or days, and clearing work often runs only in daylight.\n\nWe do not run Manaslu Circuit departures during the monsoon. Our first autumn group leaves on 20 September, by which time the road has usually settled and the trail is dry enough for the Larke La crossing.\n\nIf you are travelling independently in this period, check conditions in Arughat before committing to the drive, and never cross an active slide on foot to reach a waiting vehicle on the far side.',
    featuredImage: '/images/travel-updates/manaslu-approach-road-monsoon-landslides.jpg',
    relatedDestinationIds: ['dest-008'],
    relatedPackageIds: ['pkg-005'],
    seo: {
      metaTitle: 'Monsoon landslides on the Manaslu approach road | Camp for Nepal',
      metaDescription:
        'The road to Machhakhola is subject to landslides until the monsoon clears in mid-September. Manaslu departures resume from 20 September.',
      keywords: ['manaslu circuit', 'monsoon landslide', 'machhakhola road'],
    },
    status: 'published',
    publishedAt: '2026-07-22',
    expiresAt: '2026-09-20',
  },
  {
    id: 'upd-005',
    title: 'Upper Mustang restricted area permit: new group rules',
    slug: 'upper-mustang-permit-group-rules',
    category: 'permit',
    severity: 'info',
    author: 'Camp for Nepal Operations',
    summary:
      'Upper Mustang remains a restricted area. A minimum of two trekkers and a government-registered guide are required, with no exceptions.',
    content:
      'Upper Mustang sits behind a restricted-area permit issued only through a licensed Nepali agency. The permit covers a fixed number of days from a named entry date, and extensions must be applied for before the original permit expires.\n\nA solo traveller cannot obtain this permit. You must trek as a party of at least two, accompanied by a registered guide, and the permit is issued against your passport and your entry date into Nepal. We apply on your behalf once your booking is confirmed and your passport scan has reached us.\n\nBecause the permit is date-bound, changes to your arrival date after the application is filed can mean reapplying. Please tell us early if your flights shift.',
    featuredImage: '/images/travel-updates/upper-mustang-permit-group-rules.jpg',
    relatedDestinationIds: ['dest-007'],
    relatedPackageIds: ['pkg-006'],
    seo: {
      metaTitle: 'Upper Mustang restricted area permit: new group rules | Camp for Nepal',
      metaDescription:
        'Upper Mustang remains a restricted area. A minimum of two trekkers and a government-registered guide are required, with no exceptions.',
      keywords: ['upper mustang permit', 'restricted area permit', 'lo manthang trek'],
    },
    status: 'published',
    publishedAt: '2026-05-14',
    expiresAt: null,
  },
  {
    id: 'upd-006',
    title: 'Altitude sickness advisory for fast Everest itineraries',
    slug: 'altitude-sickness-advisory-everest',
    category: 'safety',
    severity: 'advisory',
    author: 'Camp for Nepal Safety Desk',
    summary:
      'Short Everest itineraries sold elsewhere skip acclimatisation days. Ours do not, and here is why that matters.',
    content:
      'Above 3000m, the safe rule is to gain no more than 300 to 500m of sleeping altitude per day, with a rest day every 1000m. Itineraries that reach Everest Base Camp in nine or ten days break that rule, and the people who get into trouble on the trail are almost always on one of them.\n\nOur Everest Base Camp Trek runs to fourteen days with acclimatisation days at Namche Bazaar (3440m) and Dingboche (4410m), each built around a climb-high sleep-low walk. Our guides carry a pulse oximeter and check the group each evening.\n\nDescent is the only real treatment for altitude sickness. If your guide asks you to go down, go down. Every one of our itineraries has enough slack to absorb a lost day, and nobody is ever charged for turning back on medical advice.',
    featuredImage: '/images/travel-updates/altitude-sickness-advisory-everest.jpg',
    relatedDestinationIds: ['dest-001'],
    relatedPackageIds: ['pkg-001', 'pkg-007', 'pkg-008', 'pkg-009'],
    seo: {
      metaTitle: 'Altitude sickness advisory for fast Everest itineraries | Camp for Nepal',
      metaDescription:
        'Short Everest itineraries sold elsewhere skip acclimatisation days. Ours do not, and here is why that matters.',
      keywords: ['altitude sickness', 'acclimatisation', 'everest base camp safety'],
    },
    status: 'published',
    publishedAt: '2026-04-02',
    expiresAt: null,
  },
  {
    id: 'upd-007',
    title: 'Chitwan jungle drive routes adjusted for the breeding season',
    slug: 'chitwan-jungle-drive-breeding-season',
    category: 'policy',
    severity: 'info',
    author: 'Camp for Nepal Operations',
    summary:
      'Park authorities have adjusted vehicle routes through part of the core area. Walking safaris and canoe trips are unaffected.',
    content:
      'Chitwan National Park periodically closes sections of the core-area track to vehicles so that rhino and gaur are undisturbed during the breeding season. The affected loops are in the western core area, and the change runs through the late summer.\n\nOur Chitwan itineraries use the eastern routes during this period, along with a guided canoe descent of the Rapti and a walking safari with an armed park naturalist. Sightings are, if anything, better on foot and from the water.\n\nThe park remains fully open, and the elephant breeding centre, the Tharu cultural programme, and the birding hides are all unchanged.',
    featuredImage: '/images/travel-updates/chitwan-jungle-drive-breeding-season.jpg',
    relatedDestinationIds: ['dest-006'],
    relatedPackageIds: ['pkg-011'],
    seo: {
      metaTitle: 'Chitwan jungle drive routes adjusted for the breeding season | Camp for Nepal',
      metaDescription:
        'Park authorities have adjusted vehicle routes through part of the core area. Walking safaris and canoe trips are unaffected.',
      keywords: ['chitwan national park', 'jungle safari', 'breeding season'],
    },
    status: 'published',
    publishedAt: '2026-06-11',
    expiresAt: '2026-09-30',
  },
  {
    id: 'upd-008',
    title: 'Winter weather outlook for the Langtang valley',
    slug: 'langtang-winter-weather-outlook',
    category: 'weather',
    severity: 'info',
    author: 'Karma Lama, Lead Guide',
    summary:
      'Langtang stays walkable through winter with cold, stable, and exceptionally clear days. Expect deep cold above Kyanjin Gompa.',
    content:
      'Langtang is one of the few Nepali trekking regions that reads well in winter. The valley is low enough that the trail stays open, and December through February bring the clearest air of the year for the Langtang Lirung skyline.\n\nNights at Kyanjin Gompa (3870m) drop well below freezing and teahouse rooms are unheated. We upgrade the sleeping bag rating on all winter departures and add a second blanket at every lodge above Lama Hotel.\n\nSnow can close the Kyanjin Ri and Tserko Ri side walks after a storm. We keep a flexible day in the itinerary so the group can wait out a bad window rather than push into one.',
    featuredImage: '/images/travel-updates/langtang-winter-weather-outlook.jpg',
    relatedDestinationIds: ['dest-003'],
    relatedPackageIds: ['pkg-004'],
    seo: {
      metaTitle: 'Winter weather outlook for the Langtang valley | Camp for Nepal',
      metaDescription:
        'Langtang stays walkable through winter with cold, stable, and exceptionally clear days. Expect deep cold above Kyanjin Gompa.',
      keywords: ['langtang trek', 'winter trekking nepal', 'kyanjin gompa'],
    },
    status: 'published',
    publishedAt: '2026-07-09',
    expiresAt: null,
  },
]

export default travelUpdates
