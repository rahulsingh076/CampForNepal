// Source markets Camp for Nepal serves, with the language, currency and content each market expects.
const countries = [
  {
    countryCode: 'KR',
    countryName: 'South Korea',
    defaultLanguage: 'ko',
    defaultCurrency: 'KRW',
    suggestedSupportText: 'A Korean-speaking trip coordinator handles your booking from first enquiry to airport pickup, and KakaoTalk replies usually land within a few hours of Seoul office time.',
    recommendedContentTags: [
      'annapurna-base-camp',
      'poon-hill-short-trek',
      'ghorepani-ghandruk',
      'pokhara-lakeside',
      'teahouse-trekking'
    ]
  },
  {
    countryCode: 'JP',
    countryName: 'Japan',
    defaultLanguage: 'ja',
    defaultCurrency: 'JPY',
    suggestedSupportText: 'Japanese-language briefings, precise day-by-day itineraries and a coordinator who confirms every detail in writing before you leave home.',
    recommendedContentTags: [
      'annapurna-base-camp',
      'poon-hill-short-trek',
      'langtang-valley',
      'kathmandu-heritage',
      'comfortable-teahouse-lodges'
    ]
  },
  {
    countryCode: 'IN',
    countryName: 'India',
    defaultLanguage: 'hi',
    defaultCurrency: 'INR',
    suggestedSupportText: 'Hindi-speaking coordinators, no visa needed for Indian passport holders, and pilgrimage-friendly itineraries that respect fasting, puja timings and vegetarian meals.',
    recommendedContentTags: [
      'muktinath-pilgrimage',
      'pashupatinath-kathmandu',
      'pokhara-lakeside',
      'lumbini-buddha-birthplace',
      'family-friendly-tours'
    ]
  },
  {
    countryCode: 'NP',
    countryName: 'Nepal',
    defaultLanguage: 'ne',
    defaultCurrency: 'NPR',
    suggestedSupportText: 'Local rates in Nepali rupees, Nepali-language support from our Thamel office, and weekend departures built around the Kathmandu working week.',
    recommendedContentTags: [
      'weekend-short-treks',
      'langtang-valley',
      'chitwan-safari',
      'rafting-trishuli',
      'domestic-traveller-rates'
    ]
  },
  {
    countryCode: 'US',
    countryName: 'United States',
    defaultLanguage: 'en',
    defaultCurrency: 'USD',
    suggestedSupportText: 'US-hours phone and email support, transparent inclusion lists in dollars, and honest altitude-acclimatisation planning for travellers arriving from sea level.',
    recommendedContentTags: [
      'everest-base-camp',
      'island-peak-climbing',
      'annapurna-circuit',
      'everest-helicopter-tour',
      'high-altitude-safety'
    ]
  },
  {
    countryCode: 'GB',
    countryName: 'United Kingdom',
    defaultLanguage: 'en',
    defaultCurrency: 'USD',
    suggestedSupportText: 'UK-hours support, clear guidance on trekking insurance that covers helicopter evacuation above 5,000 m, and itineraries timed to autumn and spring school holidays.',
    recommendedContentTags: [
      'everest-base-camp',
      'manaslu-circuit',
      'upper-mustang',
      'teahouse-trekking',
      'travel-insurance-guidance'
    ]
  },
  {
    countryCode: 'AU',
    countryName: 'Australia',
    defaultLanguage: 'en',
    defaultCurrency: 'USD',
    suggestedSupportText: 'Coordinators reachable during AEST mornings, and itineraries that work with the short flight window into Lukla for travellers on tight annual leave.',
    recommendedContentTags: [
      'everest-base-camp',
      'annapurna-base-camp',
      'mera-peak-climbing',
      'paragliding-pokhara',
      'high-altitude-safety'
    ]
  },
  {
    countryCode: 'CN',
    countryName: 'China',
    defaultLanguage: 'zh',
    defaultCurrency: 'USD',
    suggestedSupportText: 'Mandarin-speaking guides on request, WeChat updates from our Kathmandu office, and help with the Tibet-border and restricted-area paperwork.',
    recommendedContentTags: [
      'upper-mustang',
      'kathmandu-heritage',
      'lumbini-buddha-birthplace',
      'everest-helicopter-tour',
      'pokhara-lakeside'
    ]
  },
  {
    countryCode: 'XX',
    countryName: 'Other',
    defaultLanguage: 'en',
    defaultCurrency: 'USD',
    suggestedSupportText: 'Wherever you are booking from, one English-speaking coordinator stays with your trip end to end and answers within 24 hours.',
    recommendedContentTags: [
      'everest-base-camp',
      'annapurna-base-camp',
      'chitwan-safari',
      'kathmandu-heritage',
      'custom-private-trips'
    ]
  }
]

export default countries
