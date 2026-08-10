// Copy for the Plan Your Trip page, stored as a CMS singleton.
const planYourTripPage = {
  headline: 'Shape your Nepal trip with clear questions',
  intro:
    'Start with the route, pace, and time you have. This demo lets you record a trip brief in this browser; it does not send a message or provide a live quote.',
  steps: [
    {
      title: 'Start with the shape of your trip',
      body: 'A sentence is enough to start. Where you are drawn to, how long you have, and how hard you want to work.',
    },
    {
      title: 'Compare the useful details',
      body: 'Look at day-by-day plans, stated effort, permits, inclusions, and the displayed price basis before deciding what to ask.',
    },
    {
      title: 'Keep room for your pace',
      body: 'A shorter route, a slower walking day, a different valley, or an extra rest day are useful questions to raise before making plans.',
    },
    {
      title: 'Confirm details directly before you commit',
      body: 'Availability, permits, transport, guide arrangements, and any documents need direct confirmation outside this frontend-only demo.',
    },
  ],
  seasonHints: [
    {
      season: 'Spring, March to May',
      body: 'The busiest and arguably the best. Rhododendron in flower below 3,500m, long settled spells, and the main climbing season. Book early for Everest.',
    },
    {
      season: 'Autumn, late September to November',
      body: 'The clearest air of the year and the most reliable weather. Trails are busy. October is the single most popular month in Nepal.',
    },
    {
      season: 'Winter, December to February',
      body: 'Cold, quiet and startlingly clear. Lower treks like Langtang and Poon Hill are excellent. High passes may be closed.',
    },
    {
      season: 'Monsoon, June to early September',
      body: 'Wet in most of the country, with leeches and cloud. The rain-shadow regions — Upper Mustang and Dolpo — are at their best.',
    },
  ],
  budgetHints: [
    {
      band: 'Under $1,500 per person',
      body: 'A shorter teahouse trek, a cultural tour, or a Chitwan safari. Everything below 4,000m and under ten days.',
    },
    {
      band: '$1,500 to $3,000',
      body: 'The classic two-week treks — Everest Base Camp, the Annapurna Sanctuary, Manaslu. This is where most people land.',
    },
    {
      band: '$3,000 to $6,000',
      body: 'Trekking peaks like Island Peak and Mera Peak, restricted areas like Upper Mustang, or a private trip with upgraded lodges.',
    },
    {
      band: 'Above $6,000',
      body: 'Full expeditions with oxygen and a 1:1 Sherpa ratio, or long private itineraries with helicopter support.',
    },
  ],
  reassurance:
    'These are planning bands, not a quote. Prices are display-only in this demo; no payment is processed and no request is sent from this page.',
}

export default planYourTripPage
