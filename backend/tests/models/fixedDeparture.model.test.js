import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import FixedDeparture from '../../src/modules/fixedDepartures/fixedDeparture.model.js'
import {
  expectInvalidPath,
  fixedDepartureFixture,
  validationErrorFor,
} from '../helpers/modelFixtures.js'

describe('FixedDeparture model', () => {
  test('a complete departure passes validation', async () => {
    const error = await validationErrorFor(new FixedDeparture(fixedDepartureFixture()))
    assert.equal(error, null)
  })

  test('a missing packageId fails', async () => {
    const doc = new FixedDeparture(fixedDepartureFixture({ packageId: undefined }))
    assert.ok(await expectInvalidPath(doc, 'packageId'))
  })

  test('an end date before the start date fails', async () => {
    const doc = new FixedDeparture(
      fixedDepartureFixture({
        startDate: new Date('2027-03-11T00:00:00.000Z'),
        endDate: new Date('2027-03-01T00:00:00.000Z'),
      })
    )
    assert.ok(await expectInvalidPath(doc, 'endDate'))
  })

  test('a same-day departure is allowed, as the helicopter tour seed requires', async () => {
    const day = new Date('2027-03-01T00:00:00.000Z')
    const doc = new FixedDeparture(fixedDepartureFixture({ startDate: day, endDate: day }))
    assert.equal(await validationErrorFor(doc), null)
  })

  test('booked seats above total seats fails', async () => {
    const doc = new FixedDeparture(fixedDepartureFixture({ totalSeats: 10, bookedSeats: 11 }))
    assert.ok(await expectInvalidPath(doc, 'bookedSeats'))
  })

  test('a full departure is valid', async () => {
    const doc = new FixedDeparture(fixedDepartureFixture({ totalSeats: 10, bookedSeats: 10 }))
    assert.equal(await validationErrorFor(doc), null)
  })

  test('negative seat counts fail', async () => {
    assert.ok(
      await expectInvalidPath(new FixedDeparture(fixedDepartureFixture({ totalSeats: -1 })), 'totalSeats')
    )
    assert.ok(
      await expectInvalidPath(new FixedDeparture(fixedDepartureFixture({ bookedSeats: -1 })), 'bookedSeats')
    )
  })

  test('fractional seat counts fail', async () => {
    const doc = new FixedDeparture(fixedDepartureFixture({ totalSeats: 10.5 }))
    assert.ok(await expectInvalidPath(doc, 'totalSeats'))
  })

  test('a negative price fails', async () => {
    const doc = new FixedDeparture(fixedDepartureFixture({ price: -1 }))
    assert.ok(await expectInvalidPath(doc, 'price'))
  })

  test('an unknown status fails', async () => {
    const doc = new FixedDeparture(fixedDepartureFixture({ status: 'Booking Open' }))
    assert.ok(await expectInvalidPath(doc, 'status'))
  })

  test('every canonical status is accepted', async () => {
    const statuses = ['draft', 'booking_open', 'almost_full', 'guaranteed', 'closed', 'cancelled', 'completed']
    for (const status of statuses) {
      const doc = new FixedDeparture(fixedDepartureFixture({ status }))
      assert.equal(await validationErrorFor(doc), null, `${status} should be valid`)
    }
  })

  test('seatsLeft is total minus booked', () => {
    const doc = new FixedDeparture(fixedDepartureFixture({ totalSeats: 12, bookedSeats: 4 }))
    assert.equal(doc.seatsLeft, 8)
  })

  test('seatsLeft is zero when full', () => {
    const doc = new FixedDeparture(fixedDepartureFixture({ totalSeats: 12, bookedSeats: 12 }))
    assert.equal(doc.seatsLeft, 0)
  })

  test('seatsLeft never goes negative, even on inconsistent data', () => {
    // Bypasses validation the way a bad direct write would.
    const doc = new FixedDeparture(fixedDepartureFixture())
    doc.totalSeats = 5
    doc.bookedSeats = 9
    assert.equal(doc.seatsLeft, 0)
  })

  test('seatsLeft appears in public JSON', () => {
    const json = new FixedDeparture(fixedDepartureFixture({ totalSeats: 12, bookedSeats: 4 })).toJSON()
    assert.equal(json.seatsLeft, 8)
  })

  test('internalNotes is never in public JSON of a loaded document', () => {
    // select:false means a normal query never loads it. Simulated here by
    // constructing without the field, which is what the driver would hand back.
    const doc = new FixedDeparture(fixedDepartureFixture({ internalNotes: undefined }))
    const json = doc.toJSON()
    assert.equal(json.internalNotes, undefined)
    assert.equal(
      FixedDeparture.schema.path('internalNotes').options.select,
      false,
      'internalNotes must be select:false so it is not loaded by default'
    )
  })

  test('bookedSeats defaults to zero', () => {
    const doc = new FixedDeparture(fixedDepartureFixture({ bookedSeats: undefined }))
    assert.equal(doc.bookedSeats, 0)
  })
})
