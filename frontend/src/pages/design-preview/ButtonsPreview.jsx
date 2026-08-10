// Preview scaffolding: every button variant, size, and state.
import Button from '../../components/common/Button.jsx'
import Card from '../../components/common/Card.jsx'

const VARIANTS = ['primary', 'secondary', 'ghost']
const SIZES = ['sm', 'md', 'lg']

export default function ButtonsPreview() {
  return (
    <div className="space-y-8">
      <Card padding="lg">
        <h3 className="text-h4 font-display text-stone-900">Variants</h3>
        <p className="mt-2 text-small text-stone-600">
          Amber is reserved for the action that earns money — booking and inquiry.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          {VARIANTS.map((variant) => (
            <Button key={variant} variant={variant}>
              {variant === 'primary' ? 'Book this trip' : variant === 'secondary' ? 'View itinerary' : 'Learn more'}
            </Button>
          ))}
        </div>
      </Card>

      <Card padding="lg">
        <h3 className="text-h4 font-display text-stone-900">Sizes</h3>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          {SIZES.map((size) => (
            <Button key={size} size={size}>
              Size {size}
            </Button>
          ))}
        </div>
      </Card>

      <Card padding="lg">
        <h3 className="text-h4 font-display text-stone-900">States</h3>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <Button disabled>Disabled</Button>
          <Button variant="secondary" disabled>
            Disabled
          </Button>
          <Button href="#design-preview-top" variant="ghost">
            Rendered as a link
          </Button>
        </div>
        <div className="mt-6 max-w-sm">
          <Button fullWidth>Full width</Button>
        </div>
      </Card>
    </div>
  )
}
