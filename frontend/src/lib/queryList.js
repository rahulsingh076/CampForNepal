// Search, filter, sort, and page a list of records. Pure functions, no storage access.

// The text fields worth searching across the different entities.
const SEARCH_FIELDS = [
  'title',
  'fullName',
  'customerName',
  'subject',
  'reference',
  'name',
  'countryName',
  'shortDescription',
  'eventType',
  'sourceType',
  'sourceName',
  'sourceReference',
  'licence',
  'tags',
  // Admin lookups for a user or an inquiry almost always start with the email.
  'email',
]

export function matchesText(term, values = []) {
  const needle = String(term || '').trim().toLowerCase()
  if (!needle) return true

  return values
    .flat(Infinity)
    .some((value) => value !== undefined && value !== null && String(value).toLowerCase().includes(needle))
}

function matchesSearch(row, term) {
  return matchesText(term, SEARCH_FIELDS.map((field) => row[field]))
}

// A filter matches when the field equals the wanted value, when an array field
// contains it, or — if both are arrays — when they overlap at all.
function matchesFilters(row, filters) {
  return Object.entries(filters).every(([field, wanted]) => {
    if (wanted === undefined || wanted === null || wanted === '') return true
    if (Array.isArray(wanted) && wanted.length === 0) return true

    const actual = row[field]

    if (Array.isArray(actual) && Array.isArray(wanted)) {
      return wanted.some((value) => actual.includes(value))
    }
    if (Array.isArray(actual)) return actual.includes(wanted)
    if (Array.isArray(wanted)) return wanted.includes(actual)
    return actual === wanted
  })
}

function compare(a, b) {
  if (typeof a === 'number' && typeof b === 'number') return a - b
  return String(a ?? '').localeCompare(String(b ?? ''))
}

export default function applyQuery(rows, options = {}) {
  const {
    search = '',
    filters = {},
    sort = null,
    direction = 'asc',
    page = 1,
    pageSize = 0, // 0 means "everything on one page"
  } = options

  let result = rows.filter((row) => matchesSearch(row, search) && matchesFilters(row, filters))

  if (sort) {
    result = [...result].sort((a, b) => {
      const outcome = compare(a[sort], b[sort])
      return direction === 'desc' ? -outcome : outcome
    })
  }

  const total = result.length
  const size = pageSize > 0 ? pageSize : total || 1
  const totalPages = Math.max(1, Math.ceil(total / size))
  const currentPage = Math.min(Math.max(1, page), totalPages)

  if (pageSize > 0) {
    const start = (currentPage - 1) * size
    result = result.slice(start, start + size)
  }

  return {
    rows: result,
    meta: { total, page: currentPage, pageSize: size, totalPages },
  }
}
