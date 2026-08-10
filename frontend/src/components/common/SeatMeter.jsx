// Shows how many seats are left, with a quiet bar behind the number.
import useSingleton from '../../hooks/useSingleton.js'

export default function SeatMeter({ totalSeats, bookedSeats, compact = false }) {
  const settings = useSingleton('siteSettings')
  const demoMode = settings.data?.demoMode !== false
  const left = Math.max(0, totalSeats - bookedSeats)
  const takenPercent = totalSeats > 0 ? Math.round((bookedSeats / totalSeats) * 100) : 0

  // Amber once it is nearly gone, so urgency is visible before you read it.
  const barColour = left === 0 ? 'bg-stone-400' : takenPercent >= 80 ? 'bg-amber-600' : 'bg-primary-600'

  return (
    <div className={compact ? '' : 'min-w-32'}>
      <p className="text-small font-medium text-stone-900">
        {demoMode ? 'Sample availability: ' : ''}{left === 0 ? 'No seats left' : `${left} of ${totalSeats} seats left`}
      </p>

      <div
        className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-stone-200"
        aria-hidden="true"
      >
        <div className={`h-full rounded-full ${barColour}`} style={{ width: `${takenPercent}%` }} />
      </div>
    </div>
  )
}
