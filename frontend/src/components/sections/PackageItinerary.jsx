// Day-by-day plan as an accordion. Day is rendered as a label, never a number,
// because a long expedition groups several days into one phase.
import Accordion from '../common/Accordion.jsx'
import ImageFrame from '../common/ImageFrame.jsx'
import { formatNumber } from '../../lib/formatters.js'
import { normaliseMediaItem } from '../../lib/media.js'

const WATCH_LABELS = {
  video: 'Open video',
  reel: 'Open reel',
}

function DayMedia({ media = [], title }) {
  const items = media
    .map((item, index) => normaliseMediaItem(item, { fallbackTitle: title, index }))
    .filter((item) => item.imageSrc || item.src)

  if (!items.length) return null

  return (
    <div className="mt-5 grid gap-4 sm:grid-cols-2">
      {items.map((item, index) => {
        const frame = (
          <ImageFrame
            src={item.imageSrc}
            alt={item.alt || item.caption || title}
            focalPosition={item.focalPosition}
            ratio="landscape"
            radius="md"
          />
        )
        const actionLabel = WATCH_LABELS[item.type]

        return (
          <figure key={`${item.type}-${item.src}-${index}`} className="min-w-0">
            {actionLabel ? (
              <a href={item.src} target="_blank" rel="noopener noreferrer" className="group block">
                <div className="relative">
                  {frame}
                  <span className="absolute left-3 top-3 rounded-full bg-stone-950/80 px-3 py-1 text-caption font-semibold uppercase tracking-widest text-white">
                    {actionLabel}
                  </span>
                </div>
              </a>
            ) : (
              frame
            )}
            {(item.caption || item.credit) && (
              <figcaption className="mt-2 space-y-1 text-small text-stone-600">
                {item.caption && <span className="line-clamp-2">{item.caption}</span>}
                {item.credit && <span className="block text-caption text-stone-500">{item.credit}</span>}
              </figcaption>
            )}
          </figure>
        )
      })}
    </div>
  )
}

export default function PackageItinerary({ itinerary, walkingPerDay }) {
  const items = itinerary.map((day) => ({
    key: String(day.day),
    marker: `Day ${day.day}`,
    title: day.title,
    meta: [
      day.elevationMetres ? `${formatNumber(day.elevationMetres)}m` : null,
      day.walkingHours,
      day.accommodation,
    ]
      .filter(Boolean)
      .join(' · '),
    content: (
      <div className="pl-0 sm:pl-20">
        <p className="readable-text text-body text-stone-700">{day.description}</p>
        <p className="mt-3 text-small text-stone-600">Meals: {day.meals}</p>
        <DayMedia media={day.media} title={day.title} />
      </div>
    ),
  }))

  return (
    <>
      {walkingPerDay && <p className="mb-5 text-small text-stone-600">Typical active days: {walkingPerDay}. Open a day to see the route, overnight stop, and meals.</p>}
      <Accordion items={items} openAllLabel="Open all days" />
    </>
  )
}
