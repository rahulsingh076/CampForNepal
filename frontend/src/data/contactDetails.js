// Company contact block for the site — FICTIONAL DEMO DATA ONLY, no real phone numbers, emails or address.
import { SITE_NAME } from '../config/siteIdentity.js'

const contactDetails = {
  companyName: SITE_NAME,
  tagline: 'Demo contact record for a Nepal travel-planning site.',
  addressLines: [
    `${SITE_NAME} Treks and Expeditions Pvt. Ltd.`,
    'Second floor, Chaksibari Marg',
    'Thamel, Kathmandu 44600',
    'Bagmati Province, Nepal',
  ],
  phone: '+977 1 4412880',
  whatsapp: '+977 9841002200',
  whatsappEnabled: true,
  publicEmail: 'hello@campfornepal.example.com',
  email: 'hello@campfornepal.example.com',
  emailEnabled: true,
  supportEmail: 'support@campfornepal.example.com',
  emergencyPhone: '+977 9801112233',
  emergencyContactWording: 'If you are travelling with us and something has gone wrong, call or message this line now.',
  officeHours: 'Sample office hours for this demo. The Call and WhatsApp controls do not connect to a live team.',
  responseTime: 'There is no response-time promise in this demo because requests are not transmitted.',
  mapEmbedNote: 'Map embed is disabled in this demo build. The office sits on Chaksibari Marg, roughly 300 metres north of Thamel Chowk and a five-minute walk from the Kathmandu Guest House.',
  mapLink: 'https://maps.google.com/?q=Thamel,+Kathmandu',
  facebookPageUrl: 'https://facebook.com/campfornepal',
  facebookMessengerUrl: 'https://m.me/campfornepal',
  instagramUrl: 'https://instagram.com/campfornepal',
  socialLinks: [
    { platform: 'Facebook', url: 'https://facebook.com/campfornepal' },
    { platform: 'Instagram', url: 'https://instagram.com/campfornepal' },
    { platform: 'YouTube', url: 'https://youtube.com/@campfornepal' },
    { platform: 'TripAdvisor', url: 'https://tripadvisor.com/campfornepal' },
    { platform: 'LinkedIn', url: 'https://linkedin.com/company/campfornepal' },
  ],
}

export default contactDetails
