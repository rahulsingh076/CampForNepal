// Footer CMS content: link columns, social links, newsletter block, legal links and copyright.
import { SITE_NAME } from '../config/siteIdentity.js'

const footer = {
  columns: [
    {
      heading: 'Trekking in Nepal',
      links: [
        { label: 'Everest Base Camp Trek', path: '/packages/everest-base-camp-trek' },
        { label: 'Annapurna Base Camp Trek', path: '/packages/annapurna-base-camp-trek' },
        { label: 'Annapurna Circuit Trek', path: '/packages/annapurna-circuit-trek' },
        { label: 'Langtang Valley Trek', path: '/packages/langtang-valley-trek' },
        { label: 'Manaslu Circuit Trek', path: '/packages/manaslu-circuit-trek' },
        { label: 'Upper Mustang Trek', path: '/packages/upper-mustang-trek' },
      ],
    },
    {
      heading: 'Climbing and Tours',
      links: [
        { label: 'Island Peak Climbing', path: '/packages/island-peak-climbing' },
        { label: 'Mera Peak Climbing', path: '/packages/mera-peak-climbing' },
        { label: 'Everest Expedition', path: '/packages/everest-expedition' },
        { label: 'Everest Base Camp Helicopter Tour', path: '/packages/everest-base-camp-helicopter-tour' },
        { label: 'Chitwan Jungle Safari', path: '/packages/chitwan-jungle-safari' },
        { label: 'Kathmandu Valley Heritage Tour', path: '/packages/kathmandu-valley-heritage-tour' },
      ],
    },
    {
      heading: 'Before You Go',
      links: [
        { label: 'Visa on Arrival', path: '/travel-info/nepal-visa-on-arrival' },
        { label: 'Trekking Permits Explained', path: '/travel-info/trekking-permits-explained' },
        { label: 'Altitude Sickness and Safety', path: '/travel-info/altitude-sickness-and-acclimatisation' },
        { label: 'Packing List', path: '/travel-info/teahouse-trek-packing-list' },
        { label: 'Travel Insurance', path: '/travel-info/travel-insurance-helicopter-evacuation' },
        { label: 'Responsible Travel', path: '/travel-info/responsible-travel-leave-no-trace' },
      ],
    },
    {
      heading: SITE_NAME,
      links: [
        { label: 'About Us', path: '/about' },
        { label: 'Our Guides', path: '/guides' },
        { label: 'Licences and Certificates', path: '/certificates' },
        { label: 'Traveller Reviews', path: '/reviews' },
        { label: 'Journal', path: '/blog' },
        { label: 'Contact the Kathmandu Office', path: '/contact' },
      ],
    },
  ],
  socialLinks: [
    { platform: 'Facebook', url: 'https://facebook.com/campfornepal' },
    { platform: 'Instagram', url: 'https://instagram.com/campfornepal' },
    { platform: 'YouTube', url: 'https://youtube.com/@campfornepal' },
    { platform: 'TripAdvisor', url: 'https://tripadvisor.com/campfornepal' },
    { platform: 'LinkedIn', url: 'https://linkedin.com/company/campfornepal' },
  ],
  contactBlock: {
    heading: 'Questions before you choose?',
    body: 'Compare route details, then record a question in this browser-only demo. No message is transmitted to a trip planner.',
    phone: '+977 1 4412880',
    email: 'hello@campfornepal.example.com',
  },
  newsletterHeading: 'Sample planning notes',
  newsletterSubtext: 'Sample questions for permits, weather, and dates. Check current information directly before making travel plans.',
  trustStatement: 'This browser-only demonstration uses sample records. Confirm current dates, availability, travel requirements, and booking details directly before making plans.',
  legalLinks: [
    { label: 'Terms and Conditions', path: '/terms-and-conditions' },
    { label: 'Privacy Policy', path: '/privacy-policy' },
    { label: 'Cancellation Policy', path: '/cancellation-policy' },
    { label: 'Responsible Travel Pledge', path: '/travel-info/responsible-travel-leave-no-trace' },
  ],
  copyrightLine: `© 2026 ${SITE_NAME} Treks and Expeditions Pvt. Ltd., Thamel, Kathmandu. Demonstration site — all contact details and credentials are fictional.`,
}

export default footer
