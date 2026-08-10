// Builds the link to the inquiry form, carrying enough about the departure that
// the form can prefill itself with words a person would actually write.
import { formatDate } from '../../lib/formatters.js'

export function reserveLink(row) {
  const params = new URLSearchParams({
    type: 'departure',
    departure: row.id,
    // The readable trip name, not the slug — this ends up in a visible subject line.
    trip: row.trip?.title || row.title || '',
    slug: row.trip?.slug || '',
    date: row.startDate,
    dateLabel: formatDate(row.startDate),
  })

  return `/contact?${params.toString()}`
}
