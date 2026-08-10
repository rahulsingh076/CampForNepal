// Short, data-derived trip-fit guidance without making health or medical judgments.
import { difficultyDetails } from '../../lib/displayLabels.js'

function goodFitFor(item, difficulty) {
  const tripKind = item.type === 'trekking' ? 'trek' : item.type
  const walking = item.walkingPerDay ? ` Typical active days are ${item.walkingPerDay}.` : ''
  const group = item.groupSize?.max ? ` Groups are kept to ${item.groupSize.max} people or fewer.` : ''
  if (item.type === 'expedition' || item.maxElevationMetres >= 6000) {
    return `Travellers who want a serious high-altitude objective, have time to prepare, and are drawn to ${item.duration.days} days of focused mountain travel.${walking}${group}`
  }
  if (difficulty.label === 'Easy') {
    return `Travellers looking for a gentler Nepal experience with ${item.duration.days} day${item.duration.days === 1 ? '' : 's'} to enjoy the route at an unhurried pace.${walking}${group}`
  }
  return `Active travellers who enjoy ${item.duration.days} days on the route and want a ${difficulty.label.toLowerCase()} ${tripKind} with time to take in the region.${walking}${group}`
}

function considerAnother(item, difficulty) {
  if (item.type === 'expedition' || item.maxElevationMetres >= 6000) {
    return 'Consider a lower-elevation trek or tour if you would prefer a shorter objective with less sustained time at altitude.'
  }
  if (difficulty.label === 'Strenuous' || difficulty.label === 'Strenuous and technical' || difficulty.label === 'Extreme') {
    return 'Consider an easier route if you would prefer gentler terrain, shorter active days, or less technical travel.'
  }
  if (item.maxElevationMetres >= 5000) {
    return 'Consider a lower-elevation route if you would rather avoid spending time at high altitude.'
  }
  return ''
}

export default function PackageFit({ item }) {
  const difficulty = difficultyDetails(item.difficulty)
  const alternative = considerAnother(item, difficulty)

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <article className="rounded-xl border border-primary-200 bg-primary-50 p-5">
        <h3 className="text-h4 font-display text-stone-900">Good fit for</h3>
        <p className="mt-2 text-small text-stone-700">{goodFitFor(item, difficulty)}</p>
      </article>
      {alternative && (
        <article className="rounded-xl border border-stone-200 bg-white p-5">
          <h3 className="text-h4 font-display text-stone-900">Consider another trip if</h3>
          <p className="mt-2 text-small text-stone-700">{alternative}</p>
        </article>
      )}
    </div>
  )
}
