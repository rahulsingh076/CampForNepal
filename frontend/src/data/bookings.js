// Seed bookings use the simplified public state: booked or cancelled.
// userId is the account that manages the
// booking — walk-in and phone customers have no account, so those bookings
// belong to the staff member who logged them. There are no payment fields.
const bookings = [
  {
    id: 'bkg-001',
    reference: 'CFN-2026-0142',
    userId: 'user-001',
    packageId: 'pkg-001',
    departureId: 'dep-001',
    travellers: { adults: 2, children: 0 },
    leadTraveller: {
      fullName: 'Ji-woo Park',
      email: 'jiwoo.park@campfornepal.example.com',
      phone: '+82 10 2245 8830',
      country: 'KR',
      passportProvided: true
    },
    specialRequests: 'Both trekkers are vegetarian. Please add one extra acclimatisation night at Namche Bazaar (3440 m) before moving up to Tengboche, and reserve rooms with attached bathrooms as far as Dingboche where they are available.',
    status: 'booked',
    statusHistory: [
      {
        status: 'booked',
        changedAt: '2026-06-12T04:35:00Z',
        note: 'Inquiry from the Everest Base Camp Trek page. Couple from Seoul planning their first trek above 4000 m, after a taste of the Khumbu on our helicopter day tour in May. Asked about an extra acclimatisation night.'
      },
      {
        status: 'booked',
        changedAt: '2026-06-16T08:20:00Z',
        note: 'Quotation sent for a 15-day plan with the extra Namche night included, priced for two with one porter.'
      },
      {
        status: 'booked',
        changedAt: '2026-06-18T09:10:00Z',
        note: 'Itinerary agreed on a video call and the couple asked to book. Lukla flights may route via Manthali (Ramechhap) in October, so a 03:00 road transfer from Kathmandu was explained and accepted.'
      },
      {
        status: 'booked',
        changedAt: '2026-06-25T06:05:00Z',
        note: 'Passport scans received. Waiting on insurance certificates that state helicopter evacuation cover to 6000 m.'
      },
      {
        status: 'booked',
        changedAt: '2026-07-09T05:48:00Z',
        note: 'Insurance verified for helicopter rescue and treatment to 6000 m. Sagarmatha National Park entry and Khumbu Pasang Lhamu Rural Municipality permits will be issued in Kathmandu and Lukla.'
      },
      {
        status: 'booked',
        changedAt: '2026-07-12T10:30:00Z',
        note: 'Pemba Sherpa confirmed as lead guide for the 5 October departure, with one porter for two trekkers.'
      }
    ],
    documents: [
      { name: 'passport-jiwoo-park.pdf', type: 'passport', status: 'verified', sizeKb: 486, uploadedAt: '2026-06-22T11:20:00Z' },
      { name: 'passport-min-jae-seo.pdf', type: 'passport', status: 'verified', sizeKb: 502, uploadedAt: '2026-06-22T11:22:00Z' },
      { name: 'travel-insurance-heli-evacuation-6000m.pdf', type: 'insurance', status: 'verified', sizeKb: 1240, uploadedAt: '2026-07-08T14:02:00Z' },
      { name: 'permit-photos-2pax.zip', type: 'photo', status: 'verified', sizeKb: 864, uploadedAt: '2026-06-24T08:15:00Z' }
    ],
    documentsChecklist: [
      { label: 'Passport copy for each trekker', done: true },
      { label: 'Insurance with helicopter evacuation to 6,000 m', done: true },
      { label: 'Four passport photos per person for permits', done: true },
      { label: 'Arrival flight details', done: false }
    ],
    createdAt: '2026-06-12T04:35:00Z',
    updatedAt: '2026-07-12T10:30:00Z'
  },
  {
    id: 'bkg-002',
    reference: 'CFN-2026-0147',
    userId: 'user-003',
    packageId: 'pkg-002',
    departureId: 'dep-004',
    travellers: { adults: 2, children: 1 },
    leadTraveller: {
      fullName: 'Haruka Tanaka',
      email: 'haruka.tanaka@example.com',
      phone: '+81 90 4471 2280',
      country: 'JP',
      passportProvided: true
    },
    specialRequests: 'Travelling with a 12 year old. Please keep daily walking to roughly five hours, split the long climb from Chhomrong to Deurali across two days, and build in the hot springs at Jhinu Danda on the way down.',
    status: 'booked',
    statusHistory: [
      {
        status: 'booked',
        changedAt: '2026-06-30T12:14:00Z',
        note: 'Family inquiry for the Annapurna Base Camp Trek, logged by the support desk. Asked whether the sanctuary at 4130 m is safe for a child.'
      },
      {
        status: 'booked',
        changedAt: '2026-07-06T07:40:00Z',
        note: 'Quoted a softer eleven day plan with a shorter stage above Chhomrong. Explained that the maximum sleeping altitude is Machhapuchhre Base Camp at 3700 m and that the group descends the same day after reaching ABC, which suits younger trekkers.'
      },
      {
        status: 'booked',
        changedAt: '2026-07-10T02:25:00Z',
        note: 'Family accepted the eleven day plan and asked to book the October departure.'
      },
      {
        status: 'booked',
        changedAt: '2026-07-19T09:55:00Z',
        note: 'Adult passports and ACAP photos received. Still waiting on the passport copy and travel insurance for the child before TIMS and ACAP cards can be issued in Pokhara.'
      }
    ],
    documents: [
      { name: 'passport-haruka-tanaka.pdf', type: 'passport', status: 'received', sizeKb: 455, uploadedAt: '2026-07-18T03:31:00Z' },
      { name: 'passport-kenji-tanaka.pdf', type: 'passport', status: 'received', sizeKb: 471, uploadedAt: '2026-07-18T03:33:00Z' },
      { name: 'acap-photos-adults.zip', type: 'photo', status: 'received', sizeKb: 612, uploadedAt: '2026-07-18T03:40:00Z' }
    ],
    documentsChecklist: [
      { label: 'Passport copy for each adult', done: true },
      { label: 'Passport copy for the child', done: false },
      { label: 'ACAP photos for each traveller', done: true },
      { label: 'Travel insurance for the child', done: false }
    ],
    createdAt: '2026-06-30T12:14:00Z',
    updatedAt: '2026-07-19T09:55:00Z'
  },
  {
    id: 'bkg-003',
    reference: 'CFN-2026-0089',
    userId: 'user-001',
    packageId: 'pkg-013',
    departureId: null,
    travellers: { adults: 2, children: 0 },
    leadTraveller: {
      fullName: 'Ji-woo Park',
      email: 'jiwoo.park@campfornepal.example.com',
      phone: '+82 10 2245 8830',
      country: 'KR',
      passportProvided: true
    },
    specialRequests: 'Requested window seats on both legs and a photography stop at Kala Patthar.',
    status: 'booked',
    statusHistory: [
      {
        status: 'booked',
        changedAt: '2026-04-21T15:02:00Z',
        note: 'Inquiry for the Everest Base Camp helicopter day tour, ahead of a trek the couple is planning for the autumn.'
      },
      {
        status: 'booked',
        changedAt: '2026-04-22T09:15:00Z',
        note: 'Sharing-flight price quoted for 6 May, departing Tribhuvan domestic terminal at 06:15.'
      },
      {
        status: 'booked',
        changedAt: '2026-04-23T04:26:00Z',
        note: 'Date accepted. Route explained: Lukla fuel stop, landing near Kala Patthar at 5545 m for five to ten minutes, then breakfast at Everest View Hotel, Syangboche (3880 m).'
      },
      {
        status: 'booked',
        changedAt: '2026-04-24T05:10:00Z',
        note: 'Passport copies and the operator weight declaration requested.'
      },
      {
        status: 'booked',
        changedAt: '2026-04-28T06:33:00Z',
        note: 'Seats confirmed. Travellers briefed that the Kala Patthar landing is short and that mild breathlessness at 5545 m after a rapid ascent is normal but must be reported to the crew.'
      },
      {
        status: 'booked',
        changedAt: '2026-05-05T11:00:00Z',
        note: 'Pickup confirmed for 05:15 from the hotel in Thamel. Forecast for the morning is clear.'
      },
      {
        status: 'booked',
        changedAt: '2026-05-06T00:20:00Z',
        note: 'Picked up on time. Clear morning, flight departed on schedule.'
      },
      {
        status: 'booked',
        changedAt: '2026-05-06T06:40:00Z',
        note: 'Back in Kathmandu by 11:40 local time. Both landings completed.'
      },
      {
        status: 'booked',
        changedAt: '2026-05-08T04:00:00Z',
        note: 'Review invitation sent with a small gallery of photos taken by the crew.'
      }
    ],
    documents: [
      { name: 'passport-jiwoo-park.pdf', type: 'passport', status: 'verified', sizeKb: 486, uploadedAt: '2026-04-25T17:44:00Z' },
      { name: 'passport-min-jae-seo.pdf', type: 'passport', status: 'verified', sizeKb: 502, uploadedAt: '2026-04-25T17:46:00Z' },
      { name: 'heli-weight-declaration-signed.pdf', type: 'form', status: 'verified', sizeKb: 188, uploadedAt: '2026-04-27T10:12:00Z' }
    ],
    documentsChecklist: [
      { label: 'Passport copy for each passenger', done: true },
      { label: 'Signed operator weight declaration', done: true }
    ],
    createdAt: '2026-04-21T15:02:00Z',
    updatedAt: '2026-05-08T04:00:00Z'
  },
  {
    id: 'bkg-004',
    reference: 'CFN-2026-0118',
    userId: 'user-005',
    packageId: 'pkg-006',
    departureId: null,
    travellers: { adults: 4, children: 0 },
    leadTraveller: {
      fullName: 'Oliver Hastings',
      email: 'oliver.hastings@example.com',
      phone: '+44 7700 900318',
      country: 'GB',
      passportProvided: true
    },
    specialRequests: 'Group of four photographers. Two nights in Lo Manthang rather than one, early starts for morning light on the Chhoser cave village, and a guide who can explain the Tibetan Buddhist wall paintings at Thubchen and Jampa monasteries.',
    status: 'booked',
    statusHistory: [
      {
        status: 'booked',
        changedAt: '2026-03-11T10:48:00Z',
        note: 'Asked whether Upper Mustang really can be walked during the monsoon. Confirmed that it sits in the rain shadow north of the Annapurna and Dhaulagiri wall and stays largely dry through July and August.'
      },
      {
        status: 'booked',
        changedAt: '2026-04-02T08:15:00Z',
        note: 'Thirteen day plan quoted with an extra night in Lo Manthang. Route Jomsom, Kagbeni, Chele, Syangboche, Ghami, Tsarang, Lo Manthang, returning via Yara and Tangge. Highest pass on the trail is around 4200 m.'
      },
      {
        status: 'booked',
        changedAt: '2026-04-14T16:50:00Z',
        note: 'All four confirmed the July dates and asked to proceed.'
      },
      {
        status: 'booked',
        changedAt: '2026-04-20T09:30:00Z',
        note: 'Restricted area permit for Upper Mustang costs USD 500 per person for ten days and requires original passports plus Nepal visa pages. Waiting on scans of the visa stamps once issued on arrival.'
      },
      {
        status: 'booked',
        changedAt: '2026-06-15T05:20:00Z',
        note: 'Restricted area permit and ACAP applications lodged through our Kathmandu office. Group briefed that a licensed guide and a minimum of two trekkers are legally required beyond Kagbeni.'
      },
      {
        status: 'booked',
        changedAt: '2026-07-20T02:15:00Z',
        note: 'Group flew Pokhara to Jomsom on 20 July and started walking the same afternoon. Currently on schedule in Lo Manthang, checked in by satellite message on 29 July.'
      }
    ],
    documents: [
      { name: 'passports-group-of-4.zip', type: 'passport', status: 'verified', sizeKb: 2140, uploadedAt: '2026-04-18T13:05:00Z' },
      { name: 'nepal-visa-pages-group.pdf', type: 'passport', status: 'verified', sizeKb: 1360, uploadedAt: '2026-07-16T09:44:00Z' },
      { name: 'insurance-certificates-group.pdf', type: 'insurance', status: 'verified', sizeKb: 1585, uploadedAt: '2026-05-30T16:21:00Z' },
      { name: 'emergency-contacts-form.pdf', type: 'form', status: 'verified', sizeKb: 96, uploadedAt: '2026-05-30T16:25:00Z' }
    ],
    documentsChecklist: [
      { label: 'Original passport details for the restricted area permit', done: true },
      { label: 'Nepal visa page scans', done: true },
      { label: 'Insurance certificate for each trekker', done: true },
      { label: 'Emergency contact form', done: true }
    ],
    createdAt: '2026-03-11T10:48:00Z',
    updatedAt: '2026-07-29T11:05:00Z'
  },
  {
    id: 'bkg-005',
    reference: 'CFN-2026-0155',
    userId: 'user-005',
    packageId: 'pkg-007',
    departureId: 'dep-009',
    travellers: { adults: 2, children: 0 },
    leadTraveller: {
      fullName: 'Liam Bradshaw',
      email: 'liam.bradshaw@example.com',
      phone: '+61 412 668 903',
      country: 'AU',
      passportProvided: true
    },
    specialRequests: 'Both climbers summited Mera Peak in 2024. Please add one extra day at Chhukung for rope, jumar and crampon practice on the Imja glacier before moving to high camp.',
    status: 'booked',
    statusHistory: [
      {
        status: 'booked',
        changedAt: '2026-07-08T22:40:00Z',
        note: 'Inquiry for Island Peak (Imja Tse, 6189 m) on the autumn departure. Asked about the fixed rope section on the headwall and the crevassed glacier crossing.'
      },
      {
        status: 'booked',
        changedAt: '2026-07-22T06:12:00Z',
        note: 'Seventeen day itinerary quoted with an extra training day at Chhukung (4730 m). Climbing ratio set at one guide to two climbers on summit day. Nepal Mountaineering Association permit and Sagarmatha National Park entry to be arranged in Kathmandu once the climbers confirm.'
      }
    ],
    documents: [
      { name: 'passport-liam-bradshaw.pdf', type: 'passport', status: 'received', sizeKb: 466, uploadedAt: '2026-07-24T02:50:00Z' },
      { name: 'climbing-experience-summary.pdf', type: 'form', status: 'received', sizeKb: 214, uploadedAt: '2026-07-24T02:55:00Z' }
    ],
    documentsChecklist: [
      { label: 'Passport copy for each climber', done: true },
      { label: 'Climbing experience summary', done: true },
      { label: 'Insurance with rescue cover to 6,200 m', done: false }
    ],
    createdAt: '2026-07-08T22:40:00Z',
    updatedAt: '2026-07-24T02:55:00Z'
  },
  {
    id: 'bkg-006',
    reference: 'CFN-2026-0161',
    userId: 'user-003',
    packageId: 'pkg-011',
    departureId: null,
    travellers: { adults: 2, children: 2 },
    leadTraveller: {
      fullName: 'Ananya Iyer',
      email: 'ananya.iyer@example.com',
      phone: '+91 98204 47159',
      country: 'IN',
      passportProvided: false
    },
    specialRequests: 'Family with children aged 7 and 10. Asked for a jeep safari rather than a long walking safari, and a lodge inside Sauraha within walking distance of the elephant breeding centre.',
    status: 'booked',
    statusHistory: [
      {
        status: 'booked',
        changedAt: '2026-07-28T11:30:00Z',
        note: 'Walk in inquiry logged at the Thamel office by the support desk. Family wants Chitwan in late October, when the grass has been cut and rhino sightings are at their best. Availability check with the lodge in progress.'
      }
    ],
    documents: [],
    documentsChecklist: [],
    createdAt: '2026-07-28T11:30:00Z',
    updatedAt: '2026-07-28T11:30:00Z'
  },
  {
    id: 'bkg-007',
    reference: 'CFN-2026-0133',
    userId: 'user-003',
    packageId: 'pkg-005',
    departureId: 'dep-007',
    travellers: { adults: 2, children: 0 },
    leadTraveller: {
      fullName: 'Kenji Watanabe',
      email: 'kenji.watanabe@example.com',
      phone: '+81 80 3319 5427',
      country: 'JP',
      passportProvided: true
    },
    specialRequests: 'Requested a Japanese speaking assistant guide and a tea house with a heated dining room at Samagaon for the acclimatisation days.',
    status: 'cancelled',
    statusHistory: [
      {
        status: 'booked',
        changedAt: '2026-05-19T13:22:00Z',
        note: 'Inquiry for the Manaslu Circuit autumn departure, crossing Larke La at 5106 m.'
      },
      {
        status: 'booked',
        changedAt: '2026-05-29T07:44:00Z',
        note: 'Fifteen day itinerary quoted with two acclimatisation nights at Samagaon (3530 m) including the day walk to Pungyen Gompa or Manaslu Base Camp.'
      },
      {
        status: 'booked',
        changedAt: '2026-06-08T04:10:00Z',
        note: 'Manaslu restricted area permit needs original passports and a minimum of two trekkers with a licensed guide, so passport scans and visa dates were requested along with Manaslu Conservation Area and Annapurna Conservation Area permits.'
      },
      {
        status: 'cancelled',
        changedAt: '2026-07-02T08:05:00Z',
        note: 'Cancelled at the request of the traveller after a knee injury during training. Medical note received. The team has offered to hold the same itinerary for a spring 2027 departure whenever the traveller is cleared to walk long descents again.'
      }
    ],
    documents: [
      { name: 'passport-kenji-watanabe.pdf', type: 'passport', status: 'received', sizeKb: 448, uploadedAt: '2026-06-11T05:30:00Z' },
      { name: 'medical-note-knee-injury.pdf', type: 'medical', status: 'received', sizeKb: 132, uploadedAt: '2026-07-01T23:12:00Z' }
    ],
    documentsChecklist: [
      { label: 'Passport copy for each trekker', done: true },
      { label: 'Medical note for the cancellation file', done: true }
    ],
    createdAt: '2026-05-19T13:22:00Z',
    updatedAt: '2026-07-02T08:05:00Z'
  },
  {
    id: 'bkg-008',
    reference: 'CFN-2026-0166',
    userId: 'user-005',
    packageId: 'pkg-009',
    departureId: 'dep-011',
    travellers: { adults: 1, children: 0 },
    leadTraveller: {
      fullName: 'Rachel Nguyen',
      email: 'rachel.nguyen@example.com',
      phone: '+1 503 555 0129',
      country: 'US',
      passportProvided: true
    },
    specialRequests: 'Requests a one to one climbing Sherpa above Camp 2, four bottles of supplementary oxygen beyond the standard allocation, and a personal weather briefing call with the expedition leader before every rotation.',
    status: 'booked',
    statusHistory: [
      {
        status: 'booked',
        changedAt: '2026-07-04T16:18:00Z',
        note: 'Inquiry for the spring 2027 Everest expedition. Climber has summited Manaslu (8163 m) in 2024 and Ama Dablam (6812 m) in 2023.'
      },
      {
        status: 'booked',
        changedAt: '2026-07-15T10:02:00Z',
        note: 'Quotation sent and a place held on the south side expedition. Sixty days on the ground, arrival in Kathmandu late March 2027, Base Camp at 5364 m, three rotations through the Khumbu Icefall before the summit window in mid to late May.'
      },
      {
        status: 'booked',
        changedAt: '2026-07-18T15:44:00Z',
        note: 'Climber confirmed the held place and asked to proceed with the expedition paperwork.'
      },
      {
        status: 'booked',
        changedAt: '2026-07-27T09:38:00Z',
        note: 'Climbing CV and passport received. Outstanding: a physician signed altitude fitness certificate dated within six months of departure, and an insurance policy that explicitly covers climbing and helicopter rescue to 8849 m. The expedition permit application to the Department of Tourism cannot be lodged until both are in hand.'
      }
    ],
    documents: [
      { name: 'passport-rachel-nguyen.pdf', type: 'passport', status: 'received', sizeKb: 498, uploadedAt: '2026-07-20T18:07:00Z' },
      { name: 'climbing-cv-8000m-record.pdf', type: 'form', status: 'received', sizeKb: 356, uploadedAt: '2026-07-20T18:11:00Z' },
      { name: 'expedition-photos-for-permit.zip', type: 'photo', status: 'received', sizeKb: 940, uploadedAt: '2026-07-26T20:40:00Z' }
    ],
    documentsChecklist: [
      { label: 'Passport copy', done: true },
      { label: 'Climbing CV with 8,000 m record', done: true },
      { label: 'Altitude fitness certificate from a physician', done: false },
      { label: 'Insurance covering climbing and rescue to 8,849 m', done: false }
    ],
    createdAt: '2026-07-04T16:18:00Z',
    updatedAt: '2026-07-27T09:38:00Z'
  },
  {
    id: 'bkg-009',
    reference: 'CFN-2026-0061',
    userId: 'user-005',
    packageId: 'pkg-010',
    departureId: null,
    travellers: { adults: 6, children: 0 },
    leadTraveller: {
      fullName: 'Wei Zhang',
      email: 'wei.zhang@example.com',
      phone: '+86 138 0013 7742',
      country: 'CN',
      passportProvided: true
    },
    specialRequests: 'Corporate group of six. Asked for a Mandarin speaking cultural guide, one vehicle for the whole group, and an early start at Boudhanath to join the morning kora before the crowds arrive.',
    status: 'booked',
    statusHistory: [
      {
        status: 'booked',
        changedAt: '2026-02-02T03:55:00Z',
        note: 'Group inquiry received through the corporate contact form for a four day Kathmandu Valley heritage tour.'
      },
      {
        status: 'booked',
        changedAt: '2026-02-11T06:40:00Z',
        note: 'Four days quoted: Patan Durbar Square and the Patan Museum, Bhaktapur Durbar Square, Swayambhunath and Pashupatinath, then Boudhanath and Changu Narayan.'
      },
      {
        status: 'booked',
        changedAt: '2026-02-18T08:05:00Z',
        note: 'Company confirmed the March dates for all six travellers.'
      },
      {
        status: 'booked',
        changedAt: '2026-02-24T09:12:00Z',
        note: 'Hotel in Lazimpat confirmed for three nights and the vehicle reserved.'
      },
      {
        status: 'booked',
        changedAt: '2026-02-26T04:45:00Z',
        note: 'Mandarin speaking cultural guide assigned for all four days.'
      },
      {
        status: 'booked',
        changedAt: '2026-03-16T01:30:00Z',
        note: 'Group met at the airport on 16 March. Tour running as planned.'
      },
      {
        status: 'booked',
        changedAt: '2026-03-19T12:10:00Z',
        note: 'Tour finished on 19 March. Group asked for a Pokhara extension quote for a future visit.'
      },
      {
        status: 'booked',
        changedAt: '2026-03-24T07:20:00Z',
        note: 'Post-trip paperwork complete and the Pokhara extension noted as a future lead. File closed.'
      }
    ],
    documents: [
      { name: 'passports-group-of-6.zip', type: 'passport', status: 'verified', sizeKb: 3120, uploadedAt: '2026-02-20T07:15:00Z' },
      { name: 'group-rooming-list.pdf', type: 'form', status: 'verified', sizeKb: 84, uploadedAt: '2026-02-21T04:02:00Z' }
    ],
    documentsChecklist: [
      { label: 'Passport copy for each traveller', done: true },
      { label: 'Rooming list', done: true }
    ],
    createdAt: '2026-02-02T03:55:00Z',
    updatedAt: '2026-03-24T07:20:00Z'
  },
  {
    id: 'bkg-010',
    reference: 'CFN-2026-0172',
    userId: 'user-003',
    packageId: 'pkg-003',
    departureId: 'dep-005',
    travellers: { adults: 3, children: 0 },
    leadTraveller: {
      fullName: 'Sophie Whitcombe',
      email: 'sophie.whitcombe@example.com',
      phone: '+44 7700 900642',
      country: 'GB',
      passportProvided: true
    },
    specialRequests: null,
    status: 'booked',
    statusHistory: [
      {
        status: 'booked',
        changedAt: '2026-06-27T19:26:00Z',
        note: 'Three friends asked about the Annapurna Circuit, and how much of the old trail is now road and where the walking is still good.'
      },
      {
        status: 'booked',
        changedAt: '2026-07-03T08:34:00Z',
        note: 'Sixteen day plan quoted using the NATT side trails from Chame to Manang to avoid the road, one acclimatisation day at Manang (3540 m) with the walk to Ice Lake, and the Thorong La crossing at 5416 m on day eleven.'
      },
      {
        status: 'booked',
        changedAt: '2026-07-07T18:12:00Z',
        note: 'All three confirmed the November departure and asked to book.'
      },
      {
        status: 'booked',
        changedAt: '2026-07-11T05:50:00Z',
        note: 'Passports and ACAP photos received for all three. Awaiting the third insurance certificate.'
      },
      {
        status: 'booked',
        changedAt: '2026-07-24T07:15:00Z',
        note: 'All documents complete. TIMS and ACAP cards to be issued in Kathmandu. Group briefed on Thorong La: a 4:30 start from Thorong Phedi, no ascent if anyone shows signs of acute mountain sickness, and a jeep to Jomsom plus the Jomsom to Pokhara flight after Muktinath.'
      }
    ],
    documents: [
      { name: 'passports-group-of-3.zip', type: 'passport', status: 'verified', sizeKb: 1490, uploadedAt: '2026-07-10T13:18:00Z' },
      { name: 'acap-tims-photos.zip', type: 'photo', status: 'verified', sizeKb: 720, uploadedAt: '2026-07-10T13:22:00Z' },
      { name: 'insurance-certificates-group.pdf', type: 'insurance', status: 'verified', sizeKb: 1105, uploadedAt: '2026-07-23T15:44:00Z' }
    ],
    documentsChecklist: [
      { label: 'Passport copy for each trekker', done: true },
      { label: 'ACAP and TIMS photos', done: true },
      { label: 'Insurance certificate for each trekker', done: true }
    ],
    createdAt: '2026-06-27T19:26:00Z',
    updatedAt: '2026-07-24T07:15:00Z'
  },
  {
    id: 'bkg-011',
    reference: 'CFN-2026-0178',
    userId: 'user-001',
    packageId: 'pkg-011',
    departureId: null,
    travellers: { adults: 2, children: 0 },
    leadTraveller: {
      fullName: 'Ji-woo Park',
      email: 'jiwoo.park@campfornepal.example.com',
      phone: '+82 10 2245 8830',
      country: 'KR',
      passportProvided: true
    },
    specialRequests: 'Thinking about three quiet days after the October trek — jeep safari rather than a long walking safari, and time by the river in the evenings.',
    status: 'booked',
    statusHistory: [
      {
        status: 'booked',
        changedAt: '2026-07-26T13:05:00Z',
        note: 'Asked about adding a short Chitwan safari in early November, straight after the Everest Base Camp trek, to rest before flying home.'
      },
      {
        status: 'booked',
        changedAt: '2026-07-29T06:40:00Z',
        note: 'Three day, two night Sauraha plan quoted for early November with a jeep safari, a canoe trip on the Rapti and the community forest walk. Waiting to hear back.'
      }
    ],
    documents: [],
    documentsChecklist: [],
    createdAt: '2026-07-26T13:05:00Z',
    updatedAt: '2026-07-29T06:40:00Z'
  }
]

export default bookings
