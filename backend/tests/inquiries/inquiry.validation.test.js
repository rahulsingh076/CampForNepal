// Public submission validation. No database needed.
//
// The five payloads at the top are the ones the live React forms actually
// produce. If one of them stops passing, the frontend contract has broken.
import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import { validateInquirySubmission } from '../../src/modules/inquiries/inquiry.validation.js'

const config = { inquiry: { maxMessageLength: 5000, maxNoteLength: 3000, maxPeople: 100 } }

const base = { fullName: 'Jiwoo Park', email: 'jiwoo@example.invalid', consent: true }

function accept(body) {
  return validateInquirySubmission(body, config)
}

function refuse(body) {
  try {
    validateInquirySubmission(body, config)
    return null
  } catch (error) {
    return error
  }
}

describe('the payloads the live frontend forms send', () => {
  test('ContactForm', () => {
    const clean = accept({
      ...base, type: 'contact', phone: '', subject: 'Hello',
      message: 'A question', country: 'South Korea', preferredDate: null,
    })
    assert.equal(clean.type, 'contact')
    assert.equal(clean.contact.country, 'South Korea')
  })

  test('InquiryForm (package)', () => {
    const clean = accept({
      ...base, type: 'package_inquiry', phone: '+977 980 111 2222', groupSize: 4,
      preferredDate: '2026-10-01', packageId: '507f1f77bcf86cd799439011',
      subject: 'Inquiry: Annapurna', message: '',
    })
    assert.equal(clean.trip.numberOfPeople, 4)
    assert.ok(clean.trip.travelDate instanceof Date)
  })

  test('CallbackForm — it sends email as an empty string', () => {
    // Empty means "not given", not "invalid". Reading it the other way would
    // reject every callback request the site currently produces.
    const clean = accept({
      type: 'callback', fullName: 'Jiwoo Park', email: '', phone: '+977 980 111 2222',
      country: 'Nepal', subject: 'Callback request', message: 'Best time: morning', consent: true,
    })
    assert.equal(clean.contact.email, '')
    assert.equal(clean.contact.phone, '+977 980 111 2222')
  })

  test('GuideAvailabilityForm', () => {
    const clean = accept({
      ...base, type: 'guide_request', phone: '+977 980 111 2222',
      guideId: '507f1f77bcf86cd799439012', groupSize: 2, preferredDate: '2026-11-02',
      subject: 'Availability', message: '',
    })
    assert.equal(clean.trip.guideId, '507f1f77bcf86cd799439012')
  })

  test('CustomTripForm', () => {
    const clean = accept({
      ...base, type: 'custom_trip', phone: '+82 10 1234 5678', country: 'South Korea',
      preferredDate: '2026-09-01', groupSize: 2, subject: 'Custom trip request',
      message: 'Trip type: Trekking\nBudget: over6000',
    })
    assert.match(clean.message, /Trekking/)
  })
})

describe('privileged fields are refused, never stripped', () => {
  // Stripping would let somebody probe which fields exist by watching what
  // survives. A 400 says "no" once and stops the request.
  const FORBIDDEN = [
    'status', 'priority', 'source', 'assignedToUserId', 'assignedTo', 'userId',
    'internalNotes', 'statusHistory', 'convertedBookingId', 'referenceCode',
    'idempotencyKeyHash', 'spamSignals', 'submissionMetadata', 'consentAcceptedAt',
    'privacyPolicyVersion', 'password', 'passwordHash', 'role', 'sessionVersion',
    'createdAt', 'updatedAt', '_id', 'id',
  ]

  for (const field of FORBIDDEN) {
    test(`"${field}" in the body is a 400`, () => {
      const error = refuse({ ...base, type: 'contact', message: 'hi', [field]: 'x' })
      assert.equal(error?.status, 400)
      assert.ok(error.meta.errors[field])
    })
  }

  test('no privileged field appears in the cleaned result', () => {
    const clean = accept({ ...base, type: 'contact', message: 'hi' })
    for (const field of ['status', 'priority', 'source', 'userId', 'assignedToUserId', 'referenceCode']) {
      assert.equal(clean[field], undefined, field)
    }
  })
})

describe('injection and shape', () => {
  test('an operator object where a string belongs is refused', () => {
    assert.equal(refuse({ ...base, type: 'contact', message: 'hi', email: { $ne: null } })?.status, 400)
    assert.equal(refuse({ ...base, type: 'package_inquiry', packageId: { $gt: '' } })?.status, 400)
  })

  test('a key starting with $ or containing a dot is refused', () => {
    assert.equal(refuse({ ...base, type: 'contact', message: 'hi', $where: 'x' })?.status, 400)
    assert.equal(refuse({ ...base, type: 'contact', message: 'hi', 'a.b': 'x' })?.status, 400)
  })

  test('an unknown field is refused rather than ignored', () => {
    // A typo like "emial" should tell somebody, not vanish.
    const error = refuse({ ...base, type: 'contact', message: 'hi', emial: 'typo@example.invalid' })
    assert.equal(error?.status, 400)
    assert.ok(error.meta.errors.emial)
  })

  test('a non-object body is refused', () => {
    assert.equal(refuse([])?.status, 400)
    assert.equal(refuse('a string')?.status, 400)
  })
})

describe('common rules', () => {
  test('at least one contact route is required', () => {
    const error = refuse({ fullName: 'A Person', type: 'contact', message: 'hi', consent: true })
    assert.equal(error?.status, 400)
    assert.ok(error.meta.errors.email)
  })

  test('any one contact route is enough', () => {
    assert.ok(accept({ fullName: 'A Person', type: 'contact', message: 'hi', consent: true, email: 'a@b.invalid' }))
    assert.ok(accept({ fullName: 'A Person', type: 'contact', message: 'hi', consent: true, phone: '+977 980 111 2222' }))
    assert.ok(accept({ fullName: 'A Person', type: 'contact', message: 'hi', consent: true, whatsapp: '+977 980 111 2222' }))
  })

  test('a malformed email is refused', () => {
    assert.ok(refuse({ ...base, type: 'contact', message: 'hi', email: 'not-an-email' })?.meta.errors.email)
  })

  test('consent must be affirmative', () => {
    for (const consent of [undefined, false, 'false', 0, '']) {
      const body = { ...base, type: 'contact', message: 'hi' }
      if (consent !== undefined) body.consent = consent
      else delete body.consent
      assert.ok(refuse(body)?.meta.errors.consent, String(consent))
    }
  })

  test('a ticked box is read from any of the usual encodings', () => {
    for (const consent of [true, 'true', 'on', 'yes', 1, '1']) {
      assert.equal(accept({ ...base, type: 'contact', message: 'hi', consent }).consentAccepted, true, String(consent))
    }
  })

  test('the group size must be a whole number within the limit', () => {
    for (const groupSize of [0, -1, 2.5, 101, 'many']) {
      assert.ok(refuse({ ...base, type: 'contact', message: 'hi', groupSize })?.meta.errors.groupSize, String(groupSize))
    }
    assert.equal(accept({ ...base, type: 'contact', message: 'hi', groupSize: 100 }).trip.numberOfPeople, 100)
  })

  test('an unreadable date is refused rather than silently dropped', () => {
    // A trip date that quietly disappears is worse than one that is rejected.
    assert.ok(refuse({ ...base, type: 'contact', message: 'hi', preferredDate: 'next tuesday-ish' })?.meta.errors.preferredDate)
  })

  test('the message length limit is enforced', () => {
    assert.ok(refuse({ ...base, type: 'contact', message: 'x'.repeat(5001) })?.meta.errors.message)
    assert.ok(accept({ ...base, type: 'contact', message: 'x'.repeat(5000) }))
  })

  test('a missing or unknown type is refused', () => {
    assert.ok(refuse({ ...base, message: 'hi' })?.meta.errors.type)
    assert.ok(refuse({ ...base, type: 'complaint', message: 'hi' })?.meta.errors.type)
  })

  test('control characters are refused', () => {
    const withNull = 'hello' + String.fromCharCode(0) + 'there'
    assert.ok(refuse({ ...base, type: 'contact', message: withNull })?.meta.errors.message)
  })

  test('ordinary Unicode survives untouched', () => {
    const clean = accept({ ...base, type: 'contact', message: 'सगरमाथा 안나푸르나 🏔️' })
    assert.equal(clean.message, 'सगरमाथा 안나푸르나 🏔️')
  })
})

describe('type-specific requirements', () => {
  test('a package inquiry needs a package', () => {
    assert.ok(refuse({ ...base, type: 'package_inquiry' })?.meta.errors.packageId)
  })

  test('a guide request needs a guide', () => {
    assert.ok(refuse({ ...base, type: 'guide_request' })?.meta.errors.guideId)
  })

  test('a contact message needs a message', () => {
    assert.ok(refuse({ ...base, type: 'contact' })?.meta.errors.message)
  })

  test('a callback needs a phone or WhatsApp — an email cannot be called', () => {
    assert.ok(refuse({ ...base, type: 'callback' })?.meta.errors.phone)
    assert.ok(accept({ ...base, type: 'callback', phone: '+977 980 111 2222' }))
    assert.ok(accept({ ...base, type: 'callback', whatsapp: '+977 980 111 2222' }))
  })

  test('an emergency needs a phone and a message', () => {
    assert.ok(refuse({ ...base, type: 'emergency', message: 'Stuck' })?.meta.errors.phone)
    assert.ok(refuse({ ...base, type: 'emergency', phone: '+977 980 111 2222' })?.meta.errors.message)
    assert.ok(accept({ ...base, type: 'emergency', phone: '+977 980 111 2222', message: 'Stuck at Lukla' }))
  })

  test('a custom trip needs enough context to act on, from any field', () => {
    // Not every preference is mandatory: somebody may describe the whole trip
    // in prose, or pick options instead. Either is enough.
    assert.ok(refuse({ ...base, type: 'custom_trip' })?.meta.errors.message)
    assert.ok(accept({ ...base, type: 'custom_trip', message: 'Two weeks trekking' }))
    assert.ok(accept({ ...base, type: 'custom_trip', destinationInterest: 'Annapurna' }))
    assert.ok(accept({ ...base, type: 'custom_trip', groupSize: 2 }))
  })
})

describe('field aliasing between the frontend and the canonical names', () => {
  test('preferredDate and travelDate normalise to the same value', () => {
    const a = accept({ ...base, type: 'contact', message: 'hi', preferredDate: '2026-10-01' })
    const b = accept({ ...base, type: 'contact', message: 'hi', travelDate: '2026-10-01' })
    assert.equal(a.trip.travelDate.toISOString(), b.trip.travelDate.toISOString())
  })

  test('groupSize and numberOfPeople normalise to the same value', () => {
    const a = accept({ ...base, type: 'contact', message: 'hi', groupSize: 3 })
    const b = accept({ ...base, type: 'contact', message: 'hi', numberOfPeople: 3 })
    assert.equal(a.trip.numberOfPeople, b.trip.numberOfPeople)
  })

  test('consent and consentAccepted are both honoured', () => {
    assert.equal(accept({ ...base, type: 'contact', message: 'hi', consent: true }).consentAccepted, true)
    const body = { fullName: 'A Person', email: 'a@b.invalid', type: 'contact', message: 'hi', consentAccepted: true }
    assert.equal(accept(body).consentAccepted, true)
  })
})
