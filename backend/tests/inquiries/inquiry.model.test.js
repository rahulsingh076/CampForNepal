// The Inquiry model, and above all what it refuses to serialise.
//
// No database: validation and toJSON both run in memory.
import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import { INQUIRY_PRIORITIES } from '../../src/constants/inquiryPriorities.js'
import { INQUIRY_SOURCES } from '../../src/constants/inquirySources.js'
import { INQUIRY_STATUSES, allowedTransitions, canTransition } from '../../src/constants/inquiryStatuses.js'
import { INQUIRY_TYPES } from '../../src/constants/inquiryTypes.js'
import Inquiry from '../../src/modules/inquiries/inquiry.model.js'

// Each of these either exposes internal machinery or hands an attacker
// something useful about how submissions are screened.
const PRIVATE_FIELDS = [
  'internalNotes',
  'statusHistory',
  'idempotencyKeyHash',
  'spamSignals',
  'submissionMetadata',
]

function inquiryFixture(overrides = {}) {
  return {
    referenceCode: 'CFN-2026-7K9Q2M',
    type: 'contact',
    contact: { fullName: 'Jiwoo Park', email: 'jiwoo@example.invalid' },
    consent: { accepted: true, acceptedAt: new Date(), privacyPolicyVersion: 'test-policy' },
    ...overrides,
  }
}

async function validationErrorFor(doc) {
  try {
    await doc.validate()
    return null
  } catch (error) {
    return error
  }
}

describe('Inquiry model — validation', () => {
  test('a minimal inquiry passes', async () => {
    assert.equal(await validationErrorFor(new Inquiry(inquiryFixture())), null)
  })

  test('every canonical type is accepted', async () => {
    for (const type of INQUIRY_TYPES) {
      assert.equal(await validationErrorFor(new Inquiry(inquiryFixture({ type }))), null, type)
    }
  })

  test('an unknown type fails', async () => {
    const error = await validationErrorFor(new Inquiry(inquiryFixture({ type: 'complaint' })))
    assert.ok(error?.errors?.type)
  })

  test('a missing type fails', async () => {
    const error = await validationErrorFor(new Inquiry(inquiryFixture({ type: undefined })))
    assert.ok(error?.errors?.type)
  })

  test('every canonical status and priority is accepted', async () => {
    for (const status of INQUIRY_STATUSES) {
      assert.equal(await validationErrorFor(new Inquiry(inquiryFixture({ status }))), null, status)
    }
    for (const priority of INQUIRY_PRIORITIES) {
      assert.equal(await validationErrorFor(new Inquiry(inquiryFixture({ priority }))), null, priority)
    }
  })

  test('an unknown status, priority, or source fails', async () => {
    for (const [field, value] of [['status', 'archived'], ['priority', 'critical'], ['source', 'sms']]) {
      const error = await validationErrorFor(new Inquiry(inquiryFixture({ [field]: value })))
      assert.ok(error?.errors?.[field], field)
    }
  })

  test('consent is required — personal data is not stored without it', async () => {
    const error = await validationErrorFor(new Inquiry(inquiryFixture({ consent: undefined })))
    assert.ok(error?.errors?.consent)
  })

  test('a reference code is required', async () => {
    const error = await validationErrorFor(new Inquiry(inquiryFixture({ referenceCode: undefined })))
    assert.ok(error?.errors?.referenceCode)
  })

  test('a group of zero or a fraction fails', async () => {
    for (const numberOfPeople of [0, -1]) {
      const error = await validationErrorFor(new Inquiry(inquiryFixture({ trip: { numberOfPeople } })))
      assert.ok(error?.errors?.['trip.numberOfPeople'], String(numberOfPeople))
    }
  })
})

describe('Inquiry model — defaults', () => {
  test('a new inquiry starts new, normal, and from the website', () => {
    const inquiry = new Inquiry(inquiryFixture())
    assert.equal(inquiry.status, 'new')
    assert.equal(inquiry.priority, 'normal')
    assert.equal(inquiry.source, 'website')
  })

  test('a new inquiry is unassigned and unconverted', () => {
    const inquiry = new Inquiry(inquiryFixture())
    assert.equal(inquiry.assignedToUserId, null)
    assert.equal(inquiry.convertedBookingId, null)
    assert.equal(inquiry.followUpAt, null)
  })

  test('an email is stored lowercased', () => {
    const inquiry = new Inquiry(inquiryFixture({ contact: { fullName: 'A', email: 'JIWOO@Example.INVALID' } }))
    assert.equal(inquiry.contact.email, 'jiwoo@example.invalid')
  })
})

describe('Inquiry model — what reaches JSON', () => {
  test('no private field survives serialisation', () => {
    const json = new Inquiry(
      inquiryFixture({
        internalNotes: [{ authorUserId: '507f1f77bcf86cd799439011', text: 'private', createdAt: new Date() }],
        statusHistory: [{ toStatus: 'new', changedAt: new Date() }],
        idempotencyKeyHash: 'a'.repeat(64),
        spamSignals: { honeypotTriggered: true },
        submissionMetadata: { acceptLanguage: 'en-GB' },
      })
    ).toJSON()

    for (const field of PRIVATE_FIELDS) {
      assert.equal(json[field], undefined, `${field} leaked into JSON`)
    }
  })

  test('a private field is stripped even when it was explicitly loaded', () => {
    // select:false stops a query loading a field, but a document built in
    // memory still materialises one that was set. The transform is what makes
    // the guarantee hold either way.
    const inquiry = new Inquiry(inquiryFixture({ idempotencyKeyHash: 'b'.repeat(64) }))
    assert.ok(inquiry.idempotencyKeyHash)
    assert.equal(inquiry.toJSON().idempotencyKeyHash, undefined)
  })

  test('_id becomes a string id and __v is gone', () => {
    const json = new Inquiry(inquiryFixture()).toJSON()
    assert.equal(typeof json.id, 'string')
    assert.equal(json._id, undefined)
    assert.equal(json.__v, undefined)
  })
})

describe('inquiry status transitions', () => {
  test('a new inquiry can be contacted, lost, or closed', () => {
    assert.deepEqual(allowedTransitions('new'), ['contacted', 'lost', 'closed'])
  })

  test('the lifecycle only moves forward', () => {
    assert.equal(canTransition('contacted', 'new'), false)
    assert.equal(canTransition('quoted', 'contacted'), false)
    assert.equal(canTransition('closed', 'contacted'), false)
  })

  test('closed is terminal', () => {
    assert.deepEqual(allowedTransitions('closed'), [])
  })

  test('converted is never offered as a manual move', () => {
    // It is reachable only from booking conversion. If it appeared
    // here, a staff member could mark an inquiry converted with no booking
    // behind it.
    for (const status of INQUIRY_STATUSES) {
      assert.ok(!allowedTransitions(status).includes('converted'), status)
      assert.equal(canTransition(status, 'converted'), false, status)
    }
  })

  test('a converted inquiry can still be closed', () => {
    assert.equal(canTransition('converted', 'closed'), true)
  })

  test('an unknown status transitions nowhere', () => {
    assert.equal(canTransition('nonsense', 'closed'), false)
    assert.equal(canTransition('new', 'nonsense'), false)
  })

  test('the constant lists match the frontend CRM exactly', () => {
    assert.deepEqual(INQUIRY_STATUSES, ['new', 'contacted', 'quoted', 'converted', 'lost', 'closed'])
    assert.deepEqual(INQUIRY_TYPES, [
      'package_inquiry', 'custom_trip', 'contact', 'callback', 'guide_request', 'emergency',
    ])
    assert.deepEqual(INQUIRY_SOURCES, ['website', 'customer_dashboard', 'admin'])
  })
})
