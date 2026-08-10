// Preview scaffolding: the non-colour tokens — radius, shadow, spacing, z-index.
import Card from '../../components/common/Card.jsx'
import { radii, shadows, spacingScale, zIndex } from '../../config/designTokens.js'

export default function TokensPreview() {
  return (
    <div className="space-y-8">
      <Card padding="lg">
        <h3 className="text-h4 font-display text-stone-900">Corner radius</h3>
        <div className="mt-6 flex flex-wrap gap-4">
          {radii.map((name) => (
            <div key={name} className="text-center">
              <div
                className="h-20 w-20 bg-primary-100 ring-1 ring-primary-200"
                style={{ borderRadius: `var(--radius-${name})` }}
              />
              <p className="mt-2 text-small font-mono text-stone-500">{name}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card padding="lg">
        <h3 className="text-h4 font-display text-stone-900">Shadows</h3>
        <p className="mt-2 text-small text-stone-600">
          Warm-tinted, never black — a black shadow on sand looks cheap.
        </p>
        <div className="mt-6 flex flex-wrap gap-6">
          {shadows.map((name) => (
            <div key={name} className="text-center">
              <div
                className="h-20 w-24 rounded-xl bg-white"
                style={{ boxShadow: `var(--shadow-${name})` }}
              />
              <p className="mt-3 text-small font-mono text-stone-500">{name}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card padding="lg">
        <h3 className="text-h4 font-display text-stone-900">Spacing — the 4px scale</h3>
        <div className="mt-6 space-y-2">
          {spacingScale.map((step) => (
            <div key={step} className="flex items-center gap-4">
              <span className="w-16 text-small font-mono text-stone-500">
                {step} = {step * 4}px
              </span>
              <span
                className="h-3 rounded-sm bg-amber-300"
                style={{ width: `calc(var(--spacing) * ${step})` }}
              />
            </div>
          ))}
        </div>
      </Card>

      <Card padding="lg">
        <h3 className="text-h4 font-display text-stone-900">Stacking order</h3>
        <p className="mt-2 text-small text-stone-600">
          Named z-index steps, so no component invents its own number.
        </p>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {Object.entries(zIndex).map(([name, value]) => (
            <li key={name} className="flex justify-between rounded-md bg-sand-100 px-3 py-2">
              <span className="text-small font-mono text-stone-700">z-{name}</span>
              <span className="text-small font-mono text-stone-500">{value}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
