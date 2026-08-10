// Preview scaffolding: every colour ramp, read straight from the CSS tokens.
import Card from '../../components/common/Card.jsx'
import { colorRamps, colorToken, rampSteps } from '../../config/designTokens.js'

export default function ColorsPreview() {
  return (
    <div className="space-y-6">
      {Object.entries(colorRamps).map(([ramp, purpose]) => (
        <Card key={ramp} padding="lg">
          <h3 className="text-h4 font-display text-stone-900">{ramp}</h3>
          <p className="mt-1 text-small text-stone-600">{purpose}</p>
          <div className="mt-4 grid grid-cols-5 gap-2 sm:grid-cols-10">
            {rampSteps.map((step) => (
              <div key={step}>
                <div
                  className="h-12 w-full rounded-md ring-1 ring-stone-900/10"
                  style={{ backgroundColor: colorToken(ramp, step) }}
                />
                <p className="mt-1 text-center text-small font-mono text-stone-500">{step}</p>
              </div>
            ))}
          </div>
        </Card>
      ))}

      <Card padding="lg">
        <h3 className="text-h4 font-display text-stone-900">Surfaces and overlay</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <div className="h-20 w-full rounded-md bg-cream ring-1 ring-stone-900/10" />
            <p className="mt-1 text-small font-mono text-stone-500">cream — card surface</p>
          </div>
          <div>
            <div className="h-20 w-full rounded-md bg-white ring-1 ring-stone-900/10" />
            <p className="mt-1 text-small font-mono text-stone-500">white</p>
          </div>
          <div>
            <div className="hero-overlay flex h-20 w-full items-end rounded-md bg-primary-400 p-2">
              <span className="text-small font-semibold text-white">White text stays readable</span>
            </div>
            <p className="mt-1 text-small font-mono text-stone-500">hero-overlay</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
