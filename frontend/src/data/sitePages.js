// Simple editorial pages. Keeping each page as ordered sections makes legal
// copy approachable to edit without requiring a rich text editor.
const sitePages = {
  pages: [
    {
      key: 'about',
      title: 'About Camp for Nepal',
      headline: 'A Nepali company, run by the people who walk the trails',
      intro: 'Camp for Nepal was started in Kathmandu by guides who were tired of watching visitors get sold trips that were too short, too fast, and too cheap to be safe. We run the trips we would send our own families on.',
      status: 'published',
      sections: [
        { heading: 'How we began', body: 'We began in 2019 with four guides, one office above a bookshop in Thamel, and a stubborn view that a trekking company should be judged by how it behaves on a bad day rather than a good one. The first season was eleven trips. Most of our clients still come from people who walked with us then.' },
        { heading: 'Who leads the trips', body: 'Everyone who leads for us is Nepali, licensed, and from the region they guide in. That is why our Everest guides know the lodge in Dingboche with the warm dining room, and why our naturalists in Chitwan can find a rhino in the elephant grass when nobody else can.' },
        { heading: 'What we protect', body: 'We cap group sizes, turn work away in peak season rather than hire people we do not know, and would rather lose a booking than run an itinerary that skips acclimatisation.' },
      ],
    },
    {
      key: 'privacy',
      title: 'Privacy Policy',
      headline: 'Privacy Policy',
      intro: 'How this demonstration site handles the details you share while planning a trip.',
      status: 'published',
      isDemo: true,
      updatedAt: '2026-08-02',
      sections: [
        { heading: 'What we collect', body: 'We only collect the contact and trip-planning details you enter into a form. In this demo, those details stay in your browser and are never sent to a server.' },
        { heading: 'How we use it', body: 'In a production service, the team would use your details to reply to an inquiry, arrange a booking, and meet legal and safety obligations. We do not sell personal information.' },
        { heading: 'Your choices', body: 'You can ask for a copy, correction, or deletion of your information. Contact the office using the details on the contact page.' },
      ],
    },
    {
      key: 'terms',
      title: 'Terms and Conditions',
      headline: 'Terms and Conditions',
      intro: 'The practical agreement between Camp for Nepal and a traveller joining one of our trips.',
      status: 'published',
      isDemo: true,
      updatedAt: '2026-08-02',
      sections: [
        { heading: 'Trip suitability', body: 'You are responsible for reading the itinerary, difficulty, altitude, and fitness guidance before requesting a place. We will help you choose a suitable trip, and may decline a booking when the route is not safe for your circumstances.' },
        { heading: 'Safety decisions', body: 'Guides may change, shorten, or end an itinerary because of weather, health, route conditions, or operational safety. Their decision on the trail is final.' },
        { heading: 'Insurance', body: 'Every traveller needs insurance that covers the activity, stated maximum altitude, medical treatment, and helicopter evacuation where applicable.' },
      ],
    },
    {
      key: 'cancellation',
      title: 'Booking and Cancellation Policy',
      headline: 'Booking and Cancellation Policy',
      intro: 'A clear outline of how booking changes and cancellations are handled.',
      status: 'published',
      isDemo: true,
      updatedAt: '2026-08-02',
      sections: [
        { heading: 'Before confirmation', body: 'An inquiry is not a confirmed booking. Your travel consultant will confirm availability, itinerary, inclusions, and the documents needed before a booking is marked confirmed.' },
        { heading: 'Changes and cancellations', body: 'Send a change or cancellation request in writing as early as possible. We assess it against supplier commitments, permit timing, and the trip departure date, then respond with the available options.' },
        { heading: 'Force majeure', body: 'Mountain weather, road closures, flight disruptions, political restrictions, and natural events can require a route change. We will keep you informed and make safety-led alternatives wherever practical.' },
      ],
    },
  ],
}

export default sitePages
