// The serializers, tested against plain objects.
//
// This is the regression guard for a prior serializer defect: `.lean()` returns a
// plain object and bypasses the schema's toJSON transform, so the `select:
// false` privacy guarantee stops applying. These serializers are allowlists
// precisely so that stops mattering — and these tests prove it by feeding them
// a document that carries every private field.
import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import {
  serializeInquiryDetail,
  serializeInquiryListItem,
  serializePublicInquiry,
} from '../../src/modules/inquiries/inquiry.serializer.js'

// A leaned document with everything private present, as if `.select()` had
// been forgotten entirely.
function leanInquiry(overrides = {}) {
  return {
    _id: '507f1f77bcf86cd799439011',
    __v: 3,
    referenceCode: 'CFN-2026-7K9Q2M',
    type: 'package_inquiry',
    status: 'new',
    priority: 'normal',
    source: 'website',
    contact: { fullName: 'Jiwoo Park', email: 'jiwoo@example.invalid', phone: '+977 980', country: 'South Korea' },
    trip: { numberOfPeople: 3, travelDate: new Date('2026-10-01') },
    snapshot: { packageTitle: 'Annapurna Base Camp', guideName: 'A Guide' },
    subject: 'Inquiry',
    message: 'A question',
    consent: { accepted: true, acceptedAt: new Date(), privacyPolicyVersion: 'test-policy' },
    createdAt: new Date('2026-08-01'),
    updatedAt: new Date('2026-08-02'),

    // Everything below must never reach a response.
    idempotencyKeyHash: 'a'.repeat(64),
    spamSignals: { honeypotTriggered: true, fastSubmission: true },
    submissionMetadata: { acceptLanguage: 'en-GB', submittedAt: new Date() },
    internalNotes: [],
    statusHistory: [],
    ...overrides,
  }
}

const NEVER_EXPOSED = [
  'idempotencyKeyHash',
  'spamSignals',
  'submissionMetadata',
  '_id',
  '__v',
  'passwordHash',
  'sessionVersion',
  'failedLoginAttempts',
  'lockUntil',
  'sourceId',
]

function assertClean(serialised, label) {
  const body = JSON.stringify(serialised)
  for (const field of NEVER_EXPOSED) {
    assert.ok(!body.includes(field), `${field} leaked from ${label}`)
  }
}

describe('the public response', () => {
  test('carries exactly three fields', () => {
    const output = serializePublicInquiry(leanInquiry())
    assert.deepEqual(Object.keys(output).sort(), ['referenceCode', 'status', 'submittedAt'])
  })

  test('carries no MongoDB id', () => {
    // The reference code is the public identifier. An ObjectId would leak the
    // creation time and a rough insertion order.
    const output = serializePublicInquiry(leanInquiry())
    assert.equal(output.id, undefined)
    assertClean(output, 'the public response')
  })

  test('carries no priority, assignment, or internal state', () => {
    const output = serializePublicInquiry(leanInquiry({ priority: 'urgent', assignedToUserId: 'x' }))
    assert.equal(output.priority, undefined)
    assert.equal(output.assignedTo, undefined)
  })
})

describe('the CRM list row', () => {
  test('exposes id as a string and drops _id and __v', () => {
    const row = serializeInquiryListItem(leanInquiry())
    assert.equal(row.id, '507f1f77bcf86cd799439011')
    assertClean(row, 'the list row')
  })

  test('carries no message body, notes, or history', () => {
    // A list endpoint returning these would ship every note in the database to
    // anybody who could reach page 1.
    const row = serializeInquiryListItem(
      leanInquiry({
        internalNotes: [{ text: 'private note', createdAt: new Date() }],
        statusHistory: [{ toStatus: 'new', changedAt: new Date() }],
      })
    )
    assert.equal(row.internalNotes, undefined)
    assert.equal(row.statusHistory, undefined)
    assert.equal(row.message, undefined)
    assert.ok(!JSON.stringify(row).includes('private note'))
  })

  test('serialises dates as ISO strings', () => {
    const row = serializeInquiryListItem(leanInquiry())
    assert.equal(typeof row.createdAt, 'string')
    assert.match(row.createdAt, /^\d{4}-\d{2}-\d{2}T/)
  })
})

describe('the CRM detail', () => {
  test('never exposes an internal field, even when the document carries it', () => {
    assertClean(serializeInquiryDetail(leanInquiry()), 'the detail view')
  })

  test('exposes notes and history when staff loaded them', () => {
    const detail = serializeInquiryDetail(
      leanInquiry({
        internalNotes: [{ authorUserId: { _id: 'u1', fullName: 'A Person', role: 'admin' }, text: 'Called', createdAt: new Date() }],
        statusHistory: [{ fromStatus: null, toStatus: 'new', changedAt: new Date(), changedByUserId: null }],
      })
    )
    assert.equal(detail.internalNotes.length, 1)
    assert.equal(detail.internalNotes[0].text, 'Called')
    assert.equal(detail.statusHistory.length, 1)
  })

  test('returns empty arrays when they were not loaded, rather than inventing data', () => {
    const detail = serializeInquiryDetail(leanInquiry({ internalNotes: undefined, statusHistory: undefined }))
    assert.deepEqual(detail.internalNotes, [])
    assert.deepEqual(detail.statusHistory, [])
  })

  test('a populated staff user is reduced to id, name, and role', () => {
    const detail = serializeInquiryDetail(
      leanInquiry({
        assignedToUserId: {
          _id: 'u1', fullName: 'A Person', role: 'admin',
          // Present on the document; must not survive the serializer.
          email: 'staff@example.invalid', passwordHash: '$argon2id$x',
          sessionVersion: 4, failedLoginAttempts: 2, lockUntil: new Date(),
        },
      })
    )
    assert.deepEqual(Object.keys(detail.assignedTo).sort(), ['fullName', 'id', 'role'])
    assertClean(detail, 'a populated staff user')
  })

  test('a populated package exposes no sourceId', () => {
    const detail = serializeInquiryDetail(
      leanInquiry({
        trip: {
          packageId: { _id: 'p1', title: 'Annapurna', slug: 'annapurna', sourceId: 'pkg-legacy-3', status: 'published' },
        },
      })
    )
    assert.deepEqual(Object.keys(detail.package).sort(), ['id', 'slug', 'title'])
    assertClean(detail, 'a populated package')
  })

  test('a populated guide exposes no private guide field', () => {
    const detail = serializeInquiryDetail(
      leanInquiry({
        trip: {
          guideId: {
            _id: 'g1', fullName: 'A Guide', slug: 'a-guide',
            // Every one of these is private on a guide profile.
            pricePerDay: 60, certifications: ['x'], verificationStatus: 'verified',
            internalNotes: 'staff only', sourceId: 'guide-legacy-1',
          },
        },
      })
    )
    assert.deepEqual(Object.keys(detail.guide).sort(), ['fullName', 'id', 'slug'])
    const body = JSON.stringify(detail)
    for (const field of ['pricePerDay', 'certifications', 'verificationStatus', 'staff only']) {
      assert.ok(!body.includes(field), field)
    }
  })

  test('consent is reported as a fact and a version, not as policy text', () => {
    const detail = serializeInquiryDetail(leanInquiry())
    assert.deepEqual(Object.keys(detail.consent).sort(), ['accepted', 'acceptedAt', 'privacyPolicyVersion'])
    assert.equal(detail.consent.accepted, true)
  })

  test('a missing nested object does not throw', () => {
    // A leaned document from an older record may simply not have them.
    const detail = serializeInquiryDetail({ _id: 'x', referenceCode: 'CFN-2026-AAAAAA', status: 'new', type: 'contact' })
    assert.equal(detail.contact.fullName, '')
    assert.equal(detail.trip.packageId, null)
    assert.equal(detail.callback.timezone, '')
  })
})
