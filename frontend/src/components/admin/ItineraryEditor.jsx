import FormField from '../common/FormField.jsx'
import MediaListEditor from './MediaListEditor.jsx'

function blankDay(index) {
  return {
    day: index + 1,
    title: '',
    description: '',
    elevationMetres: '',
    walkingHours: '',
    accommodation: '',
    meals: '',
    media: [],
  }
}

function IconButton({ label, onClick, disabled = false, children }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-label={label} title={label} className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-stone-300 text-stone-700 hover:border-primary-600 hover:text-primary-800 disabled:cursor-not-allowed disabled:opacity-40">
      {children}
    </button>
  )
}

export default function ItineraryEditor({ value = [], onChange, mediaAssets = [] }) {
  const days = value.length ? value : []

  function update(index, field, nextValue) {
    onChange(days.map((day, dayIndex) => (dayIndex === index ? { ...day, [field]: nextValue } : day)))
  }

  function move(index, direction) {
    const nextIndex = index + direction
    if (nextIndex < 0 || nextIndex >= days.length) return
    const next = [...days]
    ;[next[index], next[nextIndex]] = [next[nextIndex], next[index]]
    onChange(next.map((day, dayIndex) => ({ ...day, day: dayIndex + 1 })))
  }

  function remove(index) {
    onChange(days.filter((_, dayIndex) => dayIndex !== index).map((day, dayIndex) => ({ ...day, day: dayIndex + 1 })))
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-small font-semibold text-stone-800">Day-by-day itinerary</p>
          <p className="mt-1 text-small text-stone-600">Add, remove, and reorder the stages before publishing.</p>
        </div>
        <button type="button" onClick={() => onChange([...days, blankDay(days.length)])} className="self-start rounded-md border border-stone-300 px-3 py-1.5 text-small font-semibold text-primary-800 hover:border-primary-600 hover:bg-primary-50 sm:self-auto">
          Add day
        </button>
      </div>
      <div className="mt-4 divide-y divide-stone-200 border-y border-stone-200">
        {days.map((day, index) => (
          <div key={`${day.day}-${index}`} className="py-5">
            <div className="mb-4 flex items-center justify-between gap-4">
              <p className="text-small font-semibold text-stone-900">Day {index + 1}</p>
              <div className="flex gap-2">
                <IconButton label={`Move day ${index + 1} up`} onClick={() => move(index, -1)} disabled={index === 0}><svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 14 6-6 6 6" /></svg></IconButton>
                <IconButton label={`Move day ${index + 1} down`} onClick={() => move(index, 1)} disabled={index === days.length - 1}><svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 10 6 6 6-6" /></svg></IconButton>
                <IconButton label={`Remove day ${index + 1}`} onClick={() => remove(index)}><svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M18 6 6 18" /></svg></IconButton>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Stage title" value={day.title || ''} onChange={(event) => update(index, 'title', event.target.value)} />
              <FormField label="Elevation (m)" type="number" min="0" value={day.elevationMetres || ''} onChange={(event) => update(index, 'elevationMetres', event.target.value)} />
              <FormField label="Walking hours" value={day.walkingHours || ''} onChange={(event) => update(index, 'walkingHours', event.target.value)} />
              <FormField label="Accommodation" value={day.accommodation || ''} onChange={(event) => update(index, 'accommodation', event.target.value)} />
              <FormField label="Meals" value={day.meals || ''} onChange={(event) => update(index, 'meals', event.target.value)} />
              <FormField className="sm:col-span-2" label="Description" as="textarea" rows={3} value={day.description || ''} onChange={(event) => update(index, 'description', event.target.value)} />
              <div className="sm:col-span-2">
                <MediaListEditor label={`Day ${index + 1} media`} value={day.media || []} onChange={(items) => update(index, 'media', items)} libraryAssets={mediaAssets} addLabel="Add day media" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
