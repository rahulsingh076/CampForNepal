// Closing band on the detail pages: nudge toward a tailored trip.
import { Link } from 'react-router-dom'
import Section from '../common/Section.jsx'

export default function CustomTripCta({ message }) {
  return (
    <Section tone="primary" spacing="tight">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-body text-sand-100">{message}</p>
        <Link
          to="/custom-trip"
          className="inline-flex shrink-0 items-center justify-center rounded-lg bg-amber-600 px-6 py-3 text-body font-semibold text-white transition-colors duration-200 hover:bg-amber-700"
        >
          Plan a custom trip
        </Link>
      </div>
    </Section>
  )
}
