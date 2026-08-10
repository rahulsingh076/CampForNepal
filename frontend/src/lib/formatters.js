// Turns raw values into display strings: prices in the visitor's currency, and dates.

// How far to round a converted price, so we never imply false precision.
const ROUNDING = { USD: 1, NPR: 100, INR: 50, KRW: 1000, JPY: 100 }
const CALENDAR_DATE = /^\d{4}-\d{2}-\d{2}$/

function roundTo(value, step) {
  return Math.round(value / step) * step
}

// The locale context keeps html[lang] current. Reading it here lets display
// helpers follow that choice without changing their existing public signature.
function presentationLocale(fallback) {
  if (typeof document === 'undefined') return fallback
  return document.documentElement.lang || fallback
}

export function formatNumber(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) return ''
  return value.toLocaleString(presentationLocale('en-US'))
}

// Prices are stored in USD. Everything else is a demo conversion, so it is
// rounded and marked approximate rather than shown to the cent.
export function formatPrice(amountUsd, currency) {
  if (typeof amountUsd !== 'number' || Number.isNaN(amountUsd)) return ''

  const code = currency?.code || 'USD'
  const symbol = currency?.symbol || '$'
  const rate = currency?.rate || 1

  const converted = roundTo(amountUsd * rate, ROUNDING[code] || 1)
  const grouped = formatNumber(converted)

  return code === 'USD' ? `${symbol}${grouped}` : `≈ ${symbol}${grouped}`
}

// Catalog records can add priceBasis later without changing today’s price calls.
const PRICE_BASIS = {
  person: 'per person',
  per_person: 'per person',
  group: 'per group',
  per_group: 'per group',
  day: 'per day',
  per_day: 'per day',
}

export function priceBasisLabel(record, fallback = 'per person') {
  const value = record?.priceBasis || record?.priceUnit || fallback
  const normalized = String(value).trim().toLowerCase().replace(/[\s-]+/g, '_')
  return PRICE_BASIS[normalized] || String(value).replace(/_/g, ' ')
}

// Catalog records may declare a fixed rather than starting price without
// changing the existing price field used by the data client.
export function priceLeadLabel(record, fallback = 'From') {
  if (record?.priceIsStarting === false || record?.fixedPrice === true) return 'Price'
  return record?.priceLabel || fallback
}

// The currency the price is actually charged in, for the reassurance line.
export function describePriceBasis(currency) {
  if (!currency || currency.code === 'USD') return 'Prices are in US dollars.'
  return `Shown in ${currency.label || currency.code} at a fixed demo rate. Trips are priced in US dollars.`
}

// Date-only values describe a calendar day, not UTC midnight. Parsing at local
// midday keeps a departure on the same written date in every visitor timezone.
export function parseCalendarDate(value) {
  if (!value) return new Date(NaN)
  return new Date(CALENDAR_DATE.test(value) ? `${value}T12:00:00` : value)
}

export function formatDate(value, { withYear = true, short = false, withTime = false } = {}) {
  if (!value) return ''

  const date = parseCalendarDate(value)
  if (Number.isNaN(date.getTime())) return ''

  // Calendar-only fields do not have a meaningful time. Status history and
  // messages do, so callers can opt into the local presentation time.
  if (withTime && !CALENDAR_DATE.test(value)) {
    return date.toLocaleString(presentationLocale('en-GB'), {
      day: 'numeric',
      month: short ? 'short' : 'long',
      year: withYear ? 'numeric' : undefined,
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return date.toLocaleDateString(presentationLocale('en-GB'), {
    day: 'numeric',
    month: short ? 'short' : 'long',
    year: withYear ? 'numeric' : undefined,
  })
}

// e.g. "12 - 26 October 2026" for a departure window.
export function formatDateRange(startValue, endValue) {
  const start = formatDate(startValue, { withYear: false, short: true })
  const end = formatDate(endValue, { short: true })
  if (!start || !end) return start || end
  return `${start} - ${end}`
}
