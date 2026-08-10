// The filter and sort choices offered on the trip list pages, and the plain
// functions that apply them.
import { matchesText } from '../lib/queryList.js'

export const DURATIONS = [
  { value: 'short', label: 'Up to 7 days', test: (days) => days <= 7 },
  { value: 'medium', label: '8 to 14 days', test: (days) => days >= 8 && days <= 14 },
  { value: 'long', label: '15 days or more', test: (days) => days >= 15 },
]

export const PRICES = [
  { value: 'under1000', label: 'Under $1,000', test: (price) => price < 1000 },
  { value: '1000to2500', label: '$1,000 to $2,500', test: (price) => price >= 1000 && price <= 2500 },
  { value: 'over2500', label: 'Over $2,500', test: (price) => price > 2500 },
]

export const SORTS = [
  { value: 'price-asc', label: 'Price, lowest first' },
  { value: 'price-desc', label: 'Price, highest first' },
  { value: 'duration-asc', label: 'Duration, shortest first' },
  { value: 'duration-desc', label: 'Duration, longest first' },
]

export const NO_FILTERS = {
  search: '',
  destination: '',
  duration: '',
  price: '',
  difficulty: '',
  season: '',
  sort: '',
}

// A discounted trip is filtered and sorted on what you would actually pay.
const payable = (item) => item.discountPrice ?? item.price

export function filterPackages(items, choice) {
  return items.filter((item) => {
    if (!matchesText(choice.search, [item.title, item.shortDescription, item.region, item.type, item.bestSeason])) return false
    if (choice.destination && !item.destinationIds.includes(choice.destination)) return false
    if (choice.difficulty && item.difficulty !== choice.difficulty) return false
    if (choice.season && !item.bestSeason.includes(choice.season)) return false

    const duration = DURATIONS.find((option) => option.value === choice.duration)
    if (duration && !duration.test(item.duration.days)) return false

    const price = PRICES.find((option) => option.value === choice.price)
    if (price && !price.test(payable(item))) return false

    return true
  })
}

export function sortPackages(items, sort) {
  if (!sort) return [...items].sort((left, right) => left.title.localeCompare(right.title))

  const [field, direction] = sort.split('-')
  const valueOf = (item) => (field === 'price' ? payable(item) : item.duration.days)

  return [...items].sort((a, b) =>
    direction === 'asc' ? valueOf(a) - valueOf(b) : valueOf(b) - valueOf(a)
  )
}

// Builds a de-duplicated option list from whatever the records actually hold.
export function optionsFrom(items, pick, labelFor = (value) => value) {
  const values = new Set()
  items.forEach((item) => [].concat(pick(item) || []).forEach((value) => values.add(value)))
  return [...values].sort().map((value) => ({ value, label: labelFor(value) }))
}
