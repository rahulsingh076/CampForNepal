// Shows the simplified booking state. Details belong in the private chat.
import { bookingStatusLabel, normalizeBookingStatus } from '../../config/bookingStatuses.js'
import { formatDate } from '../../lib/formatters.js'

function latestEntryFor(status, history) {
  const normalized = normalizeBookingStatus(status)
  return [...history].reverse().find((entry) => normalizeBookingStatus(entry.status) === normalized) || [...history].reverse()[0]
}

export default function BookingStatusTimeline({ status, history = [], compact = false }) {
  const normalized = normalizeBookingStatus(status)
  const label = bookingStatusLabel(status)
  const currentEntry = latestEntryFor(status, history)
  const booked = normalized === 'booked'

  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2" aria-hidden="true">
          <span className={`h-2.5 w-2.5 rounded-full ${booked ? 'bg-primary-700' : 'bg-stone-300'}`} />
          <span className={`h-2.5 w-2.5 rounded-full ${booked ? 'bg-stone-300' : 'bg-danger-600'}`} />
        </div>
        <p className={`text-small font-semibold ${booked ? 'text-primary-800' : 'text-danger-700'}`}>
          {label}
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-stone-200 bg-sand-50 p-5">
      <div className="flex flex-wrap items-center gap-3">
        <span
          aria-hidden="true"
          className={`flex h-9 w-9 items-center justify-center rounded-full text-small font-semibold text-white ${
            booked ? 'bg-primary-700' : 'bg-danger-600'
          }`}
        >
          {booked ? 'B' : 'C'}
        </span>
        <div>
          <p className="text-small font-semibold uppercase tracking-wide text-stone-500">Current status</p>
          <p className={`text-h4 font-sans ${booked ? 'text-primary-900' : 'text-danger-700'}`}>{label}</p>
        </div>
      </div>

      <div className="mt-4 border-t border-stone-200 pt-4 text-small text-stone-600">
        {currentEntry?.changedAt && <p>Updated {formatDate(currentEntry.changedAt, { short: true, withTime: true })}</p>}
        <p className="mt-2">Use private chat for timing, documents, guide details, special requests, or cancellation discussion.</p>
      </div>
    </div>
  )
}
