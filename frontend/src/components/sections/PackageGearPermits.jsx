// Gear and permits stay compact until a traveller chooses the list they need.
import Accordion from '../common/Accordion.jsx'

export default function PackageGearPermits({ gearList = [], permits = [] }) {
  const items = [
    gearList.length > 0 && {
      key: 'gear',
      marker: 'Gear',
      title: `What to bring (${gearList.length})`,
      meta: 'Personal kit for this itinerary',
      content: (
        <ul className="grid gap-3 sm:grid-cols-2">
          {gearList.map((entry) => <li key={entry.slice(0, 40)} className="text-body text-stone-700">{entry}</li>)}
        </ul>
      ),
    },
    permits.length > 0 && {
      key: 'permits',
      marker: 'Permits',
      title: `Permits we arrange (${permits.length})`,
      meta: 'Paperwork confirmed before the trip is finalised',
      content: (
        <>
          <p className="mb-4 text-small text-stone-600">We arrange the listed permits after dates and trip details are confirmed. You will be told what documentation is needed.</p>
          <ul className="space-y-3">
            {permits.map((permit) => <li key={permit} className="flex gap-3 text-body text-stone-700"><svg className="mt-1 h-4 w-4 shrink-0 text-primary-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M7 3h7l5 5v13H7z" strokeLinecap="round" strokeLinejoin="round" /></svg>{permit}</li>)}
          </ul>
        </>
      ),
    },
  ].filter(Boolean)

  if (items.length === 0) return null

  return (
    <Accordion items={items} defaultOpen={-1} openAllLabel="Open all lists" />
  )
}
