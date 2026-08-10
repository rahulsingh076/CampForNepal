// The "at a glance" sidebar on an activity page.
import Badge from '../common/Badge.jsx'
import Button from '../common/Button.jsx'
import Card from '../common/Card.jsx'

export default function ActivityFacts({ item }) {
  return (
    <Card padding="lg">
      <h3 className="text-h4 font-display text-stone-900">At a glance</h3>

      <dl className="mt-4 space-y-4 text-small">
        <div>
          <dt className="font-semibold text-stone-900">Difficulty</dt>
          <dd className="mt-1">
            <Badge tone="neutral">{item.difficulty}</Badge>
          </dd>
        </div>
        <div>
          <dt className="font-semibold text-stone-900">Best season</dt>
          <dd className="mt-1 text-stone-700">{item.bestSeason.join(', ')}</dd>
        </div>
        <div>
          <dt className="font-semibold text-stone-900">Permits required</dt>
          <dd className="mt-1 text-stone-700">
            {item.requiredPermits.length === 0 ? (
              'None for this activity.'
            ) : (
              <ul className="space-y-1">
                {item.requiredPermits.map((permit) => (
                  <li key={permit}>{permit}</li>
                ))}
              </ul>
            )}
          </dd>
        </div>
      </dl>

      <div className="mt-6">
        <Button href="/contact" fullWidth>
          Ask us about this
        </Button>
      </div>
    </Card>
  )
}
