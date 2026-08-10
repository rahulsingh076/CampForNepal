// In-app template copy lives with the rest of the frontend CMS data. Delivery
// channels stay disabled until the backend can send email and WhatsApp safely.
const notificationTemplates = {
  templates: {
    new_inquiry: {
      label: 'New inquiry',
      title: 'New {{typeLabel}} inquiry',
      message: '{{fullName}} asked about {{subject}}.',
    },
    booking_status: {
      label: 'Booking status change',
      title: 'Booking {{reference}} is now {{statusLabel}}',
      message: '{{packageTitle}} has moved to {{statusLabel}}.',
    },
    review_submitted: {
      label: 'Review submitted',
      title: 'New review awaiting moderation',
      message: '{{fullName}} submitted a review for {{packageTitle}}.',
    },
    post_published: {
      label: 'Post published',
      title: 'Post published: {{title}}',
      message: '{{author}} published a {{contentTypeLabel}} for the public feed.',
    },
  },
  delivery: {
    email: { enabled: false, label: 'Email delivery (V2)' },
    whatsapp: { enabled: false, label: 'WhatsApp delivery (V2)' },
  },
}

export default notificationTemplates
