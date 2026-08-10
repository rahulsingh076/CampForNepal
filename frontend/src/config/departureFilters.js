// Filter choices for the fixed departures page, and the functions that apply
// them. A row here is a departure already joined to its package.
import { difficultyDetails } from '../lib/displayLabels.js'
import { parseCalendarDate } from '../lib/formatters.js'
import { matchesText } from '../lib/queryList.js'

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export const PRICES = [
  { value: 'under1000', label: 'Under $1,000', test: (price) => price < 1000 },
  { value: '1000to2500', label: '$1,000 to $2,500', test: (price) => price >= 1000 && price <= 2500 },
  { value: 'over2500', label: 'Over $2,500', test: (price) => price > 2500 },
]

// Only statuses a visitor can act on or plan around. Draft is internal.
export const PUBLIC_STATUSES = ['booking_open', 'almost_full', 'guaranteed', 'closed']

export const STATUS_OPTIONS = [
  { value: 'booking_open', label: 'Booking open' },
  { value: 'almost_full', label: 'Almost full' },
  { value: 'guaranteed', label: 'Guaranteed to run' },
  { value: 'closed', label: 'Closed' },
]

export const NO_FILTERS = {
  search: '',
  month: '',
  region: '',
  type: '',
  difficulty: '',
  price: '',
  status: '',
}

export function monthOf(isoDate) {
  return MONTHS[parseCalendarDate(isoDate).getMonth()]
}

export function filterDepartures(rows, choice) {
  return rows.filter((row) => {
    if (!matchesText(choice.search, [row.title, row.trip?.title, row.trip?.region, row.trip?.type])) return false
    if (choice.month && monthOf(row.startDate) !== choice.month) return false
    if (choice.region && row.trip?.region !== choice.region) return false
    if (choice.type && row.trip?.type !== choice.type) return false
    if (choice.difficulty && row.trip?.difficulty !== choice.difficulty) return false
    if (choice.status && row.status !== choice.status) return false

    const price = PRICES.find((option) => option.value === choice.price)
    if (price && !price.test(row.price)) return false

    return true
  })
}

// The page always reads in date order; nobody wants departures shuffled.
export function byStartDate(rows) {
  return [...rows].sort((a, b) => parseCalendarDate(a.startDate) - parseCalendarDate(b.startDate))
}

// Builds a de-duplicated option list from whatever the rows actually hold.
function optionsFrom(rows, pick, labelFor = (value) => value) {
  const values = new Set()
  rows.forEach((row) => {
    const value = pick(row)
    if (value) values.add(value)
  })
  return [...values].sort().map((value) => ({ value, label: labelFor(value) }))
}

// The six controls above the list, described as data so the page stays readable.
export function buildDepartureFilters(rows, choice) {
  return [
    {
      name: 'search',
      label: 'Search departures',
      placeholder: 'Trip or region',
      control: 'search',
      value: choice.search,
      options: [],
    },
    {
      name: 'month',
      label: 'Month',
      anyLabel: 'Any month',
      value: choice.month,
      // Only months that actually have a departure.
      options: MONTHS.filter((month) => rows.some((row) => monthOf(row.startDate) === month)).map(
        (month) => ({ value: month, label: month })
      ),
    },
    {
      name: 'region',
      label: 'Region',
      anyLabel: 'Every region',
      value: choice.region,
      options: optionsFrom(rows, (row) => row.trip?.region),
    },
    {
      name: 'type',
      label: 'Trip type',
      anyLabel: 'Any kind of trip',
      value: choice.type,
      options: optionsFrom(rows, (row) => row.trip?.type),
    },
    {
      name: 'difficulty',
      label: 'Difficulty',
      anyLabel: 'Any difficulty',
      value: choice.difficulty,
      options: optionsFrom(rows, (row) => row.trip?.difficulty, (value) => difficultyDetails(value).label),
    },
    {
      name: 'price',
      label: 'Price range',
      anyLabel: 'Any price',
      value: choice.price,
      options: PRICES,
    },
    {
      name: 'status',
      label: 'Availability',
      anyLabel: 'Any status',
      value: choice.status,
      options: STATUS_OPTIONS,
    },
  ]
}
