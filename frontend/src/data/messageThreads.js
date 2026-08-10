// Mock support conversations for the customer dashboard. A reply from the
// dashboard appends to messages[] in the localStorage overlay — nothing is sent.
const messageThreads = [
  {
    id: 'thr-001',
    userId: 'user-001',
    subject: 'Insurance for the Everest Base Camp trek',
    relatedBookingId: 'bkg-001',
    status: 'open',
    messages: [
      {
        from: 'customer',
        authorName: 'Ji-woo Park',
        body: 'Hello! Our insurer offers two mountain policies. One covers helicopter evacuation to 5,000 m and the other to 6,000 m. The trek only goes to 5,545 m at Kala Patthar, so is the cheaper one enough?',
        sentAt: '2026-07-05T09:12:00Z'
      },
      {
        from: 'support',
        authorName: 'Anjali Shrestha',
        body: 'Good question — please take the 6,000 m policy. Kala Patthar is 5,545 m, and rescue cover needs headroom above the highest point you reach, not an exact match. Most insurers also round trek altitudes up when they assess a claim. The certificate should state helicopter evacuation explicitly.',
        sentAt: '2026-07-05T11:40:00Z'
      },
      {
        from: 'customer',
        authorName: 'Ji-woo Park',
        body: 'That makes sense. We have bought the 6,000 m policy and uploaded the certificates to our booking.',
        sentAt: '2026-07-08T14:05:00Z'
      },
      {
        from: 'support',
        authorName: 'Anjali Shrestha',
        body: 'Received and verified — your booking is fully confirmed now. Pemba will be your lead guide; he will call you the evening you land in Kathmandu.',
        sentAt: '2026-07-09T06:02:00Z'
      }
    ],
    createdAt: '2026-07-05T09:12:00Z',
    updatedAt: '2026-07-09T06:02:00Z'
  },
  {
    id: 'thr-002',
    userId: 'user-001',
    subject: 'Vegetarian food on the trail',
    relatedBookingId: 'bkg-001',
    status: 'open',
    messages: [
      {
        from: 'customer',
        authorName: 'Ji-woo Park',
        body: 'We are both vegetarian. How easy is that above Namche? We are happy to eat dal bhat every day if we have to!',
        sentAt: '2026-07-21T08:30:00Z'
      },
      {
        from: 'support',
        authorName: 'Anjali Shrestha',
        body: 'Very easy — vegetarian is actually the sensible choice up there. Meat above Namche is carried in unrefrigerated, so our guides recommend everyone avoids it. Every lodge does dal bhat, fried noodles, momos, pasta and pancakes. Your guide will also tell the lodge the night before if you want anything prepared specially.',
        sentAt: '2026-07-21T10:15:00Z'
      }
    ],
    createdAt: '2026-07-21T08:30:00Z',
    updatedAt: '2026-07-21T10:15:00Z'
  },
  {
    id: 'thr-003',
    userId: 'user-001',
    subject: 'Photos from your helicopter tour',
    relatedBookingId: 'bkg-003',
    status: 'closed',
    messages: [
      {
        from: 'support',
        authorName: 'Anjali Shrestha',
        body: 'Hello Ji-woo! The crew took a few photos during your Kala Patthar landing on 6 May — they are attached to your booking file. We would love to hear how the morning was when you have a moment to leave a review.',
        sentAt: '2026-05-08T04:05:00Z'
      },
      {
        from: 'customer',
        authorName: 'Ji-woo Park',
        body: 'Thank you, the photos are wonderful. We will write a review once we stop showing them to everyone we know.',
        sentAt: '2026-05-09T12:44:00Z'
      }
    ],
    createdAt: '2026-05-08T04:05:00Z',
    updatedAt: '2026-05-09T12:44:00Z'
  }
]

export default messageThreads
