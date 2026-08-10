// The "good to know" sidebar on a destination page.
import Button from '../common/Button.jsx'
import Card from '../common/Card.jsx'

export default function DestinationFacts({ item }) {
  return (
    <Card padding="lg">
      <h3 className="text-h4 font-display text-stone-900">Good to know</h3>

      <dl className="mt-4 space-y-4 text-small">
        <div>
          <dt className="font-semibold text-stone-900">Best season</dt>
          <dd className="mt-1 text-stone-700">{item.bestSeason.join(', ')}</dd>
        </div>
        <div>
          <dt className="font-semibold text-stone-900">Highest point</dt>
          <dd className="mt-1 text-stone-700">
            {item.mapInfo.elevationMetres.toLocaleString('en-US')}m
          </dd>
        </div>
        <div>
          <dt className="font-semibold text-stone-900">Nearest airport</dt>
          <dd className="mt-1 text-stone-700">{item.mapInfo.nearestAirport}</dd>
        </div>
        <div>
          <dt className="font-semibold text-stone-900">Coordinates</dt>
          <dd className="mt-1 font-mono text-stone-700">
            {item.mapInfo.latitude}, {item.mapInfo.longitude}
          </dd>
        </div>
      </dl>

      {/* A real map arrives with the backend; this states the fact plainly. */}
      <div className="mt-6 flex aspect-landscape items-center justify-center rounded-lg bg-sand-200 text-center">
        <p className="px-4 text-small text-stone-600">Map preview is not part of this build</p>
      </div>

      <div className="mt-6">
        <Button href="/contact" fullWidth>
          Ask about {item.title}
        </Button>
      </div>
    </Card>
  )
}
