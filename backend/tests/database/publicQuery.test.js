import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import {
  buildPageMeta,
  escapeRegex,
  parseBoolean,
  parseDateRange,
  parseEnum,
  parseLimit,
  parseList,
  parseNumericRange,
  parsePage,
  parseSearch,
  parseSort,
  searchFilter,
  sortToObject,
} from '../../src/database/publicQuery.js'

const PAGING = { defaultPageSize: 12, maxPageSize: 100 }
const throwsBadRequest = (fn) => {
  try { fn(); return false } catch (error) { return error.status === 400 }
}

describe('publicQuery — pagination', () => {
  test('page defaults to 1', () => assert.equal(parsePage(undefined), 1))
  test('a valid page is used', () => assert.equal(parsePage('3'), 3))
  test('page 0 is rejected', () => assert.ok(throwsBadRequest(() => parsePage('0'))))
  test('a negative page is rejected', () => assert.ok(throwsBadRequest(() => parsePage('-1'))))
  test('a fractional page is rejected', () => assert.ok(throwsBadRequest(() => parsePage('1.5'))))
  test('a non-numeric page is rejected', () => assert.ok(throwsBadRequest(() => parsePage('abc'))))

  test('limit defaults to the configured page size', () =>
    assert.equal(parseLimit(undefined, PAGING), 12))
  test('a valid limit is used', () => assert.equal(parseLimit('25', PAGING), 25))
  test('a limit above the maximum is rejected', () =>
    assert.ok(throwsBadRequest(() => parseLimit('101', PAGING))))
  test('a limit exactly at the maximum is allowed', () =>
    assert.equal(parseLimit('100', PAGING), 100))
  test('limit 0 is rejected', () => assert.ok(throwsBadRequest(() => parseLimit('0', PAGING))))

  test('an array parameter is rejected rather than coerced', () => {
    // Express turns ?page=1&page=2 into an array; it must not become NaN.
    assert.ok(throwsBadRequest(() => parsePage(['1', '2'])))
  })

  test('an operator-injection object is rejected', () => {
    // ?limit[$gt]=1 parses to an object. It must never reach Mongoose.
    assert.ok(throwsBadRequest(() => parseLimit({ $gt: 1 }, PAGING)))
  })
})

describe('publicQuery — booleans', () => {
  test('undefined stays undefined', () => assert.equal(parseBoolean(undefined, 'featured'), undefined))
  test('"true" parses', () => assert.equal(parseBoolean('true', 'featured'), true))
  test('"false" parses, and is not treated as absent', () =>
    assert.equal(parseBoolean('false', 'featured'), false))
  test('anything else is rejected', () => {
    for (const value of ['1', 'yes', 'TRUE', 'on']) {
      assert.ok(throwsBadRequest(() => parseBoolean(value, 'featured')), `${value} should be rejected`)
    }
  })
})

describe('publicQuery — lists', () => {
  test('splits on commas and trims', () =>
    assert.deepEqual(parseList('a, b ,c', 'x'), ['a', 'b', 'c']))
  test('drops blank entries', () => assert.deepEqual(parseList('a,,b', 'x'), ['a', 'b']))
  test('an empty string becomes undefined', () => assert.equal(parseList('', 'x'), undefined))
  test('values outside the allowlist are rejected', () =>
    assert.ok(throwsBadRequest(() => parseList('tour,rocket', 'type', { allowed: ['tour'] }))))
  test('allowlisted values pass', () =>
    assert.deepEqual(parseList('tour,trekking', 'type', { allowed: ['tour', 'trekking'] }), ['tour', 'trekking']))
})

describe('publicQuery — enums', () => {
  test('a known value passes', () => assert.equal(parseEnum('tour', 'type', ['tour']), 'tour'))
  test('an unknown value is rejected', () =>
    assert.ok(throwsBadRequest(() => parseEnum('rocket', 'type', ['tour']))))
})

describe('publicQuery — search', () => {
  test('trims and returns', () => assert.equal(parseSearch('  everest '), 'everest'))
  test('an over-long search is rejected', () =>
    assert.ok(throwsBadRequest(() => parseSearch('x'.repeat(101)))))

  test('regex metacharacters are escaped', () => {
    assert.equal(escapeRegex('c++ (a.b)*'), 'c\\+\\+ \\(a\\.b\\)\\*')
  })

  test('a search for ".*" matches literally, not everything', () => {
    const filter = searchFilter('.*', ['title'])
    const pattern = filter.$or[0].title
    assert.ok(pattern.test('a .* b'))
    assert.ok(!pattern.test('anything else'))
  })

  test('a catastrophic pattern is defused', () => {
    const filter = searchFilter('(a+)+$', ['title'])
    assert.ok(!filter.$or[0].title.test('aaaaaaaaaaaaaaaaaaaaaaa'))
  })
})

describe('publicQuery — sorting', () => {
  const allowed = ['title', 'price']

  test('falls back when absent', () => assert.equal(parseSort(undefined, allowed, 'title'), 'title'))
  test('an allowlisted field passes', () => assert.equal(parseSort('price', allowed, 'title'), 'price'))
  test('a descending allowlisted field passes', () =>
    assert.equal(parseSort('-price', allowed, 'title'), '-price'))
  test('an unknown field is rejected', () =>
    assert.ok(throwsBadRequest(() => parseSort('sourceId', allowed, 'title'))))
  test('a private field cannot be sorted on', () =>
    assert.ok(throwsBadRequest(() => parseSort('internalNotes', allowed, 'title'))))

  test('converts to a Mongoose sort object', () => {
    assert.deepEqual(sortToObject('title'), { title: 1 })
    assert.deepEqual(sortToObject('-price'), { price: -1 })
  })
})

describe('publicQuery — numeric ranges', () => {
  test('both bounds build a range', () =>
    assert.deepEqual(parseNumericRange('10', '20', 'price'), { $gte: 10, $lte: 20 }))
  test('one bound is enough', () =>
    assert.deepEqual(parseNumericRange('10', undefined, 'price'), { $gte: 10 }))
  test('neither bound returns undefined', () =>
    assert.equal(parseNumericRange(undefined, undefined, 'price'), undefined))

  test('zero is preserved as a real minimum', () => {
    assert.deepEqual(parseNumericRange('0', '20', 'price'), { $gte: 0, $lte: 20 })
  })

  test('min greater than max is rejected', () =>
    assert.ok(throwsBadRequest(() => parseNumericRange('50', '10', 'price'))))
  test('a negative bound is rejected', () =>
    assert.ok(throwsBadRequest(() => parseNumericRange('-5', undefined, 'price'))))
  test('a non-numeric bound is rejected', () =>
    assert.ok(throwsBadRequest(() => parseNumericRange('cheap', undefined, 'price'))))
})

describe('publicQuery — date ranges', () => {
  test('both dates build a range', () => {
    const range = parseDateRange('2027-03-01', '2027-03-31')
    assert.ok(range.$gte instanceof Date && range.$lte instanceof Date)
  })
  test('neither returns undefined', () =>
    assert.equal(parseDateRange(undefined, undefined), undefined))
  test('a malformed date is rejected', () =>
    assert.ok(throwsBadRequest(() => parseDateRange('not-a-date', undefined))))
  test('from after to is rejected', () =>
    assert.ok(throwsBadRequest(() => parseDateRange('2027-05-01', '2027-03-01'))))
})

describe('publicQuery — page meta', () => {
  test('computes totals and flags', () => {
    assert.deepEqual(buildPageMeta({ page: 1, limit: 12, total: 24 }), {
      page: 1, limit: 12, total: 24, totalPages: 2,
      hasNextPage: true, hasPreviousPage: false,
    })
  })
  test('the last page has no next', () => {
    const meta = buildPageMeta({ page: 2, limit: 12, total: 24 })
    assert.equal(meta.hasNextPage, false)
    assert.equal(meta.hasPreviousPage, true)
  })
  test('an empty result set is coherent', () => {
    assert.deepEqual(buildPageMeta({ page: 1, limit: 12, total: 0 }), {
      page: 1, limit: 12, total: 0, totalPages: 0,
      hasNextPage: false, hasPreviousPage: false,
    })
  })
  test('a partial final page rounds up', () => {
    assert.equal(buildPageMeta({ page: 1, limit: 10, total: 25 }).totalPages, 3)
  })
})
